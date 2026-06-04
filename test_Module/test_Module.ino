#include <WiFi.h>
#include <Wire.h>
#include <BH1750.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>

// Thêm các helper cho Firebase Client
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// --- Cấu hình Firebase ---
#define FIREBASE_HOST "smart-green-house-iot-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "1Gi5Y2PkpsymHPnnBAQAXHY8e6AyWf4OdqFwheer"

// --- Định nghĩa các chân kết nối ---
#define SOIL_PIN 1         // Cảm biến độ ẩm đất (Analog)
#define WATER_FLOAT_PIN 6  // Phao cảm biến mực nước (Digital)
#define PUMP_PIN 4         // Relay 1 - Máy bơm (Kích HIGH)
#define LIGHT_PIN 5        // Relay 2 - Đèn (Kích HIGH)

// --- Cấu hình mức kích rơ-le (BẬT/TẮT) ---
// Nếu Relay kích mức THẤP (Active LOW): đổi ON thành LOW, OFF thành HIGH
// Nếu Relay kích mức CAO (Active HIGH): giữ ON là HIGH, OFF là LOW
#define PUMP_ON HIGH
#define PUMP_OFF LOW

#define LIGHT_ON HIGH
#define LIGHT_OFF LOW

// Khởi tạo cảm biến và đối tượng Firebase
BH1750 lightMeter;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// --- Các biến lưu trạng thái cảm biến ---
int soilRaw = 4095;
float lux = 0.0;
bool isWaterLow = true;

// --- Các ngưỡng cấu hình mặc định ---
int soilMin = 3000;        // Ngưỡng bắt đầu tưới (Đất khô -> raw tăng cao)
int soilMax = 1500;        // Ngưỡng dừng tưới (Đất ẩm -> raw giảm xuống)
float luxMin = 200.0;      // Ngưỡng bật đèn khi trời tối
bool pumpManual = false;   // Trạng thái bật bơm thủ công từ web
bool lightManual = false;  // Trạng thái bật đèn thủ công từ web

// --- Quản lý chu kỳ bơm nước tự động ---
unsigned long lastPumpTime = 0;
unsigned long lastFirebaseUpload = 0;
bool isPumpIntervalWaiting = false; 

const unsigned long PUMP_RUN_DURATION = 5000;  // Bơm chạy 5 giây
const unsigned long PUMP_WAIT_DURATION = 10000; // Nghỉ 10 giây chờ nước thấm

void setup() {
  Serial.begin(115200);

  // Cấu hình chân Relay điều khiển
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, PUMP_OFF);
  digitalWrite(LIGHT_PIN, LIGHT_OFF);

  // Cấu hình phao nước (PULLUP nội bộ)
  pinMode(WATER_FLOAT_PIN, INPUT_PULLUP);

  // Khởi tạo I2C cho cảm biến ánh sáng BH1750 (GY-302)
  Wire.begin(8, 9);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("Cảm biến BH1750 (GY-302) đã sẵn sàng!"));
  } else {
    Serial.println(F("Lỗi! Không kết nối được cảm biến BH1750."));
  }

  // Khởi tạo WiFiManager cấu hình WiFi tự động
  WiFiManager wm;
  Serial.println("Đang kết nối WiFi cũ hoặc phát AP 'ESP32_TuoiCay_Config'...");
  wm.autoConnect("ESP32_TuoiCay_Config");
  Serial.println("Kết nối WiFi thành công! Đang cấu hình Firebase...");

  // Cấu hình Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.reconnectNetwork(true);
  Firebase.begin(&config, &auth);

  Serial.println("Thiết lập hệ thống hoàn tất. Bắt đầu luồng kiểm soát!");
}

