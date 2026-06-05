import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'node:dns';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';

// Thiết lập DNS của Google để sửa lỗi querySrv ECONNREFUSED khi kết nối MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('>>> Đã kết nối thành công tới MongoDB Atlas!');
    seedDefaultUser();
    migrateActivityLogs();
    cleanupOldData();
  })
  .catch(err => console.error('>>> Lỗi kết nối MongoDB Atlas:', err));

// Tự động xóa collection activity_logs cũ nếu dùng schema phẳng
async function migrateActivityLogs() {
  try {
    const col = mongoose.connection.db.collection('activity_logs');
    const old = await col.findOne({ type: { $exists: true } });
    if (old) {
      await col.drop();
      console.log('>>> Đã xóa activity_logs cũ (schema phẳng) → sẽ tạo lại với schema nhóm ngày.');
    }
  } catch (e) {
    // collection không tồn tại hoặc đã đúng schema → bỏ qua
  }
}


// Định nghĩa Schema cho Tài Khoản Người Dùng (Users)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, default: 'vonhacphuoc@gmail.com' },
  emailAlertEnabled: { type: Boolean, default: true },
  waterAlertEnabled: { type: Boolean, default: true },
  waterAlertThreshold: { type: Number, default: 15 }
});

const User = mongoose.model('User', userSchema, 'users');

// Hàm tạo tài khoản mặc định nếu chưa tồn tại
async function seedDefaultUser() {
  try {
    const userExist = await User.findOne({ username: 'nhacphuoc25' });
    if (!userExist) {
      const defaultUser = new User({
        username: 'nhacphuoc25',
        password: '02082005',
        email: 'vonhacphuoc@gmail.com'
      });
      await defaultUser.save();
      console.log('>>> Đã tạo tài khoản mặc định trong MongoDB Atlas: nhacphuoc25 / 02082005 / vonhacphuoc@gmail.com');
    } else if (!userExist.email) {
      userExist.email = 'vonhacphuoc@gmail.com';
      await userExist.save();
      console.log('>>> Đã cập nhật email mặc định cho người dùng nhacphuoc25.');
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo tài khoản mặc định:', err);
  }
}

// Định nghĩa Schema cho Sensor Log
const sensorLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  soil_raw: Number,
  lux: Number,
  water_status: String,
  pump_status: String,
  light_status: String
});

// Tạo Model kết nối tới database 'smart_green_house' và collection 'sensor_logs'
const SensorLog = mongoose.model('SensorLog', sensorLogSchema, 'sensor_logs');

<<<<<<< HEAD
// Định nghĩa Schema cho Lượng nước tiêu thụ hàng ngày (Daily Water)
const dailyWaterSchema = new mongoose.Schema({
  date:      { type: String, required: true, unique: true }, // YYYY-MM-DD
  amount_ml: { type: Number, default: 0 }
});
const DailyWater = mongoose.model('DailyWater', dailyWaterSchema, 'daily_water');
=======
// Định nghĩa Schema cho Nhật ký hoạt động (Activity Logs)
const activityLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['pump', 'light', 'water', 'system'], required: true },
  status: { type: String, required: true },
  message: { type: String, required: true }
});

// Tạo Model kết nối tới database 'smart_green_house' và collection 'activity_logs'
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');
>>>>>>> 8ef5c97147c831e4bea67037c8041cc2feb53dfd

// API: Lấy lịch sử dữ liệu cảm biến (giới hạn 100 bản ghi mới nhất)
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await SensorLog.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Đảo ngược lại danh sách để vẽ biểu đồ theo chiều thời gian tăng dần (cũ -> mới)
    res.json(logs.reverse());
  } catch (error) {
    console.error('Lỗi khi truy vấn logs:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu lịch sử.' });
  }
});

// API: Lấy nhật ký hoạt động mới nhất (giới hạn 20 bản ghi)
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(activities);
  } catch (error) {
    console.error('Lỗi khi truy vấn nhật ký hoạt động:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu nhật ký hoạt động.' });
  }
});

// API phụ: kiểm tra trạng thái hoạt động của server
app.get('/api/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date() });
});

// API: Đăng nhập tài khoản từ Web Frontend
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' });
    }
    
    res.json({ success: true, username: user.username });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ!' });
  }
});

<<<<<<< HEAD
// ══════════════════════════════════════════════
// Schema & API: Mực nước bể (tank_state)
// ══════════════════════════════════════════════
const tankStateSchema = new mongoose.Schema({
  key:        { type: String, default: 'main' },
  water_pct:  { type: Number, default: 100 },
  updated_at: { type: Date,   default: Date.now }
});
const TankState = mongoose.model('TankState', tankStateSchema, 'tank_state');

// GET /api/tank – lấy mực nước hiện tại
app.get('/api/tank', async (req, res) => {
  try {
    let tank = await TankState.findOne({ key: 'main' });
    if (!tank) {
      tank = await new TankState({ key: 'main', water_pct: 100 }).save();
    }
    res.json({ water_pct: tank.water_pct });
  } catch (error) {
    console.error('Lỗi GET /api/tank:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu mực nước.' });
  }
});

// PATCH /api/tank – cập nhật mực nước
app.patch('/api/tank', async (req, res) => {
  const { water_pct } = req.body;
  if (water_pct === undefined) {
    return res.status(400).json({ error: 'Thiếu trường water_pct.' });
  }
  try {
    const pct = Math.max(0, Math.min(100, Math.round(Number(water_pct))));
    await TankState.findOneAndUpdate(
      { key: 'main' },
      { water_pct: pct, updated_at: new Date() },
      { upsert: true, new: true }
    );
    console.log(`>>> Đã lưu mực nước bể: ${pct}%`);
    res.json({ water_pct: pct });
  } catch (error) {
    console.error('Lỗi PATCH /api/tank:', error);
    res.status(500).json({ error: 'Không thể cập nhật mực nước.' });
  }
});

