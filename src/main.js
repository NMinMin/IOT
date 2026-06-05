import './style.css';
import { loginHTML, appHTML } from './templates.js';
import {
  goTo, startSensorSim, toggleDark, bindSlider, showToast,
  setWaterValue, updateFirebaseControl, updateFirebaseSetting,
  decreaseTankWater, WATER_PER_MANUAL_PCT, addActivityLog,
  openPumpHistoryModal, saveTankWater, getTankWater, showFancyToast,
  loadUserProfile
} from './app.js';

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

/* ── Ghi nhớ đăng nhập: điền sẵn nếu đã lưu ── */
const rememberCb   = document.getElementById('remember');
const emailInput   = document.getElementById('login-email');
const passInput    = document.getElementById('login-pass');
const savedUser    = localStorage.getItem('rememberedUsername');
const savedPass    = localStorage.getItem('rememberedPassword');
if (savedUser) {
  emailInput.value  = savedUser;
  passInput.value   = savedPass || '';
  if (rememberCb) rememberCb.checked = true;
}

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
  const username = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    return;
  }

  const btnLogin = document.getElementById('btn-login');
  btnLogin.disabled = true;
  btnLogin.textContent = 'Đang đăng nhập...';

  try {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      // Ghi nhớ đăng nhập
      if (rememberCb && rememberCb.checked) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
      }
      navigate('dashboard');
      loadUserProfile(username);
      showToast('<i data-lucide="user-check" style="width:18px;height:18px"></i> Đăng nhập thành công!');
    } else {
      alert(data.error || 'Đăng nhập thất bại!');
      btnLogin.disabled = false;
      btnLogin.textContent = 'Đăng Nhập';
    }
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    alert('Không thể kết nối tới Server Backend. Vui lòng kiểm tra xem Server đã chạy chưa!');
    btnLogin.disabled = false;
    btnLogin.textContent = 'Đăng Nhập';
  }
};
document.getElementById('btn-login').addEventListener('click', doLogin);
passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

/* ── Auto-login nếu đã ghi nhớ ── */
if (savedUser && savedPass) {
  setTimeout(doLogin, 400); // đợi DOM ổn định rồi tự đăng nhập
}


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

/* ── Lịch sử bơm modal ── */
const btnPump = document.querySelector('.btn-pump');
const modalPump = document.getElementById('modal-pump-history');
const btnClosePumpModal = document.getElementById('btn-close-pump-modal');

if (btnPump) {
  btnPump.addEventListener('click', openPumpHistoryModal);
}
if (btnClosePumpModal) {
  btnClosePumpModal.addEventListener('click', () => {
    modalPump.classList.add('hidden');
  });
}
if (modalPump) {
  modalPump.addEventListener('click', (e) => {
    if (e.target === modalPump) {
      modalPump.classList.add('hidden');
    }
  });
}

/* ── Refill Water button click handler ── */
document.getElementById('btn-refill-water').addEventListener('click', () => {
  saveTankWater(100);
  setWaterValue(100, 0, 100);
  addActivityLog('water_manual', 'Châm nước thủ công', 'Đã châm đầy bể nước (100%).');
  
  const alertWaterLow = document.getElementById('alert-water-low');
  if (alertWaterLow) alertWaterLow.classList.add('hidden');
  const globalWaterAlert = document.getElementById('global-water-alert');
  if (globalWaterAlert) globalWaterAlert.classList.add('hidden');
  window._waterAlertEmailSent = false;
  
  showFancyToast('Thành công', 'Đã châm đầy bể nước 100%!', 'success');
});



/* ── Water button (Tưới thủ công 5 giây) ── */
document.getElementById('btn-water').addEventListener('click', () => {
  const isWaterLow = window.firebaseState.sensor.water_status === 'HET_NUOC' || getTankWater() < 5;
  if (isWaterLow) {
    showFancyToast('Lỗi vận hành', 'Không thể tưới nước khi bể chứa cạn. Vui lòng thêm nước!', 'error', 4500);
    return;
  }

  const pumpManualSw = document.getElementById('control-pump-manual');
  if (pumpManualSw) pumpManualSw.checked = true;

  updateFirebaseControl('pump_manual', true);
  decreaseTankWater(WATER_PER_MANUAL_PCT); // -9%: 45ml / 500ml
  addActivityLog('water_manual', 'Tưới nước thủ công', 'Đã bơm ~45ml nước cho vườn (5 giây).');
  showFancyToast('Máy bơm đang hoạt động', 'Hệ thống đang tưới nước thủ công (5 giây)...', 'success', 5000);
  
  setTimeout(() => {
    if (pumpManualSw) pumpManualSw.checked = false;
    updateFirebaseControl('pump_manual', false);
    addActivityLog('pump_off', 'Tắt máy bơm', 'Máy bơm đã tắt sau khi tưới xong.');
  }, 5000);
});

