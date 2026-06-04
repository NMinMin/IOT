import Chart from 'chart.js/auto';

// Cấu hình kết nối Firebase và Backend Local
const FIREBASE_DB_URL = "https://smart-green-house-iot-default-rtdb.asia-southeast1.firebasedatabase.app/";
const FIREBASE_SECRET = "1Gi5Y2PkpsymHPnnBAQAXHY8e6AyWf4OdqFwheer";
const BACKEND_URL = "http://localhost:5000";

// Trạng thái dữ liệu Firebase lưu tại Local
window.firebaseState = {
  sensor: { soil_raw: 4095, lux: 0, water_status: "CON_NUOC", pump_status: "OFF", light_status: "OFF" },
  setting: { soil_min: 3000, soil_max: 1500, lux_min: 200 },
  control: { pump_manual: false, light_manual: false }
};

// ─── Mực nước bể: 500ml = 100% ───
const WATER_PER_PUMP_PCT   = 24; // Tự động: 120ml  → 120/500 = 24%
const WATER_PER_MANUAL_PCT = 9;  // Thủ công: 45ml  → 45/500 = 9%

function getTankWater() {
  const saved = parseFloat(localStorage.getItem('tankWaterPct'));
  return isNaN(saved) ? 100 : Math.max(0, Math.min(100, saved));
}

function saveTankWater(pct) {
  pct = Math.max(0, Math.min(100, Math.round(pct)));
  localStorage.setItem('tankWaterPct', pct);
  // Đồng bộ lên MongoDB Atlas (không block UI)
  fetch(`${BACKEND_URL}/api/tank`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ water_pct: pct })
  }).catch(err => console.warn('Không thể lưu mực nước lên MongoDB:', err));
  return pct;
}

// Đọc mực nước từ MongoDB khi khởi động
export async function initTankWater() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tank`);
    if (res.ok) {
      const data = await res.json();
      const pct = Math.max(0, Math.min(100, Math.round(data.water_pct)));
      localStorage.setItem('tankWaterPct', pct);
      setWaterValue(pct, 0, 100);
      console.log(`>>> Mực nước bể từ MongoDB: ${pct}%`);
    }
  } catch (err) {
    console.warn('Không thể tải mực nước từ MongoDB, dùng localStorage:', err);
    setWaterValue(getTankWater(), 0, 100);
  }
}

export function decreaseTankWater(pct = WATER_PER_PUMP_PCT) {
  const newPct = saveTankWater(getTankWater() - pct);
  setWaterValue(newPct, 0, 100);
  // Hiện cảnh báo nếu mực nước < 20%
  const alertWaterLow = document.getElementById('alert-water-low');
  if (alertWaterLow) alertWaterLow.classList.toggle('hidden', newPct >= 20);
  return newPct;
}

// Export hằng số để main.js dùng
export { WATER_PER_MANUAL_PCT, saveTankWater, getTankWater };

/* ══════════════════════════════════════════════
   NHẬT KÝ HOẠT ĐỘNG
   ══════════════════════════════════════════════ */
const ACTIVITY_LOG_KEY = 'activityLog';

let skipDen = 0;
let skipBom = 0;
const LOG_LIMIT = 10;
let loadingDen = false;
let loadingBom = false;
let noMoreDen = false;
let noMoreBom = false;
let scrollListenersAttached = false;

function formatLogTime(dateStr, timeStr) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');
  if (dateStr === todayStr) return timeStr;
  if (dateStr === yesterdayStr) return `Hôm qua ${timeStr}`;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m} ${timeStr}`;
}