// ══════════════════════════════════════════════
// Schema & API: Nhật ký hoạt động (activity_logs)
// Cấu trúc: 1 document/ngày, phân theo mục
// { date, den:[{time,action}], bom:[{time,action}], canh_bao:[{time,action}] }
// ══════════════════════════════════════════════
const entrySchema = new mongoose.Schema(
  { time: String, action: String },
  { _id: false }
);
const activityLogSchema = new mongoose.Schema({
  date:      { type: String, required: true, unique: true }, // YYYY-MM-DD
  den:       { type: [entrySchema], default: [] },
  bom:       { type: [entrySchema], default: [] },
  canh_bao:  { type: [entrySchema], default: [] },
  lich:      { type: [entrySchema], default: [] },
});
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');

// Mapping type → category
const TYPE_TO_CAT = {
  light_on:     'den',
  light_off:    'den',
  water_auto:   'bom',
  water_manual: 'bom',
  pump_off:     'bom',
  water_low:    'canh_bao',
  emergency:    'canh_bao',
  schedule:     'lich',
};

// POST /api/activity – upsert vào ngày hôm nay
app.post('/api/activity', async (req, res) => {
  const { type, title, desc } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'Thiếu type hoặc title.' });

  const cat = TYPE_TO_CAT[type] || 'canh_bao';
  const now  = new Date();
  // date theo giờ Việt Nam (UTC+7)
  const vnDate = new Date(now.getTime() + 7 * 3600000);
  const dateStr = vnDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = vnDate.toISOString().slice(11, 16); // HH:MM
  const action  = desc ? `${title} – ${desc}` : title;

  try {
    // Tránh ghi trùng log nếu nhiều client/tab gửi cùng lúc
    const existing = await ActivityLog.findOne({ date: dateStr });
    let isDuplicate = false;
    if (existing && existing[cat]) {
      isDuplicate = existing[cat].some(e => e.action === action && e.time === timeStr);
    }

    if (isDuplicate) {
      return res.json({ success: true, message: 'Nhật ký trùng lặp, bỏ qua.' });
    }

    await ActivityLog.findOneAndUpdate(
      { date: dateStr },
      { $push: { [cat]: { time: timeStr, action } } },
      { upsert: true, new: true }
    );
    console.log(`>>> Nhật ký [${dateStr}][${cat}] ${timeStr}: ${action}`);

    // Cộng dồn lượng nước tiêu hao vào cơ sở dữ liệu khi có sự kiện tưới nước
    let waterAdd = 0;
    if (type === 'water_auto') {
      waterAdd = 120; // Auto: 120ml
    } else if (type === 'water_manual') {
      waterAdd = 45;  // Thủ công: 45ml
    }

    if (waterAdd > 0) {
      await DailyWater.findOneAndUpdate(
        { date: dateStr },
        { $inc: { amount_ml: waterAdd } },
        { upsert: true, new: true }
      );
      console.log(`>>> [Water Accumulated via API] +${waterAdd}ml cho ngày ${dateStr}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Lỗi POST /api/activity:', error);
    res.status(500).json({ error: 'Không thể lưu nhật ký.' });
  }
});

// GET /api/activity – lấy 7 ngày gần nhất
app.get('/api/activity', async (req, res) => {
  try {
    const days = await ActivityLog.find().sort({ date: -1 }).limit(7);
    res.json(days);
  } catch (error) {
    console.error('Lỗi GET /api/activity:', error);
    res.status(500).json({ error: 'Không thể lấy nhật ký.' });
  }
});

// GET /api/activity/list – lấy nhật ký phân trang theo mục (den / bom / canh_bao / all)
app.get('/api/activity/list', async (req, res) => {
  const { category = 'all', limit = 10, skip = 0 } = req.query;
  const lim = parseInt(limit);
  const skp = parseInt(skip);
  
  if (!['den', 'bom', 'canh_bao', 'lich', 'all'].includes(category)) {
    return res.status(400).json({ error: 'Category không hợp lệ.' });
  }
  
  try {
    const days = await ActivityLog.find().sort({ date: -1 });
    let allEntries = [];
    
    for (const day of days) {
      const cats = category === 'all' ? ['den', 'bom', 'canh_bao', 'lich'] : [category];
      const dayEntries = [];
      
      for (const cat of cats) {
        const entries = day[cat] || [];
        entries.forEach(e => {
          dayEntries.push({
            date: day.date,
            time: e.time,
            action: e.action,
            category: cat
          });
        });
      }
      
      // Sắp xếp các entry trong cùng một ngày theo thời gian giảm dần
      dayEntries.sort((a, b) => b.time.localeCompare(a.time));
      allEntries.push(...dayEntries);
    }
    
    const paginated = allEntries.slice(skp, skp + lim);
    res.json(paginated);
  } catch (error) {
    console.error('Lỗi GET /api/activity/list:', error);
    res.status(500).json({ error: 'Không thể lấy danh sách nhật ký.' });
  }
});

// GET /api/water/daily – lấy lượng nước tiêu thụ của tuần này (Thứ 2 đến Chủ Nhật)
app.get('/api/water/daily', async (req, res) => {
  try {
    const now = new Date();
    const vnDate = new Date(now.getTime() + 7 * 3600000);
    const currentDay = vnDate.getDay();
    const diff = vnDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(vnDate.setDate(diff));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }
    
    const records = await DailyWater.find({ date: { $in: weekDates } });
    const recordMap = {};
    records.forEach(r => {
      recordMap[r.date] = r.amount_ml;
    });
    
    const result = weekDates.map(dateStr => {
      const ml = recordMap[dateStr] || 0;
      return parseFloat((ml / 1000).toFixed(3)); // Lít
    });
    
    res.json(result);
  } catch (error) {
    console.error('Lỗi GET /api/water/daily:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu lượng nước.' });
  }
});

// Lưu trạng thái trước đó để phát hiện thay đổi
let lastSyncPump = null;
let lastSyncLight = null;

async function saveActivityLogBackend(type, title, desc) {
  const cat = TYPE_TO_CAT[type] || 'canh_bao';
  const now  = new Date();
  const vnDate = new Date(now.getTime() + 7 * 3600000);
  const dateStr = vnDate.toISOString().slice(0, 10);
  const timeStr = vnDate.toISOString().slice(11, 16);
  const action  = desc ? `${title} – ${desc}` : title;
  
  try {
    await ActivityLog.findOneAndUpdate(
      { date: dateStr },
      { $push: { [cat]: { time: timeStr, action } } },
      { upsert: true, new: true }
    );
    console.log(`>>> [Backend Auto Log] [${dateStr}][${cat}] ${timeStr}: ${action}`);
  } catch (error) {
    console.error('Lỗi khi ghi log tự động từ backend:', error);
  }
}
=======
// Lưu trạng thái trước đó để phát hiện thay đổi
let lastPumpStatus = null;
let lastLightStatus = null;
let lastWaterStatus = null;
>>>>>>> 8ef5c97147c831e4bea67037c8041cc2feb53dfd

// Logic chạy ngầm: Tự động lấy dữ liệu từ Firebase và ghi vào MongoDB Atlas
async function syncFirebaseToMongo() {
  try {
    const dbUrl = process.env.FIREBASE_DB_URL.endsWith('/') 
      ? process.env.FIREBASE_DB_URL 
      : `${process.env.FIREBASE_DB_URL}/`;
    
    const firebaseUrl = `${dbUrl}sensor.json?auth=${process.env.FIREBASE_SECRET}`;
    
    const response = await fetch(firebaseUrl);
    if (!response.ok) {
      throw new Error(`Firebase HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data) {
      const { soil_raw, lux, water_status, pump_status, light_status } = data;
      const currentPump = pump_status || 'OFF';
      const currentLight = light_status || 'OFF';
      const currentWater = water_status || 'UNKNOWN';

      // Khôi phục trạng thái cũ từ DB nếu server mới restart
<<<<<<< HEAD
      if (lastSyncPump === null || lastSyncLight === null) {
        const lastLog = await SensorLog.findOne().sort({ timestamp: -1 });
        if (lastLog) {
          lastSyncPump = lastLog.pump_status || 'OFF';
          lastSyncLight = lastLog.light_status || 'OFF';
        } else {
          lastSyncPump = 'OFF';
          lastSyncLight = 'OFF';
=======
      if (lastPumpStatus === null || lastLightStatus === null || lastWaterStatus === null) {
        const lastLog = await SensorLog.findOne().sort({ timestamp: -1 });
        if (lastLog) {
          lastPumpStatus = lastLog.pump_status || 'OFF';
          lastLightStatus = lastLog.light_status || 'OFF';
          lastWaterStatus = lastLog.water_status || 'UNKNOWN';
        } else {
          lastPumpStatus = 'OFF';
          lastLightStatus = 'OFF';
          lastWaterStatus = 'CON_NUOC';
>>>>>>> 8ef5c97147c831e4bea67037c8041cc2feb53dfd
        }
      }

      // Phát hiện và ghi nhận sự kiện hoạt động
      // 1. Máy bơm
<<<<<<< HEAD
      if (currentPump !== lastSyncPump) {
        let waterAdd = 0;
        
        if (currentPump === 'ON_AUTO') {
          await saveActivityLogBackend('water_auto', 'Tưới nước tự động', 'Đất khô, tự động kích hoạt tưới nước (5 giây).');
          waterAdd = 120; // 120ml
        } else if (currentPump === 'ON_MANUAL') {
          waterAdd = 45; // 45ml
        } else if (currentPump === 'OFF' && lastSyncPump === 'ON_AUTO') {
          await saveActivityLogBackend('pump_off', 'Tắt máy bơm', 'Tự động tắt máy bơm sau khi tưới xong (5 giây).');
        }
        
        if (waterAdd > 0) {
          const now = new Date();
          const vnDate = new Date(now.getTime() + 7 * 3600000);
          const dateStr = vnDate.toISOString().slice(0, 10);
          
          await DailyWater.findOneAndUpdate(
            { date: dateStr },
            { $inc: { amount_ml: waterAdd } },
            { upsert: true, new: true }
          );
          console.log(`>>> [Daily Water] +${waterAdd}ml cho ngày ${dateStr}`);
        }
        
        lastSyncPump = currentPump;
      }

      // 2. Đèn LED
      if (currentLight !== lastSyncLight) {
        if (currentLight === 'ON_AUTO') {
          await saveActivityLogBackend('light_on', 'Bật đèn LED tự động', `Cường độ sáng thấp (${Math.round(lux !== undefined ? lux : 0)} Lux). Bật đèn tự động.`);
        } else if (currentLight === 'OFF' && lastSyncLight === 'ON_AUTO') {
          await saveActivityLogBackend('light_off', 'Tắt đèn LED tự động', `Cường độ sáng cao (${Math.round(lux !== undefined ? lux : 0)} Lux). Tắt đèn tự động.`);
        }
        lastSyncLight = currentLight;
=======
      if (currentPump !== lastPumpStatus) {
        let msg = '';
        if (currentPump === 'ON_AUTO') {
          msg = `Máy bơm đã bật tự động do đất khô (Độ ẩm: ${Math.max(0, Math.min(100, Math.round(((4095 - (soil_raw !== undefined ? soil_raw : 4095)) / 4095) * 100)))}%).`;
        } else if (currentPump === 'ON_MANUAL') {
          msg = 'Máy bơm đã được bật thủ công từ ứng dụng.';
        } else if (currentPump === 'OFF') {
          if (lastPumpStatus === 'ON_AUTO') {
            msg = 'Máy bơm đã tắt tự động sau khi hoàn thành chu kỳ tưới.';
          } else {
            msg = 'Máy bơm đã được tắt.';
          }
        }
        
        if (msg) {
          const actLog = new ActivityLog({
            type: 'pump',
            status: currentPump,
            message: msg
          });
          await actLog.save();
          console.log(`[Activity Log] ${msg}`);
        }
        lastPumpStatus = currentPump;
      }

      // 2. Đèn LED
      if (currentLight !== lastLightStatus) {
        let msg = '';
        if (currentLight === 'ON_AUTO') {
          msg = `Đèn LED tự động bật do cường độ sáng thấp (${Math.round(lux !== undefined ? lux : 0)} Lux).`;
        } else if (currentLight === 'ON_MANUAL') {
          msg = 'Đèn LED đã được bật thủ công từ ứng dụng.';
        } else if (currentLight === 'OFF') {
          if (lastLightStatus === 'ON_AUTO') {
            msg = `Đèn LED tự động tắt khi trời sáng (${Math.round(lux !== undefined ? lux : 0)} Lux).`;
          } else {
            msg = 'Đèn LED đã được tắt.';
          }
        }
        
        if (msg) {
          const actLog = new ActivityLog({
            type: 'light',
            status: currentLight,
            message: msg
          });
          await actLog.save();
          console.log(`[Activity Log] ${msg}`);
        }
        lastLightStatus = currentLight;
      }

      // 3. Mực nước
      if (currentWater !== lastWaterStatus && currentWater !== 'UNKNOWN') {
        let msg = '';
        if (currentWater === 'HET_NUOC') {
          msg = 'Cảnh báo: Bể hết nước! Máy bơm đã tự động ngắt để bảo vệ.';
        } else if (currentWater === 'CON_NUOC') {
          msg = 'Bể đã được châm thêm nước đầy đủ.';
        }
        
        if (msg) {
          const actLog = new ActivityLog({
            type: 'water',
            status: currentWater,
            message: msg
          });
          await actLog.save();
          console.log(`[Activity Log] ${msg}`);
        }
        lastWaterStatus = currentWater;
>>>>>>> 8ef5c97147c831e4bea67037c8041cc2feb53dfd
      }

      // Tạo bản ghi log mới
      const newLog = new SensorLog({
        soil_raw: soil_raw !== undefined ? soil_raw : 4095,
        lux: lux !== undefined ? lux : 0,
        water_status: currentWater,
        pump_status: currentPump,
        light_status: currentLight
      });
      
      await newLog.save();
      console.log(`[${new Date().toLocaleTimeString()}] Đồng bộ thành công: soil_raw=${soil_raw}, lux=${lux}, water=${currentWater}, pump=${currentPump}, light=${currentLight}`);
    } else {
      console.warn('[Sync Warning] Firebase không trả về dữ liệu tại node /sensor');
    }
  } catch (error) {
    console.error('[Sync Error] Lỗi đồng bộ dữ liệu từ Firebase sang MongoDB:', error.message);
  }
}

// Khởi chạy đồng bộ ngầm định kỳ
const syncIntervalMs = Number(process.env.SYNC_INTERVAL_MS) || 300000;
console.log(`>>> Thiết lập đồng bộ Firebase -> MongoDB mỗi ${syncIntervalMs / 1000} giây.`);
setInterval(syncFirebaseToMongo, syncIntervalMs);

// Thực hiện đồng bộ ngay một lần khi khởi động server
setTimeout(syncFirebaseToMongo, 3000);

// GET /api/monthly-summary – Tổng kết tháng hiện tại và so sánh tháng trước
app.get('/api/monthly-summary', async (req, res) => {
  try {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600000);
    const year = vnNow.getUTCFullYear();
    const month = vnNow.getUTCMonth() + 1; // 1–12

    // Khoảng ngày tháng này và tháng trước
    const thisMonthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const thisMonthEnd   = `${year}-${String(month).padStart(2, '0')}-31`;

    const prevMonthNum  = month === 1 ? 12 : month - 1;
    const prevMonthYear = month === 1 ? year - 1 : year;
    const prevMonthStart = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-01`;
    const prevMonthEnd   = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-31`;

    // 1. Lượng nước tháng này và tháng trước
    const [thisWater, prevWater] = await Promise.all([
      DailyWater.find({ date: { $gte: thisMonthStart, $lte: thisMonthEnd } }),
      DailyWater.find({ date: { $gte: prevMonthStart, $lte: prevMonthEnd } })
    ]);

    const thisWaterTotal = thisWater.reduce((s, r) => s + r.amount_ml, 0);
    const prevWaterTotal = prevWater.reduce((s, r) => s + r.amount_ml, 0);

    // Tính % tiết kiệm nước so với tháng trước (dương = tiết kiệm, âm = tăng)
    let waterSavingPct = null;
    if (prevWaterTotal > 0) {
      waterSavingPct = Math.round(((prevWaterTotal - thisWaterTotal) / prevWaterTotal) * 100);
    }

    // 2. Số lần tưới tự động tháng này (đếm bom entries trong activity_logs)
    const thisActivityDays = await ActivityLog.find({
      date: { $gte: thisMonthStart, $lte: thisMonthEnd }
    });
    let autoPumpCount = 0;
    thisActivityDays.forEach(day => {
      (day.bom || []).forEach(e => {
        if (e.action && e.action.toLowerCase().includes('tự động')) autoPumpCount++;
      });
    });

    // 3. TB cường độ ánh sáng tháng này (từ sensor_logs)
    const thisMonthStartDate = new Date(`${thisMonthStart}T00:00:00+07:00`);
    const sensorLogs = await SensorLog.find({
      timestamp: { $gte: thisMonthStartDate }
    }).select('lux');

    let avgLux = null;
    if (sensorLogs.length > 0) {
      avgLux = Math.round(sensorLogs.reduce((s, l) => s + (l.lux || 0), 0) / sensorLogs.length);
    }

    res.json({
      month,
      year,
      avg_lux: avgLux,
      auto_pump_count: autoPumpCount,
      water_saving_pct: waterSavingPct,
      this_water_ml: thisWaterTotal,
      prev_water_ml: prevWaterTotal
    });
  } catch (error) {
    console.error('Lỗi GET /api/monthly-summary:', error);
    res.status(500).json({ error: 'Không thể lấy tổng kết tháng.' });
  }
});

// ══════════════════════════════════════════════
// Email Alert: Cảnh báo hết nước qua Gmail
// ══════════════════════════════════════════════
let _waterAlertSentAt = null; // Chống gửi email spam – chỉ gửi mỗi 30 phút

function createMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL_FROM,
      pass: process.env.ALERT_EMAIL_PASS
    }
  });
}

