import './style.css';
import { loginHTML, appHTML } from './templates.js';
import { goTo, startSensorSim, toggleDark, bindSlider, showToast, setWaterValue } from './app.js';

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
    goTo(page);
  }
}

/* ── Login ── */
const doLogin = () => navigate('dashboard');
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

/* ── Water button ── */
document.getElementById('btn-water').addEventListener('click', () => {
  if (window.currentWater !== undefined && window.currentWater >= 5) {
    setWaterValue(window.currentWater - 5);
  }
  showToast('<i data-lucide="droplet" style="width:18px;height:18px"></i> Đã gửi lệnh tưới nước!');
});

/* ── Emergency stop ── */
document.getElementById('btn-emergency').addEventListener('click', () => {
  if (confirm('Bạn có chắc muốn dừng TOÀN BỘ hệ thống không?')) {
    showToast('<i data-lucide="alert-octagon" style="width:18px;height:18px"></i> Hệ thống đã dừng khẩn cấp!', 3500);
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
bindSlider('lux-shade', 'lux-shade-label', ' lx');
bindSlider('lux-low',   'lux-low-label',   ' lx');

/* ── IoT simulation ── */
startSensorSim();
