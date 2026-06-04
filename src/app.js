import Chart from 'chart.js/auto';

// Cấu hình kết nối Firebase và Backend Local
const FIREBASE_DB_URL = "https://smart-green-house-iot-default-rtdb.asia-southeast1.firebasedatabase.app/";
const FIREBASE_SECRET = "1Gi5Y2PkpsymHPnnBAQAXHY8e6AyWf4OdqFwheer";
const BACKEND_URL = "http://localhost:5000";

// Trạng thái dữ liệu Firebase lưu tại Local
window.firebaseState = {
  sensor: { soil_raw: 4095, lux: 0, water_status: "CON_NUOC" },
  setting: { soil_min: 3000, soil_max: 1500, lux_min: 200 },
  control: { pump_manual: false, light_manual: false }
};

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
  if (page === 'statistics') { initStatChart(); initWaterChart(); }

  // Animate tank
  if (page === 'dashboard') {
    setTimeout(() => {
      const isWaterLow = window.firebaseState.sensor.water_status === 'HET_NUOC';
      setWaterValue(isWaterLow ? 12 : 92, 0, 100);
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
}

// Hàm khởi chạy đồng bộ với Firebase (thay thế cho trình giả lập)
export function startSensorSim() {
  initFirebaseSync();
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

/* ══════════════════════════════════════════════
   FIREBASE REALTIME SYNC (REST Streaming API)
   ══════════════════════════════════════════════ */
export function initFirebaseSync() {
  const dbUrl = FIREBASE_DB_URL.endsWith('/') ? FIREBASE_DB_URL : `${FIREBASE_DB_URL}/`;
  const streamUrl = `${dbUrl}.json?auth=${FIREBASE_SECRET}`;
  
  console.log('>>> Bắt đầu kết nối EventSource tới Firebase:', FIREBASE_DB_URL);
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
    // Chuyển đổi raw sang phần trăm độ ẩm đất (%)
    const humPercent = Math.max(0, Math.min(100, Math.round(((4095 - state.sensor.soil_raw) / 4095) * 100)));
    valHum.textContent = humPercent + '%';
  }

  // 2. Cập nhật trạng thái nước và cảnh báo
  const alertWaterLow = document.getElementById('alert-water-low');
  const isWaterLow = state.sensor.water_status === 'HET_NUOC';
  
  if (alertWaterLow) {
    alertWaterLow.classList.toggle('hidden', !isWaterLow);
  }
  
  // Cập nhật mực nước trên bình chứa hình giọt nước
  const pct = isWaterLow ? 12 : 92;
  setWaterValue(pct, 0, 100);

  // 3. Cập nhật switch điều khiển thiết bị thủ công (nếu phần tử tồn tại)
  const pumpManualSw = document.getElementById('control-pump-manual');
  const lightManualSw = document.getElementById('control-light-manual');
  
  if (pumpManualSw && state.control.pump_manual !== undefined) {
    pumpManualSw.checked = state.control.pump_manual;
  }
  if (lightManualSw && state.control.light_manual !== undefined) {
    lightManualSw.checked = state.control.light_manual;
  }

  // 4. Cập nhật thanh trượt Settings (chỉ cập nhật khi người dùng không focus/dragging để tránh bị giật)
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

  // Gắn sự kiện tab thu nhỏ
  document.querySelectorAll('.tab-mini-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-mini-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.chart;
      const isToday = t === 'today';
      
      const filtered = isToday ? logs.slice(-10) : logs.slice(-24); // Show more logs for weekly/long
      healthChart.data.labels = filtered.map(log => new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      healthChart.data.datasets[0].data = filtered.map(log => Math.round(log.lux));
      healthChart.data.datasets[1].data = filtered.map(log => Math.max(0, Math.min(100, Math.round(((4095 - log.soil_raw) / 4095) * 100))));
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

  let logs = [];
  try {
    const response = await fetch(`${BACKEND_URL}/api/logs`);
    logs = await response.json();
  } catch (error) {
    console.error('Lỗi khi tải lịch sử cho biểu đồ nước:', error);
  }

  // Baseline mặc định
  const defaultUsage = [1.2, 1.8, 0.6, 2.1, 1.5, 2.8, 2.5];
  
  // Tính toán lượng nước dựa vào tần suất sụt giảm soil_raw (ứng với mỗi lần bơm nước)
  if (logs.length > 1) {
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0]; // Thứ 2 -> Chủ Nhật
    for (let i = 1; i < logs.length; i++) {
      const prevVal = logs[i-1].soil_raw;
      const curVal = logs[i].soil_raw;
      
      // Nếu chỉ số soil_raw giảm từ 200 đơn vị trở lên (chứng tỏ ẩm tăng nhanh đột ngột - được tưới)
      if (prevVal - curVal >= 200) {
        const day = (new Date(logs[i].timestamp).getDay() + 6) % 7; // Map Chủ Nhật (0) -> 6, Thứ 2 (1) -> 0
        dailyCounts[day] += 0.2; // Ước tính 0.2 lít mỗi lần tưới 5s
      }
    }
    
    // Ghi đè dữ liệu ước tính thực tế
    for (let d = 0; d < 7; d++) {
      if (dailyCounts[d] > 0) {
        defaultUsage[d] = parseFloat(dailyCounts[d].toFixed(1));
      }
    }
  }

  waterChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'],
      datasets: [{
        label: 'Lít', data: defaultUsage,
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