async function sendWaterLowEmail() {
  const now = Date.now();
  // Chỉ gửi nếu chưa gửi hoặc đã qua 30 phút
  if (_waterAlertSentAt && now - _waterAlertSentAt < 30 * 60 * 1000) {
    console.log('>>> [Email] Đã gửi cảnh báo gần đây, bỏ qua để tránh spam.');
    return { skipped: true };
  }

  // Lấy email từ MongoDB của user nhacphuoc25
  let recipientEmail = process.env.ALERT_EMAIL_TO;
  try {
    const user = await User.findOne({ username: 'nhacphuoc25' });
    if (user) {
      if (user.email) recipientEmail = user.email;
      if (user.emailAlertEnabled === false) {
        console.log('>>> [Email] Người dùng đã tắt nhận toàn bộ thông báo email. Bỏ qua gửi cảnh báo.');
        return { skipped: true, reason: 'disabled_by_user' };
      }
      if (user.waterAlertEnabled === false) {
        console.log('>>> [Email] Người dùng đã tắt nhận thông báo nước thấp. Bỏ qua gửi cảnh báo.');
        return { skipped: true, reason: 'water_alert_disabled' };
      }
    }
  } catch (dbErr) {
    console.error('>>> [Email] Lỗi khi truy vấn email người nhận từ DB:', dbErr);
  }

  const transporter = createMailTransporter();
  const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const mailOptions = {
    from: `"Vườn Sen Đá 🌵" <${process.env.ALERT_EMAIL_FROM}>`,
    to: recipientEmail,
    subject: '🚨 CẢNH BÁO: Bể nước đã cạn! Cần châm nước ngay!',
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9f5; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2c5a3e, #4a8a60); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🌵 Vườn Sen Đá Của Tôi</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Hệ thống giám sát thông minh</p>
        </div>
        <div style="padding: 32px;">
          <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="color: #856404; margin: 0 0 8px; font-size: 20px;">⚠️ CẢNH BÁO: Bể Nước Đã Cạn!</h2>
            <p style="color: #856404; margin: 0; font-size: 15px;">Cảm biến xác nhận bể chứa nước của vườn sen đá đã hết nước.</p>
          </div>
          <p style="color: #4a6050; font-size: 15px; line-height: 1.6;">Hệ thống tưới tự động sẽ <strong>không hoạt động</strong> cho đến khi bể được châm đầy nước trở lại. Vui lòng kiểm tra và bổ sung nước cho vườn của bạn.</p>
          <div style="background: white; border: 1px solid #d4e9c8; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #2c5a3e; font-size: 14px;"><strong>📅 Thời điểm cảnh báo:</strong> ${timeStr}</p>
            <p style="margin: 8px 0 0; color: #2c5a3e; font-size: 14px;"><strong>📍 Thiết bị:</strong> Vườn Sen Đá Thông Minh</p>
          </div>
          <div style="text-align: center; margin-top: 28px;">
            <p style="color: #8a968c; font-size: 13px;">Email này được gửi tự động từ hệ thống giám sát vườn sen đá.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    _waterAlertSentAt = now;
    console.log(`>>> [Email] Đã gửi cảnh báo hết nước tới ${recipientEmail} lúc ${timeStr}`);
    return { sent: true };
  } catch (err) {
    console.error('>>> [Email] Lỗi khi gửi email cảnh báo:', err.message);
    return { error: err.message };
  }
}