export function addActivityLog(type, title, desc) {
  // Map type → category
  const CAT_MAP = {
    light_on: 'den', light_off: 'den',
    water_auto: 'bom', water_manual: 'bom', pump_off: 'bom',
    water_low: 'canh_bao', emergency: 'canh_bao',
  };
  const cat = CAT_MAP[type] || 'canh_bao';
  const now  = new Date();
  const dateStr = now.toLocaleDateString('sv-SE');
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const action  = desc ? `${title} – ${desc}` : title;

  // 1. Cập nhật localStorage theo format nhóm ngày
  const store = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
  let dayDoc  = store.find(d => d.date === dateStr);
  if (!dayDoc) {
    dayDoc = { date: dateStr, den: [], bom: [], canh_bao: [] };
    store.unshift(dayDoc);
  }
  dayDoc[cat].unshift({ time: timeStr, action });
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(store.slice(0, 7)));

  // 2. Đẩy lên MongoDB Atlas (không block UI)
  fetch(`${BACKEND_URL}/api/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, title, desc })
  }).catch(err => console.warn('Không thể lưu nhật ký lên MongoDB:', err));
}

export async function loadMoreLogs(category, append = false) {
  const containerId = category === 'den' ? 'activity-log-list-den' : 'activity-log-list-bom';
  const container = document.getElementById(containerId);
  if (!container) return;

  if (category === 'den') {
    if (noMoreDen || loadingDen) return;
    loadingDen = true;
  } else {
    if (noMoreBom || loadingBom) return;
    loadingBom = true;
  }

  if (!append) {
    container.innerHTML = '<p style="color:#8A968C;text-align:center;padding:10px 0;font-size:12px">Đang tải...</p>';
  }

  try {
    const skip = category === 'den' ? skipDen : skipBom;
    const res = await fetch(`${BACKEND_URL}/api/activity/list?category=${category}&limit=${LOG_LIMIT}&skip=${skip}`);
    if (res.ok) {
      const data = await res.json();
      
      if (category === 'den') {
        loadingDen = false;
        if (data.length < LOG_LIMIT) noMoreDen = true;
        skipDen += data.length;
      } else {
        loadingBom = false;
        if (data.length < LOG_LIMIT) noMoreBom = true;
        skipBom += data.length;
      }

      if (!append && data.length === 0) {
        container.innerHTML = '<p style="color:#8A968C;text-align:center;padding:20px 0;font-size:12px">Chưa có hoạt động nào.</p>';
        return;
      }

      const icon = category === 'den' ? 'sun' : 'droplet';
      const color = category === 'den' ? 'yellow' : 'blue';

      const html = data.map(e => `
        <div class="log-item" style="border-bottom:1px solid #F0F2EA; padding: 10px 0; display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
            <div class="log-icon ${color}" style="width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${icon}"></i></div>
            <div class="log-info" style="font-size:13px; color:var(--dark-green); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${e.action}</strong></div>
          </div>
          <span class="log-time" style="font-size:11px; color:#8A968C; flex-shrink:0;">${formatLogTime(e.date, e.time)}</span>
        </div>
      `).join('');

      if (append) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
          container.appendChild(tempDiv.firstChild);
        }
      } else {
        container.innerHTML = html;
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: container });
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải nhật ký phân trang:', err);
    if (category === 'den') loadingDen = false;
    else loadingBom = false;
  }
}

export function renderActivityLog() {
  skipDen = 0;
  skipBom = 0;
  noMoreDen = false;
  noMoreBom = false;
  loadingDen = false;
  loadingBom = false;

  loadMoreLogs('den', false);
  loadMoreLogs('bom', false);

  setupLogScrollListeners();
}

function setupLogScrollListeners() {
  if (scrollListenersAttached) return;
  
  const denScroll = document.getElementById('activity-log-list-den');
  const bomScroll = document.getElementById('activity-log-list-bom');
  
  if (denScroll) {
    denScroll.addEventListener('scroll', () => {
      if (denScroll.scrollTop + denScroll.clientHeight >= denScroll.scrollHeight - 10) {
        loadMoreLogs('den', true);
      }
    });
  }
  
  if (bomScroll) {
    bomScroll.addEventListener('scroll', () => {
      if (bomScroll.scrollTop + bomScroll.clientHeight >= bomScroll.scrollHeight - 10) {
        loadMoreLogs('bom', true);
      }
    });
  }
  
  scrollListenersAttached = true;
}


let currentPage = 'dashboard';
let prevPage    = null;
let healthChart = null;
let statChart   = null;
let waterChart  = null;

/* ── Router ── */
export function goTo(page) {
  if (page === 'login') {
    document.getElementById('app-shell')?.remove();
    document.getElementById('page-login')?.classList.remove('hidden');
    currentPage = 'login';
    return;
  }

  // Hide all inner pages
  document.querySelectorAll('.inner-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  prevPage    = currentPage;
  currentPage = page;

  updateHeader(page);
  updateNavBar(page);

  // Lazy init charts
  if (page === 'dashboard')  initHealthChart();
  if (page === 'statistics') { initStatChart(); initWaterChart(); renderActivityLog(); }

  // Animate tank
  if (page === 'dashboard') {
    setTimeout(() => {
      const isWaterLow = window.firebaseState.sensor.water_status === 'HET_NUOC';
      if (isWaterLow) saveTankWater(5);
      setWaterValue(getTankWater(), 0, 100);
    }, 300);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function goBack() {
  goTo(prevPage && prevPage !== currentPage ? prevPage : 'dashboard');
}

/* ── Header updater ── */
function updateHeader(page) {
  const title    = document.getElementById('hdr-title');
  const sub      = document.getElementById('hdr-sub');
  const btnBack  = document.getElementById('btn-back');
  const statTabs = document.getElementById('stats-tabs');
  const weather  = document.getElementById('weather-badge');

  statTabs?.classList.add('hidden');
  btnBack?.classList.add('hidden');
  weather?.classList.remove('hidden');

  const map = {
    dashboard:  ['Vườn Sen Đá Của Tôi',     'Chào buổi sáng, người làm vườn! <img src="./Vector.svg" class="icon-plant" alt="Plant"/>'],
    statistics: ['<i data-lucide="trending-up"></i> Thống Kê & Lịch Sử',    'Theo dõi sự phát triển của vườn nhỏ <i data-lucide="clipboard-list"></i>'],
    settings:   ['<i data-lucide="settings"></i> Cài Đặt & Thông Báo',  'Chăm sóc vườn theo cách của bạn <img src="./Vector.svg" class="icon-plant" alt="Plant"/>'],
  };

  const [t, s] = map[page] || map.dashboard;
  if (title) title.innerHTML = t;
  if (sub)   sub.innerHTML   = s;

  if (page !== 'dashboard') {
    btnBack?.classList.remove('hidden');
    weather?.classList.add('hidden');
  }
  if (page === 'statistics') statTabs?.classList.remove('hidden');
}

/* ── Bottom nav / Desktop nav ── */
function updateNavBar(page) {
  document.querySelectorAll('.nav-btn, .nav-btn-desktop').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.goto === page);
  });
}

/* ── Sensor / Water tank update ── */
export function setWaterValue(val, min = 0, max = 100) {
  window.currentWater = val;
  // Calculate percentage based on min and max
  let pct = ((val - min) / (max - min)) * 100;
  pct = Math.max(0, Math.min(100, pct)); // Clamp between 0-100
  pct = Math.round(pct);
  
  const fill = document.getElementById('drop-fill');
  const pctEl = document.getElementById('drop-pct');
  const subEl = document.getElementById('drop-sub');
  
  if (fill) fill.style.height = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  
  if (subEl) {
    if (pct < 20) subEl.textContent = 'Thấp';
    else if (pct < 75) subEl.textContent = 'Ổn định';
    else subEl.textContent = 'Đầy';
  }

  // Cập nhật mục lưu ý: Bể 500ml = 100% -> 1% = 5ml
  const tankNote = document.querySelector('.tank-note');
  if (tankNote) {
    const neededMl = (100 - pct) * 5;
    if (neededMl <= 0) {
      tankNote.classList.add('full');
      tankNote.innerHTML = `Bể nước đã đầy.`;
    } else {
      tankNote.classList.remove('full');
      tankNote.innerHTML = `<strong>LƯU Ý</strong> Cần thêm ${neededMl} ml để đầy bể.`;
    }
  }

  // Cập nhật phần trăm trong cảnh báo mực nước thấp
  const alertWaterLow = document.getElementById('alert-water-low');
  if (alertWaterLow) {
    const alertSpan = alertWaterLow.querySelector('span');
    if (alertSpan) {
      alertSpan.textContent = `Bể nước chỉ còn ${pct}% - Vui lòng châm thêm.`;
    }
  }
}

// Hàm khởi chạy đồng bộ với Firebase và tải mực nước từ MongoDB
export function startSensorSim() {
  initFirebaseSync();
  initTankWater(); // Tải mực nước bể từ MongoDB Atlas
}

/* ── Dark mode ── */
export function toggleDark(checked) {
  document.body.classList.toggle('dark', checked);
}

/* ── Slider labels ── */
export function bindSlider(inputId, labelId, unit = '%', scale = 1) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!input || !label) return;

  const fmt = (v) => {
    const n = parseInt(v) * scale;
    return n >= 1000 ? n.toLocaleString('vi-VN') + unit : n + unit;
  };

  input.addEventListener('input', () => { label.textContent = fmt(input.value); });
}

/* ── Toast ── */
export function showToast(msg, ms = 2800) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = msg;
  lucide.createIcons({ root: toast });
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), ms);
}

/* Fancy Toast (Top-Right Floating with Progress Bar) */
export function showFancyToast(title, message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `fancy-toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'error') iconName = 'x-circle';
  
  toast.innerHTML = `
    <div class="fancy-toast-body">
      <div class="fancy-toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="fancy-toast-content">
        <div class="fancy-toast-title">${title}</div>
        <div class="fancy-toast-desc">${message}</div>
      </div>
      <button class="fancy-toast-close">&times;</button>
    </div>
    <div class="fancy-toast-progress-bar">
      <div class="fancy-toast-progress"></div>
    </div>
  `;
  
  container.appendChild(toast);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({ root: toast });
  }
  
  const closeBtn = toast.querySelector('.fancy-toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  });
  
  const progress = toast.querySelector('.fancy-toast-progress');
  progress.style.animationDuration = `${duration}ms`;
  
  const timer = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  toast.dataset.timer = timer;
}

