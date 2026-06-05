import './style.css';
import { loginHTML, appHTML } from './templates.js';
import {
  goTo, startSensorSim, toggleDark, bindSlider, showToast,
  setWaterValue, updateFirebaseControl, updateFirebaseSetting,
  decreaseTankWater, WATER_PER_MANUAL_PCT, addActivityLog,
  openPumpHistoryModal, saveTankWater, getTankWater, showFancyToast,
  loadUserProfile, exportToExcel, exportToPDF
} from './app.js';
import { t } from './locales.js';

/* ── Render shell ── */
const root = document.getElementById('app');
root.innerHTML = loginHTML + appHTML;

// Khởi tạo trạng thái Chế độ tối (Dark mode) từ localStorage
const isDark = localStorage.getItem('darkMode') === '1' || localStorage.getItem('darkMode') === 'true';
document.body.classList.toggle('dark', isDark);
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
  darkModeToggle.checked = isDark;
}

// Khởi tạo bộ chọn Ngôn ngữ
const langSelect = document.getElementById('language-select');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    localStorage.setItem('language', e.target.value);
    window.location.reload();
  });
}

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
    alert(t('login_empty_alert'));
    return;
  }

  const btnLogin = document.getElementById('btn-login');
  btnLogin.disabled = true;
  btnLogin.textContent = t('login_loading');

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
      showToast('<i data-lucide="user-check" style="width:18px;height:18px"></i> ' + t('login_success'));
    } else {
      alert(data.error || t('login_fail'));
      btnLogin.disabled = false;
      btnLogin.textContent = t('login_btn');
    }
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    alert(t('login_conn_err'));
    btnLogin.disabled = false;
    btnLogin.textContent = t('login_btn');
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
  addActivityLog('water_manual', t('log_title_refill'), t('log_desc_refill'));
  
  const alertWaterLow = document.getElementById('alert-water-low');
  if (alertWaterLow) alertWaterLow.classList.add('hidden');
  const globalWaterAlert = document.getElementById('global-water-alert');
  if (globalWaterAlert) globalWaterAlert.classList.add('hidden');
  window._waterAlertEmailSent = false;
  
  showFancyToast(t('toast_refill_title'), t('toast_refill_success'), 'success');
});

/* ── Export Data PDF & Excel ── */
const btnExportExcel = document.getElementById('btn-export-excel');
const btnExportPdf = document.getElementById('btn-export-pdf');

if (btnExportExcel) {
  btnExportExcel.addEventListener('click', exportToExcel);
}
if (btnExportPdf) {
  btnExportPdf.addEventListener('click', exportToPDF);
}



/* ── Water button (Tưới thủ công 5 giây) ── */
document.getElementById('btn-water').addEventListener('click', () => {
  const isWaterLow = window.firebaseState.sensor.water_status === 'HET_NUOC' || getTankWater() < 5;
  if (isWaterLow) {
    showFancyToast(t('toast_op_error'), t('toast_water_empty'), 'error', 4500);
    return;
  }

  const pumpManualSw = document.getElementById('control-pump-manual');
  if (pumpManualSw) pumpManualSw.checked = true;

  updateFirebaseControl('pump_manual', true);
  decreaseTankWater(WATER_PER_MANUAL_PCT); // -9%: 45ml / 500ml
  addActivityLog('water_manual', t('log_title_water_manual'), t('log_desc_water_manual'));
  showFancyToast(t('toast_pump_active'), t('toast_pump_manual_start'), 'success', 5000);
  
  setTimeout(() => {
    if (pumpManualSw) pumpManualSw.checked = false;
    updateFirebaseControl('pump_manual', false);
    addActivityLog('pump_off', t('log_title_pump_off'), t('log_desc_pump_off_after'));
  }, 5000);
});

/* ── Emergency stop ── */
document.getElementById('btn-emergency').addEventListener('click', () => {
  const isCurrentlyEmergency = window.firebaseState?.control?.emergency === true;
  
  if (!isCurrentlyEmergency) {
    if (confirm(t('confirm_emergency_stop'))) {
      updateFirebaseControl('emergency', true);
      updateFirebaseControl('pump_manual', false);
      updateFirebaseControl('light_manual', false);
      addActivityLog('emergency', t('log_title_emergency_stop'), t('log_desc_emergency_stop'));
    }
  } else {
    if (confirm(t('confirm_emergency_restore'))) {
      updateFirebaseControl('emergency', false);
      addActivityLog('emergency', t('log_title_emergency_restore'), t('log_desc_emergency_restore'));
    }
  }
});