// GET /api/user/profile – Lấy thông tin tài khoản người dùng
app.get('/api/user/profile', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Thiếu tham số username.' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }
    res.json({
      username: user.username,
      email: user.email || '',
      emailAlertEnabled: user.emailAlertEnabled !== false,
      waterAlertEnabled: user.waterAlertEnabled !== false,
      waterAlertThreshold: user.waterAlertThreshold !== undefined ? user.waterAlertThreshold : 15
    });
  } catch (error) {
    console.error('Lỗi GET /api/user/profile:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy hồ sơ.' });
  }
});

// PUT /api/user/profile – Cập nhật thông tin tài khoản
app.put('/api/user/profile', async (req, res) => {
  const { username, email, password, emailAlertEnabled, waterAlertEnabled, waterAlertThreshold } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Thiếu tham số username.' });
  }
  try {
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (password) updateData.password = password;
    if (emailAlertEnabled !== undefined) updateData.emailAlertEnabled = emailAlertEnabled;
    if (waterAlertEnabled !== undefined) updateData.waterAlertEnabled = waterAlertEnabled;
    if (waterAlertThreshold !== undefined) updateData.waterAlertThreshold = waterAlertThreshold;

    const user = await User.findOneAndUpdate({ username }, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }
    res.json({
      success: true,
      username: user.username,
      email: user.email,
      emailAlertEnabled: user.emailAlertEnabled !== false,
      waterAlertEnabled: user.waterAlertEnabled !== false,
      waterAlertThreshold: user.waterAlertThreshold !== undefined ? user.waterAlertThreshold : 15
    });
  } catch (error) {
    console.error('Lỗi PUT /api/user/profile:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
  }
});