/* ── Emergency stop ── */
document.getElementById('btn-emergency').addEventListener('click', () => {
  if (confirm('Bạn có chắc muốn dừng TOÀN BỘ hệ thống không?')) {
    updateFirebaseControl('pump_manual', false);
    updateFirebaseControl('light_manual', false);
    addActivityLog('emergency', 'Dừng khẩn cấp', 'Toàn bộ bơm & đèn đã bị ngắt khẩn cấp.');
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

const luxLowSlider = document.getElementById('lux-low');
const luxLowInput  = document.getElementById('lux-low-input');
if (luxLowSlider && luxLowInput) {
  luxLowSlider.addEventListener('input', e => { luxLowInput.value = e.target.value; });
  luxLowSlider.addEventListener('change', e => {
    updateFirebaseSetting('lux_min', parseFloat(e.target.value));
  });
  luxLowInput.addEventListener('input', e => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(2000, val));
    luxLowSlider.value = val;
  });
  luxLowInput.addEventListener('change', e => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(2000, val));
    luxLowInput.value = Math.round(val);
    updateFirebaseSetting('lux_min', val);
  });
}

document.getElementById('hum-min').addEventListener('change', e => {
  const rawMin = Math.round(4095 - (e.target.value * 40.95));
  updateFirebaseSetting('soil_min', rawMin);
});
document.getElementById('hum-max').addEventListener('change', e => {
  const rawMax = Math.round(4095 - (e.target.value * 40.95));
  updateFirebaseSetting('soil_max', rawMax);
});

/* ── Điều khiển thủ công máy bơm / đèn ── */
const pumpManualSw = document.getElementById('control-pump-manual');
if (pumpManualSw) {
  pumpManualSw.addEventListener('change', e => {
    updateFirebaseControl('pump_manual', e.target.checked);
    if (e.target.checked) {
      decreaseTankWater(WATER_PER_MANUAL_PCT);
      addActivityLog('water_manual', 'Bật máy bơm thủ công', 'Đã bơm ~45ml nước.');
    } else {
      addActivityLog('pump_off', 'Tắt máy bơm', 'Máy bơm đã được tắt.');
    }
  });
}

document.getElementById('control-light-manual').addEventListener('change', e => {
  updateFirebaseControl('light_manual', e.target.checked);
  if (e.target.checked) {
    addActivityLog('light_on', 'Bật đèn LED', 'Đèn LED đã được bật thủ công.');
  } else {
    addActivityLog('light_off', 'Tắt đèn LED', 'Đèn LED đã được tắt thủ công.');
  }
});

/* ── IoT sync initiation ── */
startSensorSim();

/* ── Modal Chỉnh sửa hồ sơ ── */
const btnEditProfile = document.getElementById('btn-edit-profile');
const modalEditProfile = document.getElementById('modal-edit-profile');
const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
const btnCancelProfile = document.getElementById('btn-cancel-profile');
const btnSaveProfile = document.getElementById('btn-save-profile');

const editUsernameInput = document.getElementById('edit-profile-username');
const editEmailInput = document.getElementById('edit-profile-email');
const editPasswordInput = document.getElementById('edit-profile-password');

if (btnEditProfile) {
  btnEditProfile.addEventListener('click', async () => {
    const currentUsername = emailInput.value.trim() || 'nhacphuoc25';
    editUsernameInput.value = currentUsername;
    editPasswordInput.value = '';
    
    // Tải profile để điền email hiện tại
    try {
      const res = await fetch(`http://localhost:5000/api/user/profile?username=${encodeURIComponent(currentUsername)}`);
      if (res.ok) {
        const data = await res.json();
        editEmailInput.value = data.email || '';
      }
    } catch (err) {
      console.error('Không thể lấy thông tin hồ sơ:', err);
    }
    
    modalEditProfile.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: modalEditProfile });
  });
}

const hideProfileModal = () => {
  modalEditProfile.classList.add('hidden');
};

if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', hideProfileModal);
if (btnCancelProfile) btnCancelProfile.addEventListener('click', hideProfileModal);
if (modalEditProfile) {
  modalEditProfile.addEventListener('click', (e) => {
    if (e.target === modalEditProfile) hideProfileModal();
  });
}

if (btnSaveProfile) {
  btnSaveProfile.addEventListener('click', async () => {
    const username = editUsernameInput.value;
    const email = editEmailInput.value.trim();
    const password = editPasswordInput.value.trim();
    
    if (!email) {
      alert('Vui lòng nhập email!');
      return;
    }
    
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = 'Đang lưu...';
    
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Cập nhật lại giao diện hiển thị
        const emailEl = document.getElementById('profile-display-email');
        if (emailEl) emailEl.textContent = data.email;
        
        // Nếu thay đổi password, cập nhật cả savedPass để auto-login hoạt động đúng
        if (password) {
          localStorage.setItem('rememberedPassword', password);
          passInput.value = password;
        }
        
        showFancyToast('Thành công', 'Đã cập nhật thông tin hồ sơ!', 'success');
        hideProfileModal();
      } else {
        alert(data.error || 'Cập nhật thất bại!');
      }
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      alert('Lỗi kết nối tới Server.');
    } finally {
      btnSaveProfile.disabled = false;
      btnSaveProfile.textContent = 'Lưu thay đổi';
    }
  });
}