/* ── Dark mode ── */
document.getElementById('dark-mode-toggle').addEventListener('change', e =>
  toggleDark(e.target.checked)
);

/* ── Email Notification Toggle ── */
const emailToggle = document.getElementById('email-notification-toggle');
if (emailToggle) {
  emailToggle.addEventListener('change', async (e) => {
    const currentUsername = emailInput.value.trim() || 'nhacphuoc25';
    const emailAlertEnabled = e.target.checked;
    
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, emailAlertEnabled })
      });
      if (res.ok) {
        showFancyToast(t('toast_refill_title'), emailAlertEnabled ? t('toast_email_alert_enabled') : t('toast_email_alert_disabled'), 'success', 2500);
      } else {
        showFancyToast(t('toast_error_title'), t('toast_save_alert_fail'), 'error', 3000);
      }
    } catch (err) {
      console.error('Lỗi lưu cài đặt thông báo:', err);
      showFancyToast(t('toast_error_title'), t('toast_conn_error'), 'error', 3000);
    }
  });
}

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
      addActivityLog('water_manual', t('log_title_pump_manual_on'), t('log_desc_pump_manual_on'));
    } else {
      addActivityLog('pump_off', t('log_title_pump_off'), t('log_desc_pump_off_manual'));
    }
  });
}

document.getElementById('control-light-manual').addEventListener('change', e => {
  updateFirebaseControl('light_manual', e.target.checked);
  if (e.target.checked) {
    addActivityLog('light_on', t('log_title_light_on'), t('log_desc_light_on'));
  } else {
    addActivityLog('light_off', t('log_title_light_off'), t('log_desc_light_off'));
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
      alert(t('toast_profile_email_empty'));
      return;
    }
    
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = t('profile_saving');
    
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
        
        showFancyToast(t('toast_refill_title'), t('toast_profile_success'), 'success');
        hideProfileModal();
      } else {
        alert(data.error || t('toast_profile_update_fail'));
      }
    } catch (err) {
      console.error('Lỗi cập nhật hồ sơ:', err);
      alert(t('toast_server_conn_error'));
    } finally {
      btnSaveProfile.disabled = false;
      btnSaveProfile.textContent = t('modal_profile_btn_save');
    }
  });
}

/* ── Modal Chi Tiết Nhật Ký ── */
const modalActivity = document.getElementById('modal-activity-detail');
const btnCloseActivityModal = document.getElementById('btn-close-activity-modal');
const activityContent = document.getElementById('activity-detail-content');