// POST /api/alert/water-low – Frontend gọi khi phát hiện hết nước
app.post('/api/alert/water-low', async (req, res) => {
  try {
    const result = await sendWaterLowEmail();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// Schema & API: Lịch bảo trì (maintenance_schedules)
// ══════════════════════════════════════════════
const maintenanceSchema = new mongoose.Schema({
  datetime:        { type: Date },                    // Dùng cho lịch một lần
  category:        { type: String, required: true },   // soil | fertilizer | prune | tùy chỉnh
  recurrence:      { type: String, default: 'once' }, // 'once' | 'weekly' | 'monthly'
  daysOfWeek:      { type: [Number], default: [] },   // [0..6] dùng cho weekly
  dayOfMonth:      { type: Number },                  // 1..28 dùng cho monthly
  time:            { type: String },                  // 'HH:MM' dùng cho weekly/monthly
  notified:        { type: Boolean, default: false }, // Đã gửi (lịch một lần)
  lastNotifiedAt:  { type: Date },                    // Lần gửi cuối (lịch lặp lại)
  created_at:      { type: Date, default: Date.now }
});
const Maintenance = mongoose.model('Maintenance', maintenanceSchema, 'maintenance_schedules');

const MAINT_LABELS = {
  soil:       'Thay đất mới',
  fertilizer: 'Bón phân dinh dưỡng',
  prune:      'Tỉa lá & Vệ sinh',
};

const MAINT_TIPS = {
  soil:       'Hãy chuẩn bị đất cát pha trộn sẵn, gỡ nhẹ cây ra khỏi chậu, rũ bỏ đất cũ bám rễ, và trồng lại vào đất mới tơi xốp.',
  fertilizer: 'Sử dụng phân bón loãng chuyên dụng cho xương rồng/sen đá, tưới nhẹ sau khi bón để phân thấm đều vào đất.',
  prune:      'Dùng kéo sạch cắt bỏ lá úa và hư, lau sạch bề mặt lá bằng khăn ẩm mềm, kiểm tra dấu hiệu sâu bệnh.',
};

// GET /api/maintenance – Lấy danh sách lịch bảo trì
app.get('/api/maintenance', async (req, res) => {
  try {
    const list = await Maintenance.find().sort({ datetime: 1 });
    res.json(list);
  } catch (err) {
    console.error('Lỗi GET /api/maintenance:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách lịch bảo trì.' });
  }
});

// POST /api/maintenance – Thêm lịch bảo trì mới
app.post('/api/maintenance', async (req, res) => {
  const { datetime, category, recurrence = 'once', daysOfWeek, dayOfMonth, time } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Thiếu trường category.' });
  }
  if (recurrence === 'once' && !datetime) {
    return res.status(400).json({ error: 'Lịch một lần cần có trường datetime.' });
  }
  try {
    const entryData = { category, recurrence };
    if (recurrence === 'once') entryData.datetime = new Date(datetime);
    if (recurrence === 'weekly')  { entryData.daysOfWeek = daysOfWeek || []; entryData.time = time || '08:00'; }
    if (recurrence === 'monthly') { entryData.dayOfMonth = dayOfMonth || 1;  entryData.time = time || '08:00'; }

    const entry = new Maintenance(entryData);
    await entry.save();

    // Ghi nhật ký hoạt động
    const catLabel = MAINT_LABELS[category] || category;
    const recurLabel = recurrence === 'weekly' ? 'hàng tuần' : recurrence === 'monthly' ? 'hàng tháng' : 'một lần';
    await saveActivityLogBackend(
      'schedule',
      `Lên lịch bảo trì: ${catLabel}`,
      `Đã thiết lập lịch nhắc ${recurLabel} cho hạng mục "${catLabel}".`
    );

    console.log(`>>> [Maintenance] Đã thêm lịch: ${catLabel} (${recurLabel})`);
    res.json({ success: true, _id: entry._id });
  } catch (err) {
    console.error('Lỗi POST /api/maintenance:', err);
    res.status(500).json({ error: 'Không thể lưu lịch bảo trì.' });
  }
});

// DELETE /api/maintenance/:id – Xóa lịch bảo trì
app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const deleted = await Maintenance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy lịch bảo trì.' });

    // Ghi nhật ký xóa lịch
    const catLabel = MAINT_LABELS[deleted.category] || deleted.category;
    await saveActivityLogBackend(
      'schedule',
      `Xóa lịch bảo trì: ${catLabel}`,
      `Người dùng đã xóa lịch nhắc "${catLabel}" khỏi hệ thống.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi DELETE /api/maintenance:', err);
    res.status(500).json({ error: 'Không thể xóa lịch bảo trì.' });
  }
});

// ── Gửi email nhắc bảo trì ──
async function sendMaintenanceReminderEmail(entry, scheduleDesc) {
  let recipientEmail = process.env.ALERT_EMAIL_TO;
  try {
    const user = await User.findOne({ username: 'nhacphuoc25' });
    if (user) {
      if (user.email) recipientEmail = user.email;
      if (user.emailAlertEnabled === false) {
        console.log(`>>> [Maintenance Email] Người dùng đã tắt nhận thông báo email. Bỏ qua gửi email nhắc nhở: ${entry.category}`);
        return true;
      }
    }
  } catch (e) {}

  const label = MAINT_LABELS[entry.category] || entry.category;
  const tip   = MAINT_TIPS[entry.category]   || 'Hãy kiểm tra và thực hiện bảo trì theo kế hoạch.';
  const timeStr = scheduleDesc || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const catColor = entry.category === 'soil' ? '#A07C5A' : entry.category === 'fertilizer' ? '#88AB75' : '#78C0ED';
  const catEmoji = entry.category === 'soil' ? '\uD83E\uDEB4' : entry.category === 'fertilizer' ? '\uD83C\uDF3F' : '\u2702\uFE0F';

  const transporter = createMailTransporter();
  const mailOptions = {
    from: `"V\u01b0\u1EDDn Sen \u0110\u00e1 \uD83C\uDF35" <${process.env.ALERT_EMAIL_FROM}>`,
    to: recipientEmail,
    subject: `${catEmoji} NH\u1eAEC B\u1ea2O TR\u00cc: ${label} \u2013 \u0110\u00e3 \u0111\u1ebfn gi\u1EDD th\u1ef1c hi\u1EC7n!`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9f5; border-radius: 12px; overflow: hidden; border: 1px solid #d4e9c8;">
        <div style="background: linear-gradient(135deg, #2c5a3e, #4a8a60); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">🌵 V\u01b0\u1EDDn Sen \u0110\u00e1 C\u1EE7a T\u00f4i</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Nh\u1eafc nh\u1EDF b\u1ea3o tr\u00ec \u0111\u1ecbnh k\u1EF3</p>
        </div>
        <div style="padding: 32px;">
          <div style="background: white; border-left: 5px solid ${catColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="font-size: 32px; margin-bottom: 8px;">${catEmoji}</div>
            <h2 style="color: ${catColor}; margin: 0 0 8px; font-size: 20px;">\u0110\u00e3 \u0111\u1ebfn gi\u1EDD: ${label}</h2>
            <p style="color: #555; margin: 0; font-size: 14px;">L\u1ecbch: <strong>${timeStr}</strong></p>
          </div>
          <div style="background: #f0f7ec; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h3 style="color: #2c5a3e; margin: 0 0 10px; font-size: 15px;">\uD83D\uDCA1 H\u01b0\u1EDBng d\u1EABn th\u1EF1c hi\u1EC7n:</h3>
            <p style="color: #4a6050; margin: 0; font-size: 14px; line-height: 1.7;">${tip}</p>
          </div>
          <div style="background: #fff3cd; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
            <p style="color: #856404; margin: 0; font-size: 13px;">\u23f0 Sau khi ho\u00e0n t\u1EA5t, h\u00e3y ki\u1EC3m tra l\u1EA1i l\u1ecbch tr\u00ean \u1ee9ng d\u1EE5ng.</p>
          </div>
          <div style="text-align: center;">
            <p style="color: #8a968c; font-size: 12px; margin: 0;">Email n\u00e0y \u0111\u01b0\u1EE3c g\u1EEDi t\u1EF1 \u0111\u1ED9ng t\u1EEB h\u1EC7 th\u1ED1ng V\u01b0\u1EDDn Sen \u0110\u00e1 Th\u00f4ng Minh.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`>>> [Maintenance Email] \u0110\u00e3 g\u1EEDi nh\u1eafc ${label} t\u1EDBi ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error('>>> [Maintenance Email] L\u1ED7i g\u1EEDi email:', err.message);
    return false;
  }
}