/* ══════════════════════════════════════════════
   FIREBASE REALTIME SYNC (REST Streaming API)
   ══════════════════════════════════════════════ */
export function initFirebaseSync() {
  const dbUrl = FIREBASE_DB_URL.endsWith('/') ? FIREBASE_DB_URL : `${FIREBASE_DB_URL}/`;
  const streamUrl = `${dbUrl}.json?auth=${FIREBASE_SECRET}`;
  
  console.log('>>> Bắt đầu kết nối EventSource...');
  const eventSource = new EventSource(streamUrl);
  
  eventSource.addEventListener('put', (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload) {
        handleFirebaseUpdate(payload.path, payload.data);
      }
    } catch (error) {
      console.error('Lỗi parse Firebase stream (put):', error);
    }
  });

  eventSource.addEventListener('patch', (e) => {
    try {
      const payload = JSON.parse(e.data);
      if (payload) {
        handleFirebaseUpdate(payload.path, payload.data);
      }
    } catch (error) {
      console.error('Lỗi parse Firebase stream (patch):', error);
    }
  });

  eventSource.onerror = (err) => {
    console.error('Lỗi kết nối Firebase Stream. Đang tự động kết nối lại...', err);
  };
}

function handleFirebaseUpdate(path, data) {
  if (!path || data === null) return;
  
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    window.firebaseState = { ...window.firebaseState, ...data };
  } else if (segments.length === 1) {
    window.firebaseState[segments[0]] = { ...window.firebaseState[segments[0]], ...data };
  } else if (segments.length === 2) {
    if (!window.firebaseState[segments[0]]) window.firebaseState[segments[0]] = {};
    window.firebaseState[segments[0]][segments[1]] = data;
  }

  updateUIFromFirebaseState();
}

