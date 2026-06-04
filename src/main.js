import './style.css';
import { loginHTML, appHTML } from './templates.js';
import { goTo, startSensorSim, toggleDark, bindSlider, showToast, setWaterValue, updateFirebaseControl, updateFirebaseSetting } from './app.js';

/* ── Render shell ── */
const root = document.getElementById('app');
root.innerHTML = loginHTML + appHTML;
lucide.createIcons();

/* ── Initial state: show login, hide app ── */
const shell = document.getElementById('app-shell');
const login = document.getElementById('page-login');
shell.style.display = 'none';
const initialNav = document.querySelector('.bottom-nav');
if (initialNav) initialNav.style.display = 'none';

/* ── Navigation helper ── */
function navigate(page) {
  const bNav = document.querySelector('.bottom-nav');
  if (page === 'login') {
    shell.style.display = 'none';
    login.style.display = '';
    if (bNav) bNav.style.display = 'none';
  } else {
    login.style.display = 'none';
    shell.style.display = '';
    if (bNav) bNav.style.display = '';
    window.__goToWithIcons(page);
  }
}

/* ── Login ── */
const doLogin = async () => {
  const username = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value.trim();
  
  if (!username || !password) {
    alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    return;
  }
  
  try {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      navigate('dashboard');
      showToast('<i data-lucide="user-check" style="width:18px;height:18px"></i> Đăng nhập thành công!');
    } else {
      alert(data.error || 'Đăng nhập thất bại!');
    }
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    alert('Không thể kết nối tới Server Backend. Vui lòng kiểm tra xem Server đã chạy chưa!');
  }
};
document.getElementById('btn-login').addEventListener('click', doLogin);
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

/* ── Logout ── */
document.getElementById('btn-logout').addEventListener('click', () => navigate('login'));

/* ── Bottom nav & data-goto buttons ── */
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.goto));
});

/* ── Back button ── */
document.getElementById('btn-back').addEventListener('click', () => navigate('dashboard'));

/* ── Route Interceptor to re-init icons dynamically rendered ── */
const _goTo = goTo;
window.__goToWithIcons = (page) => {
  _goTo(page);
  lucide.createIcons();
};

/* ── Avatar / Plant shortcuts → settings ── */
document.getElementById('avatar-goto-settings').addEventListener('click', () => navigate('settings'));
document.getElementById('plant-add').addEventListener('click', () => navigate('settings'));
document.getElementById('btn-sys-settings').addEventListener('click', () => navigate('settings'));

/* ── Water button (Tưới xung 5 giây) ── */
document.getElementById('btn-water').addEventListener('click', () => {
  updateFirebaseControl('pump_manual', true);
  showToast('<i data-lucide="droplet" style="width:18px;height:18px"></i> Đã gửi lệnh tưới nước (5 giây)!');
  setTimeout(() => {
    updateFirebaseControl('pump_manual', false);
  }, 5000);
});

/* ── Emergency stop ── */
document.getElementById('btn-emergency').addEventListener('click', () => {
  if (confirm('Bạn có chắc muốn dừng TOÀN BỘ hệ thống không?')) {
    // Ngắt khẩn cấp bằng cách tắt cả bơm và đèn thủ công
    updateFirebaseControl('pump_manual', false);
    updateFirebaseControl('light_manual', false);
    showToast('<i data-lucide="alert-octagon" style="width:18px;height:18px"></i> Hệ thống đã nhận lệnh tắt khẩn cấp!', 3500);
  }
});

/* ── Dark mode ── */
document.getElementById('dark-mode-toggle').addEventListener('change', e =>
  toggleDark(e.target.checked)
);

/* ── Sliders ── */
bindSlider('water-alert-slider', 'water-alert-label', '%');
bindSlider('hum-min',   'hum-min-label',   '%');
bindSlider('hum-max',   'hum-max-label',   '%');
// Đồng bộ hai chiều giữa thanh kéo và ô nhập số của ngưỡng bật đèn
const luxLowSlider = document.getElementById('lux-low');
const luxLowInput = document.getElementById('lux-low-input');
if (luxLowSlider && luxLowInput) {
  luxLowSlider.addEventListener('input', e => {
    luxLowInput.value = e.target.value;
  });
  luxLowSlider.addEventListener('change', e => {
    updateFirebaseSetting('lux_min', parseFloat(e.target.value));
  });
  luxLowInput.addEventListener('input', e => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 2000) val = 2000;
    luxLowSlider.value = val;
  });
  luxLowInput.addEventListener('change', e => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 2000) val = 2000;
    luxLowInput.value = Math.round(val);
    updateFirebaseSetting('lux_min', val);
  });
}

// Gửi cấu hình độ ẩm đất lên Firebase khi người dùng kéo và thả chuột (sự kiện change)
document.getElementById('hum-min').addEventListener('change', e => {
  const rawMin = Math.round(4095 - (e.target.value * 40.95));
  updateFirebaseSetting('soil_min', rawMin);
});
document.getElementById('hum-max').addEventListener('change', e => {
  const rawMax = Math.round(4095 - (e.target.value * 40.95));
  updateFirebaseSetting('soil_max', rawMax);
});

// Lắng nghe sự kiện bật/tắt thủ công máy bơm/đèn từ Dashboard
document.getElementById('control-pump-manual').addEventListener('change', e => {
  updateFirebaseControl('pump_manual', e.target.checked);
});
document.getElementById('control-light-manual').addEventListener('change', e => {
  updateFirebaseControl('light_manual', e.target.checked);
});

/* ── IoT sync initiation ── */
startSensorSim();