// ── Cron job: Kiểm tra lịch bảo trì mỗi phút ──
async function checkMaintenanceSchedules() {
  try {
    const now = new Date();
    // Giờ Việt Nam (UTC+7)
    const vnNow = new Date(now.getTime() + 7 * 3600000);
    const vnHHMM = vnNow.toISOString().slice(11, 16); // 'HH:MM'
    const vnDOW  = vnNow.getUTCDay();                  // 0=CN..6=T7
    const vnDOM  = vnNow.getUTCDate();                 // 1..31
    const vnDateStr = vnNow.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const allEntries = await Maintenance.find({});

    for (const entry of allEntries) {
      const recur = entry.recurrence || 'once';
      const label = MAINT_LABELS[entry.category] || entry.category;
      let shouldFire = false;
      let scheduleDesc = '';

      if (recur === 'once') {
        // ─ Một lần: kiểm tra giống cũ, chưa gửi và đã đến giờ
        if (!entry.notified && entry.datetime && entry.datetime <= new Date(now.getTime() + 60000)) {
          shouldFire = true;
          scheduleDesc = new Date(entry.datetime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        }
      } else if (recur === 'weekly') {
        // ─ Hàng tuần: kiểm tra ngày trong tuần + giờ khớp
        const entryTime = (entry.time || '08:00').trim();
        const inDay  = (entry.daysOfWeek || []).includes(vnDOW);
        const inTime = vnHHMM === entryTime;
        // Kiểm tra chưa gửi hôm nay
        const alreadySentToday = entry.lastNotifiedAt &&
          new Date(entry.lastNotifiedAt).toISOString().slice(0, 10) === vnDateStr;

        if (inDay && inTime && !alreadySentToday) {
          shouldFire = true;
          const DOW_NAMES = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
          scheduleDesc = `Hàng tuần (${DOW_NAMES[vnDOW]}) lúc ${entryTime}`;
        }
      } else if (recur === 'monthly') {
        // ─ Hàng tháng: kiểm tra ngày trong tháng + giờ khớp
        const entryTime = (entry.time || '08:00').trim();
        const inDay  = entry.dayOfMonth === vnDOM;
        const inTime = vnHHMM === entryTime;
        // Kiểm tra chưa gửi tháng này (so sánh YYYY-MM)
        const alreadySentThisMonth = entry.lastNotifiedAt &&
          new Date(entry.lastNotifiedAt).toISOString().slice(0, 7) === vnDateStr.slice(0, 7);

        if (inDay && inTime && !alreadySentThisMonth) {
          shouldFire = true;
          scheduleDesc = `Hàng tháng (ngày ${vnDOM}) lúc ${entryTime}`;
        }
      }

      if (!shouldFire) continue;

      const sent = await sendMaintenanceReminderEmail(entry, scheduleDesc);
      if (sent) {
        if (recur === 'once') {
          // Xóa lịch nhắc một lần khi đã thông báo xong
          await Maintenance.findByIdAndDelete(entry._id);
        } else {
          // Lịch lặp: chỉ cập nhật lastNotifiedAt để nhắc lần sau
          await Maintenance.findByIdAndUpdate(entry._id, { lastNotifiedAt: now });
        }

        // Ghi nhật ký
        await saveActivityLogBackend(
          'schedule',
          `Nhắc bảo trì: ${label}`,
          `Đã gửi email nhắc nhở bảo trì đúng lịch (${scheduleDesc}).`
        );
        console.log(`>>> [Maintenance Cron] Gửi nhắc: ${label} (${scheduleDesc})`);
      }
    }
  } catch (err) {
    console.error('>>> [Maintenance Cron] Lỗi:', err.message);
  }
}

// Kiểm tra mỗi 60 giây
setInterval(checkMaintenanceSchedules, 60 * 1000);
console.log('>>> Dịch vụ nhắc lịch bảo trì đã được kích hoạt (kiểm tra mỗi 60 giây).');


// GET /api/export/data – Trả về toàn bộ dữ liệu lịch sử đã được làm sạch và làm phẳng
app.get('/api/export/data', async (req, res) => {
  try {
    const sensorLogs = await SensorLog.find().sort({ timestamp: -1 });
    const dailyWater = await DailyWater.find().sort({ date: -1 });
    const activityDocs = await ActivityLog.find().sort({ date: -1 });
    
    const activityLogs = [];
    for (const doc of activityDocs) {
      const cats = ['den', 'bom', 'canh_bao', 'lich'];
      for (const cat of cats) {
        const entries = doc[cat] || [];
        for (const e of entries) {
          activityLogs.push({
            date: doc.date,
            time: e.time,
            category: cat === 'den' ? 'Đèn LED' : cat === 'bom' ? 'Máy bơm' : cat === 'canh_bao' ? 'Cảnh báo' : 'Lịch bảo trì',
            action: e.action
          });
        }
      }
    }
    activityLogs.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    res.json({
      sensorLogs,
      dailyWater,
      activityLogs
    });
  } catch (error) {
    console.error('Lỗi GET /api/export/data:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu xuất khẩu.' });
  }
});

