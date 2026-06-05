import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'node:dns';
import nodemailer from 'nodemailer';

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
  email: { type: String, default: 'vonhacphuoc@gmail.com' }
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

// Định nghĩa Schema cho Lượng nước tiêu thụ hàng ngày (Daily Water)
const dailyWaterSchema = new mongoose.Schema({
  date:      { type: String, required: true, unique: true }, // YYYY-MM-DD
  amount_ml: { type: Number, default: 0 }
});
const DailyWater = mongoose.model('DailyWater', dailyWaterSchema, 'daily_water');

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
  
  if (!['den', 'bom', 'canh_bao', 'all'].includes(category)) {
    return res.status(400).json({ error: 'Category không hợp lệ.' });
  }
  
  try {
    const days = await ActivityLog.find().sort({ date: -1 });
    let allEntries = [];
    
    for (const day of days) {
      const cats = category === 'all' ? ['den', 'bom', 'canh_bao'] : [category];
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
      if (lastSyncPump === null || lastSyncLight === null) {
        const lastLog = await SensorLog.findOne().sort({ timestamp: -1 });
        if (lastLog) {
          lastSyncPump = lastLog.pump_status || 'OFF';
          lastSyncLight = lastLog.light_status || 'OFF';
        } else {
          lastSyncPump = 'OFF';
          lastSyncLight = 'OFF';
        }
      }

      // Phát hiện và ghi nhận sự kiện hoạt động
      // 1. Máy bơm
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
    if (user && user.email) {
      recipientEmail = user.email;
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
    res.json({ username: user.username, email: user.email || '' });
  } catch (error) {
    console.error('Lỗi GET /api/user/profile:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy hồ sơ.' });
  }
});

// PUT /api/user/profile – Cập nhật thông tin tài khoản
app.put('/api/user/profile', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Thiếu tham số username.' });
  }
  try {
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (password) updateData.password = password;

    const user = await User.findOneAndUpdate({ username }, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }
    res.json({ success: true, username: user.username, email: user.email });
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

// Khởi động server Express
app.listen(PORT, () => {
  console.log(`>>> Server đang chạy tại http://localhost:${PORT}`);
});