void loop() {
  if (!Firebase.ready()) return;
  unsigned long currentMillis = millis();

  // ============================================================
  // Task 1: Đọc cảm biến & Đồng bộ dữ liệu Firebase (Mỗi 2 giây)
  // ============================================================
  if (currentMillis - lastFirebaseUpload >= 2000) {
    lastFirebaseUpload = currentMillis;

    // Đọc cảm biến thực tế
    soilRaw = analogRead(SOIL_PIN);
    lux = lightMeter.readLightLevel();
    isWaterLow = (digitalRead(WATER_FLOAT_PIN) == HIGH); // HIGH là hết nước, LOW là còn nước

    // 1.1 Gửi dữ liệu sensor lên Firebase
    FirebaseJson sensorJson;
    sensorJson.set("soil_raw", soilRaw);
    sensorJson.set("lux", lux);
    sensorJson.set("water_status", isWaterLow ? "HET_NUOC" : "CON_NUOC");
    
    if (Firebase.RTDB.setJSON(&fbdo, "/sensor", &sensorJson)) {
      Serial.printf("[Firebase Send] Gửi thành công: Soil=%d, Lux=%.1f, Water=%s\n", 
                    soilRaw, lux, isWaterLow ? "HẾT NƯỚC" : "CÒN NƯỚC");
    } else {
      Serial.println("[Firebase Error] Lỗi gửi dữ liệu cảm biến: " + fbdo.errorReason());
    }

    // 1.2 Đọc các thông số cấu hình và lệnh điều khiển từ Firebase
    if (Firebase.RTDB.getJSON(&fbdo, "/setting")) {
      FirebaseJson &json = fbdo.jsonObject();
      FirebaseJsonData jsonData;
      
      json.get(jsonData, "soil_min");
      if (jsonData.success) soilMin = jsonData.intValue;
      
      json.get(jsonData, "soil_max");
      if (jsonData.success) soilMax = jsonData.intValue;
      
      json.get(jsonData, "lux_min");
      if (jsonData.success) luxMin = jsonData.floatValue;
    }

    if (Firebase.RTDB.getJSON(&fbdo, "/control")) {
      FirebaseJson &json = fbdo.jsonObject();
      FirebaseJsonData jsonData;
      
      json.get(jsonData, "pump_manual");
      if (jsonData.success) pumpManual = jsonData.boolValue;
      
      json.get(jsonData, "light_manual");
      if (jsonData.success) lightManual = jsonData.boolValue;
    }
  }

  // ============================================================
  // Task 2: Logic điều khiển máy bơm (Bơm tự động / Thủ công / Khóa an toàn)
  // ============================================================
  if (isWaterLow) {
    // KHÓA AN TOÀN: Bể hết nước -> Cấm chạy bơm ngay lập tức để bảo vệ thiết bị
    digitalWrite(PUMP_PIN, PUMP_OFF);
    isPumpIntervalWaiting = false;
  } 
  else if (pumpManual) {
    // Chế độ thủ công: Bật bơm trực tiếp từ Web Dashboard
    digitalWrite(PUMP_PIN, PUMP_ON);
    isPumpIntervalWaiting = false;
  } 
  else {
    // Chế độ tự động
    // Nếu đất khô (chỉ số raw vượt quá mức tối thiểu soilMin) và đang không trong chu kỳ chờ thấm nước
    if (soilRaw >= soilMin && !isPumpIntervalWaiting) {
      digitalWrite(PUMP_PIN, PUMP_ON);
      lastPumpTime = currentMillis;
      isPumpIntervalWaiting = true; 
      Serial.println("[BƠM TỰ ĐỘNG] Đất khô! Kích hoạt bơm nước (5 giây)...");
    }

    // Xử lý chu kỳ Bơm (5s) và Chờ thấm (10s)
    if (isPumpIntervalWaiting) {
      if (digitalRead(PUMP_PIN) == PUMP_ON) {
        // Nếu bơm đang chạy và đã đủ 5 giây -> Tắt bơm
        if (currentMillis - lastPumpTime >= PUMP_RUN_DURATION) {
          digitalWrite(PUMP_PIN, PUMP_OFF);
          lastPumpTime = currentMillis; // Bắt đầu tính thời gian chờ thấm
          Serial.println("[BƠM TỰ ĐỘNG] Đủ 5s chạy. Tắt bơm, chờ nước thấm (10 giây)...");
        }
      } 
      else {
        // Nếu bơm đang tắt và đã đợi đủ 10 giây -> Cho phép đánh giá lại cảm biến ở chu kỳ sau
        if (currentMillis - lastPumpTime >= PUMP_WAIT_DURATION) {
          isPumpIntervalWaiting = false;
          Serial.println("[BƠM TỰ ĐỘNG] Đã hết 10 giây chờ thấm. Đang đánh giá lại độ ẩm đất...");
        }
      }
    } else {
      // Đảm bảo bơm luôn TẮT khi không có lệnh tưới tự động (khắc phục lỗi chuyển từ thủ công sang tự động vẫn tiếp tục bơm)
      digitalWrite(PUMP_PIN, PUMP_OFF);
    }
  }

  // ============================================================
  // Task 3: Logic điều khiển đèn chiếu sáng (Tự động / Thủ công)
  // ============================================================
  if (lightManual) {
    // Bật đèn thủ công từ web
    digitalWrite(LIGHT_PIN, LIGHT_ON);
  } else {
    // Tự động bật đèn khi cường độ sáng yếu hơn ngưỡng cài đặt
    if (lux < luxMin) {
      digitalWrite(LIGHT_PIN, LIGHT_ON);
    } else {
      digitalWrite(LIGHT_PIN, LIGHT_OFF);
    }
  }
}