function updateUIFromFirebaseState() {
  const state = window.firebaseState;
  if (!state) return;

  // 1. Cập nhật các thông số cảm biến trên Dashboard
  const valLight = document.getElementById('val-light');
  const valHum = document.getElementById('val-hum');
  
  if (valLight && state.sensor.lux !== undefined) {
    valLight.textContent = Math.round(state.sensor.lux).toLocaleString('vi-VN') + ' Lux';
  }
  
  if (valHum && state.sensor.soil_raw !== undefined) {
    const humPercent = Math.max(0, Math.min(100, Math.round(((4095 - state.sensor.soil_raw) / 4095) * 100)));
    valHum.textContent = humPercent + '%';
  }

  // 2. Cập nhật trạng thái nước và cảnh báo
  const alertWaterLow = document.getElementById('alert-water-low');
  const isWaterLow = state.sensor.water_status === 'HET_NUOC';
  
  if (alertWaterLow) {
    alertWaterLow.classList.toggle('hidden', !isWaterLow);
  }
  
  if (isWaterLow) {
    saveTankWater(5);
    if (!window._waterLowLogged) {
      window._waterLowLogged = true;
      addActivityLog('water_low', 'Cảnh báo: Hết nước!', 'Cảm biến xác nhận bể chứa đã cạn.');
    }
  } else {
    window._waterLowLogged = false;
  }
  setWaterValue(getTankWater(), 0, 100);

  // Theo dõi sự thay đổi pump_status để trừ nước và ghi log tự động
  if (state.sensor.pump_status !== undefined) {
    const newPumpStatus = state.sensor.pump_status;
    if (window._lastFBPumpStatus === undefined) {
      window._lastFBPumpStatus = newPumpStatus; // Khởi tạo lần đầu
    } else if (newPumpStatus !== window._lastFBPumpStatus) {
      if (newPumpStatus === 'ON_AUTO') {
        decreaseTankWater(WATER_PER_PUMP_PCT); // tự động trừ 24% = 120ml
        addActivityLog('water_auto', 'Tưới nước tự động', 'Đất khô, tự động kích hoạt tưới nước (5 giây).');
      } else if (newPumpStatus === 'OFF' && window._lastFBPumpStatus === 'ON_AUTO') {
        addActivityLog('pump_off', 'Tắt máy bơm', 'Tự động tắt máy bơm sau khi tưới xong.');
      }
      window._lastFBPumpStatus = newPumpStatus;
    }
  }

  // Theo dõi sự thay đổi light_status để ghi log tự động
  if (state.sensor.light_status !== undefined) {
    const newLightStatus = state.sensor.light_status;
    if (window._lastFBLightStatus === undefined) {
      window._lastFBLightStatus = newLightStatus; // Khởi tạo lần đầu
    } else if (newLightStatus !== window._lastFBLightStatus) {
      if (newLightStatus === 'ON_AUTO') {
        addActivityLog('light_on', 'Bật đèn LED tự động', `Cường độ sáng thấp (${Math.round(state.sensor.lux !== undefined ? state.sensor.lux : 0)} Lux). Bật đèn tự động.`);
      } else if (newLightStatus === 'OFF' && window._lastFBLightStatus === 'ON_AUTO') {
        addActivityLog('light_off', 'Tắt đèn LED tự động', `Cường độ sáng cao (${Math.round(state.sensor.lux !== undefined ? state.sensor.lux : 0)} Lux). Tắt đèn tự động.`);
      }
      window._lastFBLightStatus = newLightStatus;
    }
  }

  // 3. Cập nhật switch điều khiển thiết bị thủ công (nếu phần tử tồn tại)
  const pumpManualSw = document.getElementById('control-pump-manual');
  const lightManualSw = document.getElementById('control-light-manual');
  
  if (pumpManualSw && state.control.pump_manual !== undefined) {
    pumpManualSw.checked = state.control.pump_manual;
  }
  if (lightManualSw && state.control.light_manual !== undefined) {
    lightManualSw.checked = state.control.light_manual;
  }

  // 4. Cập nhật thanh trượt Settings
  const humMinSlider = document.getElementById('hum-min');
  const humMinLabel = document.getElementById('hum-min-label');
  if (humMinSlider && state.setting.soil_min !== undefined && document.activeElement !== humMinSlider) {
    const minPercent = Math.max(0, Math.min(100, Math.round(((4095 - state.setting.soil_min) / 4095) * 100)));
    humMinSlider.value = minPercent;
    if (humMinLabel) humMinLabel.textContent = minPercent + '%';
  }

  const humMaxSlider = document.getElementById('hum-max');
  const humMaxLabel = document.getElementById('hum-max-label');
  if (humMaxSlider && state.setting.soil_max !== undefined && document.activeElement !== humMaxSlider) {
    const maxPercent = Math.max(0, Math.min(100, Math.round(((4095 - state.setting.soil_max) / 4095) * 100)));
    humMaxSlider.value = maxPercent;
    if (humMaxLabel) humMaxLabel.textContent = maxPercent + '%';
  }

  const luxLowSlider = document.getElementById('lux-low');
  const luxLowInput = document.getElementById('lux-low-input');
  if (luxLowSlider && state.setting.lux_min !== undefined && document.activeElement !== luxLowSlider) {
    luxLowSlider.value = state.setting.lux_min;
    if (luxLowInput && document.activeElement !== luxLowInput) {
      luxLowInput.value = Math.round(state.setting.lux_min);
    }
  }
}