// GET /api/export/excel – Tạo và tải về file Excel (.xlsx) chứa toàn bộ dữ liệu vườn
app.get('/api/export/excel', async (req, res) => {
  try {
    const sensorLogs = await SensorLog.find().sort({ timestamp: -1 });
    const dailyWater = await DailyWater.find().sort({ date: -1 });
    const activityDocs = await ActivityLog.find().sort({ date: -1 });
    
    // Định dạng Sheet 1: Nhật ký Cảm biến
    const sensorData = sensorLogs.map((log, index) => {
      const date = new Date(log.timestamp);
      const formattedTime = date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const humPercent = Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100)));
      return {
        'STT': index + 1,
        'Thời gian': formattedTime,
        'Cường độ sáng (Lux)': Math.round(log.lux || 0),
        'Độ ẩm đất (%)': humPercent,
        'Trạng thái nước': log.water_status === 'HET_NUOC' ? 'Hết nước' : 'Bình thường',
        'Trạng thái bơm': log.pump_status,
        'Trạng thái đèn': log.light_status
      };
    });

    // Định dạng Sheet 2: Tiêu thụ nước
    const waterData = dailyWater.map((item, index) => ({
      'STT': index + 1,
      'Ngày': item.date.split('-').reverse().join('/'),
      'Lượng nước tiêu thụ (Lít)': parseFloat((item.amount_ml / 1000).toFixed(3))
    }));

    // Định dạng Sheet 3: Nhật ký hoạt động
    const activityData = [];
    let actIndex = 1;
    for (const doc of activityDocs) {
      const cats = ['den', 'bom', 'canh_bao', 'lich'];
      for (const cat of cats) {
        const entries = doc[cat] || [];
        for (const e of entries) {
          activityData.push({
            'STT': actIndex++,
            'Ngày': doc.date.split('-').reverse().join('/'),
            'Giờ': e.time,
            'Danh mục': cat === 'den' ? 'Đèn LED' : cat === 'bom' ? 'Máy bơm' : cat === 'canh_bao' ? 'Cảnh báo' : 'Lịch bảo trì',
            'Hành động chi tiết': e.action
          });
        }
      }
    }
    
    // Sắp xếp activityData theo Ngày và Giờ giảm dần
    activityData.sort((a, b) => {
      const dateA = a['Ngày'].split('/').reverse().join('-');
      const dateB = b['Ngày'].split('/').reverse().join('-');
      return dateB.localeCompare(dateA) || b['Giờ'].localeCompare(a['Giờ']);
    });
    // Đánh số thứ tự lại từ 1
    activityData.forEach((item, idx) => {
      item['STT'] = idx + 1;
    });

    // Tạo Workbook
    const wb = XLSX.utils.book_new();

    const wsSensor = XLSX.utils.json_to_sheet(sensorData);
    XLSX.utils.book_append_sheet(wb, wsSensor, 'Nhật ký Cảm biến');

    const wsWater = XLSX.utils.json_to_sheet(waterData);
    XLSX.utils.book_append_sheet(wb, wsWater, 'Tiêu thụ nước');

    const wsActivity = XLSX.utils.json_to_sheet(activityData);
    XLSX.utils.book_append_sheet(wb, wsActivity, 'Nhật ký hoạt động');

    // Chuyển đổi thành Buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Bao_Cao_Vuon_Sen_Da.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Lỗi GET /api/export/excel:', error);
    res.status(500).json({ error: 'Không thể xuất file Excel.' });
  }
});

