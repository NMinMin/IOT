import Chart from 'chart.js/auto';

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
      setWaterValue(window.currentWater !== undefined ? window.currentWater : 12, 0, 100);
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
    dashboard:  ['Vườn Sen Đá Của Tôi',     'Chào buổi sáng, người làm vườn! <img src="/Vector.svg" class="icon-plant" alt="Plant"/>'],
    statistics: ['<i data-lucide="trending-up"></i> Thống Kê & Lịch Sử',    'Theo dõi sự phát triển của vườn nhỏ <i data-lucide="clipboard-list"></i>'],
    settings:   ['<i data-lucide="settings"></i> Cài Đặt & Thông Báo',  'Chăm sóc vườn theo cách của bạn <img src="/Vector.svg" class="icon-plant" alt="Plant"/>'],
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

/* ── Sensor simulation ── */
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

export function startSensorSim() {
  window.currentWater = 12; // Initial value
  setInterval(() => {
    const lux = 12500 + Math.round((Math.random() - .5) * 500);
    const hum = 42    + Math.round((Math.random() - .5) * 4);
    
    // Simulate water draining slowly randomly
    // (Disabled as per user request)
    // if (Math.random() > 0.7 && window.currentWater > 0) {
    //   setWaterValue(window.currentWater - 1, 0, 100);
    // }
    
    const lEl = document.getElementById('val-light');
    const hEl = document.getElementById('val-hum');
    if (lEl) lEl.textContent = lux.toLocaleString('vi-VN') + ' Lux';
    if (hEl) hEl.textContent = hum + '%';
  }, 5000);
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
   CHART: Health Dashboard
══════════════════════════════════════════════ */
function initHealthChart() {
  if (healthChart) return;
  const ctx = document.getElementById('healthChart');
  if (!ctx) return;

  healthChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['06:00','08:00','10:00','12:00','14:00','16:00','18:00'],
      datasets: [
        {
          label: 'Ánh Sáng',
          data: [42,55,68,82,88,76,42],
          borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,.12)',
          borderWidth: 2.5, tension: .45, fill: false,
          pointBackgroundColor: '#f5c842', pointRadius: 4, pointHoverRadius: 7,
        },
        {
          label: 'Độ Ẩm Đất',
          data: [45,44,43,42,41,40,40],
          borderColor: '#5a8a65', backgroundColor: 'rgba(90,138,101,.12)',
          borderWidth: 2.5, tension: .45, fill: false,
          pointBackgroundColor: '#5a8a65', pointRadius: 4, pointHoverRadius: 7,
        }
      ]
    },
    options: chartOpts({ legend: true })
  });

  // Tab mini buttons
  document.querySelectorAll('.tab-mini-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-mini-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.chart;
      const labels = t === 'today'
        ? ['06:00','08:00','10:00','12:00','14:00','16:00','18:00']
        : ['T2','T3','T4','T5','T6','T7','CN'];
      healthChart.data.labels           = labels;
      healthChart.data.datasets[0].data = t === 'today' ? [42,55,68,82,88,76,42] : [58,65,70,55,80,88,62];
      healthChart.data.datasets[1].data = t === 'today' ? [45,44,43,42,41,40,40] : [50,48,52,46,44,42,45];
      healthChart.update('active');
    });
  });
}

/* ══════════════════════════════════════════════
   CHART: Statistics Light/Hum
══════════════════════════════════════════════ */
function initStatChart() {
  if (statChart) return;
  const ctx = document.getElementById('statChart');
  if (!ctx) return;

  const DATA = {
    daily:   { labels: ['00:00','04:00','08:00','12:00','16:00','20:00','23:59'], light: [0,1200,8500,14000,10000,3000,0],       hum: [60,58,55,52,50,54,58] },
    weekly:  { labels: ['T2','T3','T4','T5','T6','T7','CN'],                      light: [10500,12000,8000,13500,14200,11000,9500], hum: [52,48,60,46,44,50,55] },
    monthly: { labels: ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'], light: [8000,9500,11000,13000,14000,14200,13500,13000,12000,10500,9000,8000], hum: [55,58,52,48,44,42,43,45,50,54,58,60] },
  };

  statChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: DATA.daily.labels,
      datasets: [
        {
          label: 'Ánh sáng (Lux)', data: DATA.daily.light,
          borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,.15)',
          borderWidth: 2.5, tension: .45, fill: true,
          pointBackgroundColor: '#f5c842', pointRadius: 4, pointHoverRadius: 7,
          yAxisID: 'yL'
        },
        {
          label: 'Độ ẩm (%)', data: DATA.daily.hum,
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

  // Stats tabs
  document.querySelectorAll('#stats-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stats-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const d = DATA[btn.dataset.tab] || DATA.daily;
      statChart.data.labels           = d.labels;
      statChart.data.datasets[0].data = d.light;
      statChart.data.datasets[1].data = d.hum;
      statChart.update('active');
    });
  });
}

/* ══════════════════════════════════════════════
   CHART: Water Consumption Bar
══════════════════════════════════════════════ */
function initWaterChart() {
  if (waterChart) return;
  const ctx = document.getElementById('waterChart');
  if (!ctx) return;

  waterChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'],
      datasets: [{
        label: 'Lít', data: [1.2,1.8,.6,2.1,1.5,2.8,2.5],
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