// Gửi lệnh điều khiển thủ công lên Firebase
export function updateFirebaseControl(key, value) {
  const dbUrl = FIREBASE_DB_URL.endsWith('/') ? FIREBASE_DB_URL : `${FIREBASE_DB_URL}/`;
  const url = `${dbUrl}control.json?auth=${FIREBASE_SECRET}`;
  fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value })
  }).then(() => {
    console.log(`>>> Đã lưu điều khiển ${key} = ${value} lên Firebase.`);
  }).catch(err => console.error('Lỗi khi ghi điều khiển lên Firebase:', err));
}

// Gửi cấu hình ngưỡng lên Firebase
export function updateFirebaseSetting(key, value) {
  const dbUrl = FIREBASE_DB_URL.endsWith('/') ? FIREBASE_DB_URL : `${FIREBASE_DB_URL}/`;
  const url = `${dbUrl}setting.json?auth=${FIREBASE_SECRET}`;
  fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value })
  }).then(() => {
    console.log(`>>> Đã lưu cấu hình ${key} = ${value} lên Firebase.`);
  }).catch(err => console.error('Lỗi khi ghi cài đặt lên Firebase:', err));
}

/* ══════════════════════════════════════════════
   CHART: Health Dashboard (Vẽ từ MongoDB Atlas Logs)
   ══════════════════════════════════════════════ */
