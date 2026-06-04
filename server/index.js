import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'node:dns';

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
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema, 'users');

// Hàm tạo tài khoản mặc định nếu chưa tồn tại
async function seedDefaultUser() {
  try {
    const userExist = await User.findOne({ username: 'nhacphuoc25' });
    if (!userExist) {
      const defaultUser = new User({
        username: 'nhacphuoc25',
        password: '02082005'
      });
      await defaultUser.save();
      console.log('>>> Đã tạo tài khoản mặc định trong MongoDB Atlas: nhacphuoc25 / 02082005');
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
  water_status: String
});

// Tạo Model kết nối tới database 'smart_green_house' và collection 'sensor_logs'
const SensorLog = mongoose.model('SensorLog', sensorLogSchema, 'sensor_logs');

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
    await ActivityLog.findOneAndUpdate(
      { date: dateStr },
      { $push: { [cat]: { time: timeStr, action } } },
      { upsert: true, new: true }
    );
    console.log(`>>> Nhật ký [${dateStr}][${cat}] ${timeStr}: ${action}`);
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
      const { soil_raw, lux, water_status } = data;
      
      // Tạo bản ghi log mới
      const newLog = new SensorLog({
        soil_raw: soil_raw !== undefined ? soil_raw : 4095,
        lux: lux !== undefined ? lux : 0,
        water_status: water_status || 'UNKNOWN'
      });
      
      await newLog.save();
      console.log(`[${new Date().toLocaleTimeString()}] Đồng bộ thành công: soil_raw=${soil_raw}, lux=${lux}, water=${water_status}`);
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

// Khởi động server Express
app.listen(PORT, () => {
  console.log(`>>> Server đang chạy tại http://localhost:${PORT}`);
});