const logListContainer = document.getElementById('activity-log-list');
if (logListContainer) {
  logListContainer.addEventListener('click', (e) => {
    const logItem = e.target.closest('.log-item');
    if (!logItem) return;

    const title = logItem.dataset.title || '';
    const desc = logItem.dataset.desc || '';
    const date = logItem.dataset.date || '';
    const time = logItem.dataset.time || '';
    const cat = logItem.dataset.cat || '';

    let catName = t('stats_filter_light');
    let catIcon = 'sun';
    let catColor = 'yellow';
    if (cat === 'bom') {
      catName = t('stats_filter_pump');
      catIcon = 'droplet';
      catColor = 'blue';
    } else if (cat === 'canh_bao') {
      catName = t('stats_filter_alert');
      catIcon = 'alert-triangle';
      catColor = 'red';
    } else if (cat === 'lich') {
      catName = t('stats_filter_schedule');
      catIcon = 'calendar';
      catColor = 'green';
    }

    if (activityContent && modalActivity) {
      activityContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="log-icon ${catColor}" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 24px;">
            <i data-lucide="${catIcon}"></i>
          </div>
          <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8A968C; letter-spacing: 0.5px;">${catName}</span>
        </div>
        
        <div class="activity-detail-desc-box" style="background: var(--bg-color); border: 1.5px solid var(--dark-green); border-radius: 12px; padding: 16px; margin-bottom: 16px; line-height: 1.6;">
          <h4 style="margin: 0 0 8px; color: var(--dark-green); font-size: 15px; font-weight: 700;">${title}</h4>
          ${desc ? `<p style="margin: 0; color: var(--dark-green); font-size: 13px; opacity: 0.9;">${desc}</p>` : ''}
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 12px; font-size: 13px; color: #8A968C;">
          <div style="display: flex; justify-content: space-between;">
            <span>${t('modal_activity_time')}</span>
            <strong style="color: var(--dark-green);">${time}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>${t('modal_activity_date')}</span>
            <strong style="color: var(--dark-green);">${date.split('-').reverse().join('/')}</strong>
          </div>
        </div>
      `;

      modalActivity.classList.remove('hidden');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: modalActivity });
      }
    }
  });
}

if (btnCloseActivityModal) {
  btnCloseActivityModal.addEventListener('click', () => {
    modalActivity.classList.add('hidden');
  });
}
if (modalActivity) {
  modalActivity.addEventListener('click', (e) => {
    if (e.target === modalActivity) {
      modalActivity.classList.add('hidden');
    }
  });
}

/* ── Modal Lịch Bảo Trì ── */
const btnSaveMaint        = document.getElementById('btn-save-maint');
const maintDatetimeInput  = document.getElementById('maint-datetime');
const maintCategorySelect = document.getElementById('maint-category');
const maintScheduledList  = document.getElementById('maint-scheduled-list');

const MAINT_API = 'http://localhost:5000/api/maintenance';

const MAINT_CATEGORY_LABELS = {
  soil:       t('schedule_opt_soil').replace('🪴 ', ''),
  fertilizer: t('schedule_opt_fertilizer').replace('🌿 ', ''),
  prune:      t('schedule_opt_prune').replace('✂️ ', ''),
};

const MAINT_CATEGORY_COLORS = {
  soil:       '#A07C5A',
  fertilizer: '#88AB75',
  prune:      '#78C0ED',
};

const DOW_LABELS = [
  t('dow_sun'),
  t('dow_mon'),
  t('dow_tue'),
  t('dow_wed'),
  t('dow_thu'),
  t('dow_fri'),
  t('dow_sat')
];

// Trạng thái recurrence hiện tại
let maintRecurMode = 'once';   // 'once' | 'weekly' | 'monthly'
let maintSelectedDows = [];    // [0..6] cho weekly

const formatMaintDateTime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatMaintRecur = (item) => {
  if (!item.recurrence || item.recurrence === 'once') {
    return formatMaintDateTime(item.datetime);
  }
  if (item.recurrence === 'weekly') {
    const dayNames = (item.daysOfWeek || []).map(d => DOW_LABELS[d]).join(', ');
    return `${t('schedule_recur_weekly_prefix')} ${dayNames || '--'} ${t('schedule_recur_at')} ${item.time || '--'}`;
  }
  if (item.recurrence === 'monthly') {
    return `${t('schedule_recur_monthly_prefix')} ${item.dayOfMonth || '--'} ${t('schedule_recur_at')} ${item.time || '--'}`;
  }
  return formatMaintDateTime(item.datetime);
};

// Cập nhật giao diện theo recur mode
const applyRecurMode = (mode) => {
  maintRecurMode = mode;

  // Cập nhật nút
  document.querySelectorAll('.maint-recur-btn').forEach(btn => {
    const isActive = btn.dataset.recur === mode;
    btn.classList.toggle('active', isActive);
    btn.style.background    = isActive ? 'var(--primary-green)' : '#f5f5f5';
    btn.style.color         = isActive ? '#fff' : 'var(--dark-green)';
    btn.style.borderColor   = isActive ? 'var(--primary-green)' : '#ccc';
  });

  // Hiện/ẩn panel
  document.getElementById('maint-panel-once').style.display    = mode === 'once'    ? '' : 'none';
  document.getElementById('maint-panel-weekly').style.display  = mode === 'weekly'  ? '' : 'none';
  document.getElementById('maint-panel-monthly').style.display = mode === 'monthly' ? '' : 'none';
};

// Render danh sách lịch
const renderMaintList = async () => {
  if (!maintScheduledList) return;
  maintScheduledList.innerHTML = `<p style="font-size:13px; color:#8A968C; text-align:center; padding: 8px 0;">${t('loading_data')}</p>`;

  let list = [];
  try {
    const res = await fetch(MAINT_API);
    if (res.ok) list = await res.json();
  } catch (e) {
    maintScheduledList.innerHTML = `<p style="font-size:13px; color:#F26157; text-align:center; padding: 8px 0;">${t('toast_conn_error')}</p>`;
    return;
  }

  if (list.length === 0) {
    maintScheduledList.innerHTML = `<p style="font-size:13px; color:#8A968C; text-align:center; padding: 8px 0;">${t('schedule_no_list')}</p>`;
    return;
  }

  maintScheduledList.innerHTML = list.map((item) => {
    const color = MAINT_CATEGORY_COLORS[item.category] || '#88AB75';
    const label = MAINT_CATEGORY_LABELS[item.category] || item.category;
    const recurStr = formatMaintRecur(item);

    const isRecur = item.recurrence && item.recurrence !== 'once';
    const isPast  = !isRecur && item.datetime && new Date(item.datetime) < new Date();

    let badgeHtml = '';
    if (isRecur) {
      badgeHtml = `<span style="font-size:10px; background:#e8f4fd; color:#0c5460; border-radius:99px; padding:2px 8px; font-weight:700; margin-top:3px; display:inline-block;">${t('schedule_badge_repeat')}</span>`;
    } else if (item.notified) {
      badgeHtml = `<span style="font-size:10px; background:#d4edda; color:#155724; border-radius:99px; padding:2px 8px; font-weight:700; margin-top:3px; display:inline-block;">${t('schedule_badge_notified')}</span>`;
    } else if (isPast) {
      badgeHtml = `<span style="font-size:10px; background:#fff3cd; color:#856404; border-radius:99px; padding:2px 8px; font-weight:700; margin-top:3px; display:inline-block;">${t('schedule_badge_past')}</span>`;
    } else {
      badgeHtml = `<span style="font-size:10px; background:#e8f4fd; color:#0c5460; border-radius:99px; padding:2px 8px; font-weight:700; margin-top:3px; display:inline-block;">${t('schedule_badge_pending')}</span>`;
    }

    return `
      <div style="display:flex; align-items:center; gap:10px; background:#F9FAF7; border:1.5px solid #E2E4D9; border-radius:10px; padding:10px 12px;">
        <div style="width:34px; height:34px; border-radius:50%; background:${color}22; border:1.5px solid ${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:700; color:${color};">${label}</div>
          <div style="font-size:12px; color:#8A968C; margin-top:2px;">${recurStr}</div>
          ${badgeHtml}
        </div>
        <button data-id="${item._id}" class="btn-maint-delete" style="background:transparent; border:none; color:#F26157; padding:4px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: background 0.15s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>`;
  }).join('');

  maintScheduledList.querySelectorAll('.btn-maint-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      btn.disabled = true;
      try {
        const res = await fetch(`${MAINT_API}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addActivityLog('schedule', t('log_title_schedule_delete'), t('log_desc_schedule_delete'));
          showFancyToast(t('toast_deleted_title'), t('schedule_toast_delete_success'), 'success', 2500);
          await renderMaintList();
        } else {
          showFancyToast(t('toast_error_title'), t('schedule_toast_delete_fail'), 'error', 3000);
          btn.disabled = false;
        }
      } catch (e) {
        showFancyToast(t('toast_error_title'), t('toast_conn_error'), 'error', 3000);
        btn.disabled = false;
      }
    });
  });
};

// Không cần hideMaintModal nữa vì đã chuyển thành trang riêng

// Nút chọn kiểu nhắc
document.querySelectorAll('.maint-recur-btn').forEach(btn => {
  btn.addEventListener('click', () => applyRecurMode(btn.dataset.recur));
});

// Nút chọn ngày trong tuần (toggle)
document.querySelectorAll('.maint-dow-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const dow = parseInt(btn.dataset.dow);
    const idx = maintSelectedDows.indexOf(dow);
    if (idx === -1) {
      maintSelectedDows.push(dow);
      btn.classList.add('active');
      btn.style.background   = 'var(--primary-green)';
      btn.style.color        = '#fff';
      btn.style.borderColor  = 'var(--primary-green)';
    } else {
      maintSelectedDows.splice(idx, 1);
      btn.classList.remove('active');
      btn.style.background   = '#f5f5f5';
      btn.style.color        = 'var(--dark-green)';
      btn.style.borderColor  = '#ccc';
    }
  });
});

// Hiện/ẩn custom category input
if (maintCategorySelect) {
  maintCategorySelect.addEventListener('change', () => {
    const customWrap = document.getElementById('maint-custom-wrap');
    if (customWrap) customWrap.style.display = maintCategorySelect.value === 'custom' ? '' : 'none';
  });
}

window.__initSchedulePage = async () => {
  // Reset UI
  applyRecurMode('once');
  maintSelectedDows = [];
  document.querySelectorAll('.maint-dow-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background  = '#f5f5f5';
    b.style.color       = 'var(--dark-green)';
    b.style.borderColor = '#ccc';
  });

  if (maintDatetimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    maintDatetimeInput.value = now.toISOString().slice(0, 16);
  }
  const wt = document.getElementById('maint-weekly-time');
  if (wt) wt.value = '08:00';
  const mt = document.getElementById('maint-monthly-time');
  if (mt) mt.value = '08:00';
  const md = document.getElementById('maint-monthly-day');
  if (md) md.value = '1';

  if (maintCategorySelect) maintCategorySelect.value = 'soil';
  const customWrap = document.getElementById('maint-custom-wrap');
  if (customWrap) customWrap.style.display = 'none';

  if (typeof lucide !== 'undefined') lucide.createIcons({ root: document.getElementById('page-schedule') });
  await renderMaintList();
};

if (btnSaveMaint) {
  btnSaveMaint.addEventListener('click', async () => {
    let categoryVal = maintCategorySelect ? maintCategorySelect.value : 'soil';
    if (categoryVal === 'custom') {
      const customInput = document.getElementById('maint-custom-category');
      const customVal = customInput ? customInput.value.trim() : '';
      if (!customVal) {
        showFancyToast(t('toast_missing_info_title'), t('toast_missing_category'), 'error', 3000);
        return;
      }
      categoryVal = customVal;
    }

    let body = { category: categoryVal, recurrence: maintRecurMode };

    if (maintRecurMode === 'once') {
      const datetimeVal = maintDatetimeInput ? maintDatetimeInput.value : '';
      if (!datetimeVal) {
        showFancyToast(t('toast_missing_info_title'), t('toast_missing_datetime'), 'error', 3000);
        return;
      }
      body.datetime = new Date(datetimeVal).toISOString();

    } else if (maintRecurMode === 'weekly') {
      if (maintSelectedDows.length === 0) {
        showFancyToast(t('toast_missing_info_title'), t('toast_missing_dow'), 'error', 3000);
        return;
      }
      const wt = document.getElementById('maint-weekly-time');
      const timeVal = wt ? wt.value : '08:00';
      body.daysOfWeek = maintSelectedDows.slice().sort((a, b) => a - b);
      body.time = timeVal;

    } else if (maintRecurMode === 'monthly') {
      const md = document.getElementById('maint-monthly-day');
      const mt = document.getElementById('maint-monthly-time');
      const dayVal = md ? parseInt(md.value) : 1;
      const timeVal = mt ? mt.value : '08:00';
      if (!dayVal || dayVal < 1 || dayVal > 28) {
        showFancyToast(t('toast_missing_info_title'), t('toast_missing_dom'), 'error', 3000);
        return;
      }
      body.dayOfMonth = dayVal;
      body.time = timeVal;
    }

    btnSaveMaint.disabled = true;
    btnSaveMaint.textContent = t('schedule_saving');

    try {
      const res = await fetch(MAINT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Reset form về trạng thái ban đầu
        applyRecurMode('once');
        maintSelectedDows = [];
        document.querySelectorAll('.maint-dow-btn').forEach(b => {
          b.style.background = '#f5f5f5';
          b.style.color = 'var(--dark-green)';
          b.style.borderColor = '#ccc';
        });
        if (maintDatetimeInput) {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          maintDatetimeInput.value = now.toISOString().slice(0, 16);
        }
        if (maintCategorySelect) maintCategorySelect.value = 'soil';

        const recurLabel = {
          once: t('schedule_recur_once'),
          weekly: t('schedule_recur_weekly'),
          monthly: t('schedule_recur_monthly')
        }[maintRecurMode] || '';
        const catLabel = MAINT_CATEGORY_LABELS[categoryVal] || categoryVal;

        // Ghi nhật ký hoạt động phía frontend (hiển thị ngay)
        addActivityLog(
          'schedule',
          `${t('log_title_schedule_create')}: ${catLabel}`,
          t('log_desc_schedule_create')
            .replace('{recur}', recurLabel.toLowerCase())
            .replace('{cat}', catLabel)
        );

        showFancyToast(t('toast_refill_title'), `${t('schedule_toast_save_success')} ${catLabel} (${recurLabel})!`, 'success', 3000);
        await renderMaintList();
      } else {
        const err = await res.json();
        showFancyToast(t('toast_error_title'), err.error || t('schedule_toast_save_fail'), 'error', 3000);
      }
    } catch (e) {
      showFancyToast(t('toast_error_title'), t('toast_conn_error'), 'error', 3000);
    } finally {
      btnSaveMaint.disabled = false;
      btnSaveMaint.textContent = t('schedule_btn_save');
    }
  });
}