async function initHealthChart() {
  if (healthChart) return;
  const ctx = document.getElementById('healthChart');
  if (!ctx) return;

  let logs = [];
  try {
    const response = await fetch(`${BACKEND_URL}/api/logs`);
    logs = await response.json();
  } catch (error) {
    console.error('Lỗi khi tải lịch sử cho biểu đồ Dashboard:', error);
  }

  // Dữ liệu fallback nếu MongoDB chưa có dữ liệu
  if (logs.length === 0) {
    logs = [
      { timestamp: new Date(Date.now() - 3600000 * 6), soil_raw: 2457, lux: 3000 },
      { timestamp: new Date(Date.now() - 3600000 * 5), soil_raw: 2400, lux: 5500 },
      { timestamp: new Date(Date.now() - 3600000 * 4), soil_raw: 2300, lux: 6800 },
      { timestamp: new Date(Date.now() - 3600000 * 3), soil_raw: 2200, lux: 8200 },
      { timestamp: new Date(Date.now() - 3600000 * 2), soil_raw: 2500, lux: 8800 },
      { timestamp: new Date(Date.now() - 3600000 * 1), soil_raw: 2600, lux: 7600 },
      { timestamp: new Date(), soil_raw: 2700, lux: 4200 }
    ];
  }

  // Lấy tối đa 10 bản ghi mới nhất để hiển thị trực quan
  const recentLogs = logs.slice(-10);

  const labels = recentLogs.map(log => new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  const lightData = recentLogs.map(log => Math.round(log.lux));
  const humData = recentLogs.map(log => Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));

  healthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ánh Sáng (Lux)',
          data: lightData,
          borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,.12)',
          borderWidth: 2.5, tension: .45, fill: false,
          pointBackgroundColor: '#f5c842', pointRadius: 4, pointHoverRadius: 7,
        },
        {
          label: 'Độ Ẩm Đất (%)',
          data: humData,
          borderColor: '#5a8a65', backgroundColor: 'rgba(90,138,101,.12)',
          borderWidth: 2.5, tension: .45, fill: false,
          pointBackgroundColor: '#5a8a65', pointRadius: 4, pointHoverRadius: 7,
        }
      ]
    },
    options: chartOpts({ legend: true })
  });

  // ── Hàm gom nhóm logs theo ngày trong tuần (trả về avg lux & hum mỗi ngày)
  function aggregateByDay(sourceLogs) {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();
    const groups = {};

    // Khởi tạo 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      groups[key] = { lux: [], hum: [], label: `${dayNames[d.getDay()]} ${key}` };
    }

    // Gom log vào ngày tương ứng
    sourceLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (groups[key]) {
        groups[key].lux.push(Math.round(log.lux));
        groups[key].hum.push(Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));
      }
    });

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const days = Object.values(groups);
    return {
      labels: days.map(d => d.label),
      lux:    days.map(d => avg(d.lux)),
      hum:    days.map(d => avg(d.hum))
    };
  }

  // ── Gắn sự kiện tab #health-tabs
  document.querySelectorAll('#health-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#health-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.chart;

      if (mode === 'today') {
        // Hôm nay: 10 bản ghi mới nhất theo giờ
        const filtered = logs.slice(-10);
        healthChart.data.labels = filtered.map(log =>
          new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        healthChart.data.datasets[0].data = filtered.map(log => Math.round(log.lux));
        healthChart.data.datasets[1].data = filtered.map(log =>
          Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));
      } else {
        // Tuần này: gom nhóm theo ngày, tính trung bình
        const weekly = aggregateByDay(logs);
        healthChart.data.labels = weekly.labels;
        healthChart.data.datasets[0].data = weekly.lux;
        healthChart.data.datasets[1].data = weekly.hum;
      }

      healthChart.update('active');
    });
  });
}