// Dịch vụ tự động xóa dữ liệu cũ hơn 65 ngày
async function cleanupOldData() {
  try {
    const daysLimit = 65;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysLimit);
    
    // Chuỗi định dạng YYYY-MM-DD cho daily_water và activity_logs
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    
    console.log(`>>> [Cleanup] Bắt đầu dọn dẹp dữ liệu cũ hơn ${daysLimit} ngày (trước ngày ${cutoffStr})...`);

    // 1. Xóa trong sensor_logs (dùng timestamp)
    const sensorDel = await SensorLog.deleteMany({ timestamp: { $lt: cutoffDate } });
    
    // 2. Xóa trong daily_water (dùng date string YYYY-MM-DD)
    const waterDel = await DailyWater.deleteMany({ date: { $lt: cutoffStr } });
    
    // 3. Xóa trong activity_logs (dùng date string YYYY-MM-DD)
    const activityDel = await ActivityLog.deleteMany({ date: { $lt: cutoffStr } });

    console.log(`>>> [Cleanup] Hoàn tất dọn dẹp dữ liệu:`);
    console.log(`   - Đã xóa ${sensorDel.deletedCount} bản ghi trong sensor_logs`);
    console.log(`   - Đã xóa ${waterDel.deletedCount} ngày dữ liệu trong daily_water`);
    console.log(`   - Đã xóa ${activityDel.deletedCount} ngày nhật ký trong activity_logs`);
  } catch (error) {
    console.error('>>> [Cleanup] Lỗi khi dọn dẹp dữ liệu cũ:', error);
  }
}

// Chạy dọn dẹp định kỳ mỗi 24 giờ
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

// Khởi động server Express
app.listen(PORT, () => {
  console.log(`>>> Server đang chạy tại http://localhost:${PORT}`);
});