/* ══════════════════════════════════════════════
   CHART: Statistics Light/Hum (Từ MongoDB)
   ══════════════════════════════════════════════ */
async function initStatChart() {
  if (statChart) return;
  const ctx = document.getElementById('statChart');
  if (!ctx) return;

  let logs = [];
  try {
    const response = await fetch(`${BACKEND_URL}/api/logs`);
    logs = await response.json();
  } catch (error) {
    console.error('Lỗi khi tải lịch sử cho biểu đồ lớn:', error);
  }

  if (logs.length === 0) {
    logs = [
      { timestamp: new Date(Date.now() - 3600000 * 6), soil_raw: 2457, lux: 1000 },
      { timestamp: new Date(Date.now() - 3600000 * 5), soil_raw: 2400, lux: 3000 },
      { timestamp: new Date(Date.now() - 3600000 * 4), soil_raw: 2300, lux: 8500 },
      { timestamp: new Date(Date.now() - 3600000 * 3), soil_raw: 2200, lux: 14000 },
      { timestamp: new Date(Date.now() - 3600000 * 2), soil_raw: 2500, lux: 10000 },
      { timestamp: new Date(Date.now() - 3600000 * 1), soil_raw: 2600, lux: 3000 },
      { timestamp: new Date(), soil_raw: 2700, lux: 120 }
    ];
  }

  // Hiển thị 20 bản ghi lịch sử mới nhất
  const displayLogs = logs.slice(-20);

  const labels = displayLogs.map(log => new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  const lightData = displayLogs.map(log => Math.round(log.lux));
  const humData = displayLogs.map(log => Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));

  statChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ánh sáng (Lux)', data: lightData,
          borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,.15)',
          borderWidth: 2.5, tension: .45, fill: true,
          pointBackgroundColor: '#f5c842', pointRadius: 4, pointHoverRadius: 7,
          yAxisID: 'yL'
        },
        {
          label: 'Độ ẩm (%)', data: humData,
          borderColor: '#5a8a65', backgroundColor: 'rgba(90,138,101,.1)',
          borderWidth: 2.5, tension: .45, fill: false,
          pointBackgroundColor: '#5a8a65', pointRadius: 4, pointHoverRadius: 7,
          yAxisID: 'yR'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyleWidth: 10, font: { family: 'Be Vietnam Pro', size: 11 }, color: '#4a6050' } },
        tooltip: tooltipStyle()
      },
      scales: {
        x:  { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#8fa090' } },
        yL: { position: 'left',  grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#c8a800', callback: v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } },
        yR: { position: 'right', grid: { drawOnChartArea: false },   ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#5a8a65', callback: v => v+'%' } }
      }
    }
  });

  // Hỗ trợ click lọc khoảng thời gian
  document.querySelectorAll('#stats-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stats-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      
      let count = 10;
      if (tab === 'weekly') count = 30;
      if (tab === 'monthly') count = 80;
      
      const filtered = logs.slice(-count);
      statChart.data.labels = filtered.map(log => new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      statChart.data.datasets[0].data = filtered.map(log => Math.round(log.lux));
      statChart.data.datasets[1].data = filtered.map(log => Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));
      statChart.update('active');
    });
  });
}

/* ══════════════════════════════════════════════
   CHART: Water Consumption Bar (Dữ liệu thực tế ước tính)
   ══════════════════════════════════════════════ */
async function initWaterChart() {
  if (waterChart) return;
  const ctx = document.getElementById('waterChart');
  if (!ctx) return;

  let usageData = [0, 0, 0, 0, 0, 0, 0];
  try {
    const response = await fetch(`${BACKEND_URL}/api/water/daily`);
    if (response.ok) {
      usageData = await response.json();
    }
  } catch (error) {
    console.error('Lỗi khi tải lượng nước tiêu thụ thực tế từ database:', error);
    usageData = [0.12, 0.045, 0.165, 0, 0.12, 0.09, 0.24];
  }

  const totalLiters = usageData.reduce((a, b) => a + b, 0).toFixed(2);
  const totalPill = document.querySelector('#page-statistics .pill span');
  if (totalPill) {
    totalPill.textContent = `Tổng: ${totalLiters} Lít/Tuần`;
  }

  waterChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'],
      datasets: [{
        label: 'Lít', data: usageData,
        backgroundColor: 'rgba(123,191,232,.75)', borderColor: '#7bbfe8',
        borderWidth: 2, borderRadius: 8, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipStyle(), callbacks: { label: i => ` ${i.formattedValue} lít` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#8fa090' } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#8fa090', callback: v => v+' L' } }
      }
    }
  });
}

/* ── Chart helpers ── */
function chartOpts({ legend = false } = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legend
        ? { display: true, position: 'bottom', labels: { usePointStyle: true, pointStyleWidth: 10, font: { family: 'Be Vietnam Pro', size: 11 }, color: '#4a6050' } }
        : { display: false },
      tooltip: tooltipStyle()
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#8fa090' } },
      y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Be Vietnam Pro', size: 10 }, color: '#8fa090' } }
    }
  };
}

function tooltipStyle() {
  return {
    backgroundColor: 'rgba(255,255,255,.96)',
    borderColor: '#d4e9c8', borderWidth: 1,
    titleColor: '#2c3e2d', bodyColor: '#4a6050', padding: 10
  };
}

/* ── Lịch sử bơm modal ── */
export function openPumpHistoryModal() {
  const modal = document.getElementById('modal-pump-history');
  const content = document.getElementById('pump-history-content');
  if (!modal || !content) return;

  modal.classList.remove('hidden');
  content.innerHTML = '<p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Đang tải dữ liệu lịch sử...</p>';

  // Fetch mới từ server
  fetch(`${BACKEND_URL}/api/activity`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // Lưu vào localStorage luôn để đồng bộ
        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(data));
        _paintPumpLogs(content, data);
      } else {
        // Thử lấy từ localStorage nếu offline
        const localData = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
        if (localData.length > 0) {
          _paintPumpLogs(content, localData);
        } else {
          content.innerHTML = '<p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Chưa có lịch sử hoạt động máy bơm.</p>';
        }
      }
    })
    .catch(() => {
      // Offline fallback
      const localData = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
      if (localData.length > 0) {
        _paintPumpLogs(content, localData);
      } else {
        content.innerHTML = '<p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Không thể tải lịch sử. Vui lòng thử lại sau.</p>';
      }
    });
}

function _paintPumpLogs(container, days) {
  // Lọc chỉ lấy những ngày có hoạt động bơm
  const daysWithPump = days.filter(day => Array.isArray(day.bom) && day.bom.length > 0);
  
  if (daysWithPump.length === 0) {
    container.innerHTML = '<p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Chưa có lịch sử hoạt động máy bơm.</p>';
    return;
  }

  const todayStr     = new Date().toLocaleDateString('sv-SE');
  const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE');

  function dayLabel(dateStr) {
    if (dateStr === todayStr)     return 'Hôm nay';
    if (dateStr === yesterdayStr) return 'Hôm qua';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  container.innerHTML = daysWithPump.map(day => {
    const rows = day.bom.map(e => {
      // Phân biệt tự động/thủ công/tắt
      const isAuto = e.action.toLowerCase().includes('tự động');
      const isOff  = e.action.toLowerCase().includes('tắt') || e.action.toLowerCase().includes('ngắt');
      
      let badgeClass = 'manual';
      let badgeText  = 'Thủ công';
      let iconClass  = 'manual';
      let iconName   = 'droplet';

      if (isAuto) {
        badgeClass = 'auto';
        badgeText  = 'Tự động';
        iconClass  = 'auto';
        iconName   = 'cpu';
      } else if (isOff) {
        badgeClass = 'off';
        badgeText  = 'Tắt';
        iconClass  = 'off';
        iconName   = 'power';
      }

      return `
        <div class="pump-history-item">
          <div class="pump-history-item-left">
            <div class="pump-item-icon ${iconClass}"><i data-lucide="${iconName}"></i></div>
            <div class="pump-history-info">
              <span class="pump-history-action">${e.action}</span>
              <span class="pump-history-time">${e.time}</span>
            </div>
          </div>
          <span class="pump-history-badge ${badgeClass}">${badgeText}</span>
        </div>`;
    }).join('');

    return `
      <div class="pump-history-day">
        <div class="pump-day-title">${dayLabel(day.date)}</div>
        ${rows}
      </div>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

