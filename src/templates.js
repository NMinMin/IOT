import { t, currentLang } from './locales.js';

export const loginHTML = /* html */`
<div id="page-login">
  <div class="login-card">
    <div class="login-left">
      <div class="login-logo"><img src="./Vector.svg" class="icon-plant" alt="Plant"/></div>
      <h1>${t('login_title')}</h1>
      <p>${t('login_sub')}</p>
    </div>
    <div class="login-right">
      <h2>${t('login_welcome')}</h2>
      <p>${t('login_sub_welcome')} <img src="./Vector.svg" class="icon-plant" alt="Plant"/></p>
      <div class="form-group">
        <div class="input-wrap">
          <input id="login-email" type="text" placeholder="${t('login_username')}" />
          <span class="input-icon"><i data-lucide="user"></i></span>
        </div>
      </div>
      <div class="form-group">
        <div class="input-wrap">
          <input id="login-pass" type="password" placeholder="${t('login_password')}" />
          <span class="input-icon"><i data-lucide="lock"></i></span>
        </div>
      </div>
      <label class="remember-label">
        <input type="checkbox" id="remember" />
        <span class="check-box"></span>
        ${t('login_remember')}
      </label>
      <button class="btn-login" id="btn-login">${t('login_btn')}</button>
    </div>
  </div>
</div>
`;

export const appHTML = /* html */`
<div id="app-shell" style="display:none">
  <!-- Header -->
  <header class="top-header">
    <div class="header-left">
      <button class="btn-back hidden" id="btn-back"><i data-lucide="arrow-left"></i></button>
      <div class="header-logo"><img src="./Vector.svg" class="icon-plant" alt="Plant"/></div>
      <div class="hdr-title-wrap">
        <span class="hdr-title" id="hdr-title">${t('login_title')}</span>
        <span class="hdr-sub" id="hdr-sub">${t('hdr_sub_dashboard')}</span>
      </div>
    </div>
    <div class="header-right">
      <nav class="desktop-menu">
        <button class="nav-btn-desktop active" data-goto="dashboard">${t('nav_dashboard')}</button>
        <button class="nav-btn-desktop" data-goto="statistics">${t('nav_statistics')}</button>
        <button class="nav-btn-desktop" data-goto="schedule">${t('nav_schedule')}</button>
        <button class="nav-btn-desktop" data-goto="settings">${t('nav_settings')}</button>
      </nav>
      <div class="weather-badge" id="weather-badge">
        <span id="weather-badge-icon-wrap"><span><i data-lucide="cloud-sun"></i></span></span><span class="weather-temp" id="weather-badge-temp">32°C</span>
        <span class="sep">|</span><span id="weather-badge-city">${t('weather_city')}</span>
      </div>
      <div class="avatar-wrap" id="avatar-goto-settings">
        <img src="./doc.jpg" alt="Avatar" class="avatar" />
      </div>
    </div>
  </header>

  <!-- ══ DASHBOARD ══ -->
  <div id="page-dashboard" class="inner-page active">
    <div class="dashboard-grid">

      <!-- Hero -->
      <div class="hero-card">
        <img src="./ngang.jpg" alt="Vườn sen đá" class="hero-img" />
        <div class="hero-overlay">
          <div class="hero-top">
            <div class="pill">
              <div class="pill-icon yellow"><i data-lucide="sun" style="width:18px;height:18px"></i></div>
              <div>
                <div class="pill-text">${t('light_title')}</div>
                <div class="pill-val" id="val-light">12,500 Lux</div>
              </div>
            </div>
            <div class="pill">
              <div class="pill-icon blue"><i data-lucide="droplet" style="width:18px;height:18px"></i></div>
              <div>
                <div class="pill-text">${t('soil_hum_title')}</div>
                <div class="pill-val" id="val-hum">42%</div>
              </div>
            </div>
          </div>
          <div class="hero-bottom">
            <button class="btn-water" id="btn-water"><i data-lucide="help-circle" style="width:18px;height:18px"></i> ${t('btn_water_now')}</button>
            <div class="alert-pill" id="alert-water-low">
              <i data-lucide="alert-triangle" class="icon" style="width:20px;height:20px"></i>
              <div>
                <strong>${t('alert_water_low_title')}</strong>
                <span>Bể nước chỉ còn 12% - Vui lòng châm thêm.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weather -->
      <div class="weather-card">
        <div class="wc-hdr">
          <div>
            <h3>${t('current_weather')}</h3>
            <p id="wc-city">${t('dong_nai')}</p>
          </div>
          <span id="wc-icon-wrap"><i data-lucide="cloud-sun"></i></span>
        </div>
        <div class="wc-temp" id="wc-temp">32°<span>C</span></div>
        <div class="wc-details">
          <div class="wc-box"><span>${t('humidity')}</span><strong id="wc-humidity">65%</strong></div>
          <div class="wc-box"><span>${t('uv_index')}</span><strong id="wc-uv">${t('uv_extreme')}</strong></div>
        </div>
        <div class="wc-forecast" id="wc-forecast">
          <div class="wc-f-title">${t('forecast_3_days')}</div>
          <div class="wc-row"><span>${t('tomorrow')}</span><i data-lucide="sun" style="width:16px;height:16px"></i><span>34° / 26°</span></div>
          <div class="wc-row"><span>${t('wednesday')}</span><i data-lucide="cloud-rain" style="width:16px;height:16px"></i><span>33° / 25°</span></div>
        </div>
      </div>

      <!-- Chart Row: Tank+Tip on left, Health Chart on right -->
      <div class="chart-row col-2">

        <!-- Left sidebar: Tank + Tip stacked -->
        <div class="chart-sidebar">

          <!-- Water Drop Tank -->
          <div class="card tank-card">
            <h3>${t('water_tank_title')}</h3>
            <div class="drop-wrap">
              <svg viewBox="0 0 120 150" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <clipPath id="drop-clip">
                    <path d="M60,4 C60,4 6,54 6,82 C6,114 30,146 60,146 C90,146 114,114 114,82 C114,54 60,4 60,4 Z"/>
                  </clipPath>
                </defs>
                <foreignObject x="0" y="0" width="120" height="150" clip-path="url(#drop-clip)">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; position: relative;">
                    <div class="drop-fill" id="drop-fill" style="height:12%">
                      <div class="drop-wave wave1"></div>
                      <div class="drop-wave wave2"></div>
                    </div>
                  </div>
                </foreignObject>
                <path d="M60,4 C60,4 6,54 6,82 C6,114 30,146 60,146 C90,146 114,114 114,82 C114,54 60,4 60,4 Z" stroke="var(--dark-green)" stroke-width="3" fill="none"/>
              </svg>
              <div class="drop-label">
                <span class="drop-pct" id="drop-pct">12%</span>
                <span class="drop-sub" id="drop-sub">${t('water_tank_low')}</span>
              </div>
            </div>
            <div class="drop-info">
              <div class="tank-note"><strong>LƯU Ý</strong> Cần thêm 440 ml để đầy bể.</div>
              <div style="display:flex; gap:8px; width:100%; margin-top:8px;">
                <button class="btn-pump" style="flex:1;">${t('btn_pump_history')}</button>
                <button id="btn-refill-water" class="btn-refill" style="flex:1; padding: 6px 8px; border-radius: var(--radius-pill); background: #EAF5FC; border: 1.5px solid var(--light-blue); font-weight: 600; color: var(--dark-green); font-size: 13px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="plus-circle" style="width:14px; height:14px; color:var(--light-blue);"></i> ${t('btn_refill_water')}</button>
              </div>
            </div>
          </div>

          <!-- Device Control -->
          <div class="card control-card">
            <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">
              <i data-lucide="sliders" style="width:18px;height:18px;color:var(--primary-green)"></i> ${t('control_title')}
            </h3>
            <div class="toggle-list-item" style="padding: 10px 0; border:none;">
              <div><strong style="font-size:14px;">${t('led_light')}</strong><span style="font-size:11px;color:#8A968C">${t('led_manual')}</span></div>
              <label class="switch"><input type="checkbox" id="control-light-manual" /><span class="slider"></span></label>
            </div>
          </div>

          <!-- Tip -->
          <div class="card tip-card">
            <i data-lucide="lightbulb"></i>
            <div>
              <h3>${t('tips_title')}</h3>
              <p>${t('tips_content')}</p>
            </div>
          </div>

        </div>

        <!-- Health Chart -->
        <div class="card chart-main">
          <div class="chart-header">
            <h3>${t('chart_light_title')}</h3>
            <div class="tab-group" id="health-tabs">
              <button class="tab-btn active" data-chart="today">${t('tab_today')}</button>
              <button class="tab-btn" data-chart="week">${t('tab_week')}</button>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="healthChart"></canvas></div>
        </div>

      </div>

    </div>
  </div>

  <!-- ══ STATISTICS ══ -->
  <div id="page-statistics" class="inner-page">
    <div class="stats-grid">

      <!-- LEFT COL -->
      <div class="col-left" style="display:flex; flex-direction:column; gap:24px; height:100%;">
        <div class="card">
          <div class="chart-header" style="margin-bottom:0;">
            <div>
              <h3>${t('stats_light_hum_title')}</h3>
              <span style="font-size:12px;color:#8A968C">${t('stats_update_30m')}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:12px;font-weight:600">
              <span style="color:var(--yellow);display:flex;align-items:center;gap:4px"><i data-lucide="circle" style="fill:var(--yellow);width:10px;height:10px"></i> ${t('stats_light_legend')}</span>
              <span style="color:var(--primary-green);display:flex;align-items:center;gap:4px"><i data-lucide="circle" style="fill:var(--primary-green);width:10px;height:10px"></i> ${t('stats_hum_legend')}</span>
            </div>
          </div>
          <div class="chart-wrap" style="height:300px; margin-top: 24px;">
            <canvas id="statChart"></canvas>
          </div>
        </div>

        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="chart-header" style="margin-bottom:0;">
            <h3>${t('stats_water_consumption')}</h3>
            <div class="pill" style="padding:8px 16px;border:none;background:#EAF5FC"><i data-lucide="droplet" style="color:var(--light-blue);width:14px;height:14px;fill:var(--light-blue)"></i> <span style="color:var(--light-blue);font-weight:700" class="water-total-pill-text">${t('stats_total_week').replace('{val}', '12.5')}</span></div>
          </div>
          <div class="chart-wrap" style="flex: 1; min-height: 200px; margin-top:24px;">
            <canvas id="waterChart"></canvas>
          </div>
        </div>
      </div>

      <!-- RIGHT COL -->
      <div class="col-right" style="display:flex; flex-direction:column; gap:24px; height:100%;">
        <div class="monthly-card">
          <h3 id="monthly-title"><i data-lucide="award" style="color:var(--yellow);fill:var(--yellow)"></i> ${t('stats_monthly_summary')} <span id="monthly-month">--</span></h3>
          <div class="monthly-row"><span>${t('stats_avg_light')}</span><strong id="monthly-lux" style="color:var(--yellow)">-- lux</strong></div>
          <div class="monthly-row"><span>${t('stats_auto_waterings')}</span><strong id="monthly-pump" style="color:var(--light-blue)">-- ${t('stats_times')}</strong></div>
          <div class="monthly-row" style="border:none;padding:0;margin:0;"><span>${t('stats_water_saving')}</span><strong id="monthly-water" style="color:var(--primary-green)">--</strong></div>
        </div>

        <div class="log-card card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:18px;font-weight:700">${t('stats_activity_log')}</h3>
            <div class="log-filter-wrap" id="log-filter-wrap">
              <button class="log-filter-btn" id="log-filter-toggle" title="Lọc theo mục">
                <i data-lucide="sliders-horizontal"></i>
              </button>
              <div class="log-filter-dropdown hidden" id="log-filter-dropdown">
                <button class="log-filter-chip active" data-cat="all">${t('stats_filter_all')}</button>
                <button class="log-filter-chip" data-cat="den">${t('stats_filter_light')}</button>
                <button class="log-filter-chip" data-cat="bom">${t('stats_filter_pump')}</button>
                <button class="log-filter-chip" data-cat="lich">${t('stats_filter_schedule')}</button>
                <button class="log-filter-chip" data-cat="canh_bao">${t('stats_filter_alert')}</button>
              </div>
            </div>
          </div>
          <div id="activity-log-list" class="log-list-scroll">
            <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:13px">${t('stats_no_activity')}</p>
          </div>
        </div>

        <div class="card export-card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:8px">${t('stats_export_title')}</h3>
          <p style="font-size:13px;color:#8A968C;margin-bottom:16px">${t('stats_export_desc')}</p>
          <div class="export-btns">
            <button id="btn-export-pdf"><i data-lucide="file-text"></i> PDF</button>
            <button id="btn-export-excel"><i data-lucide="sheet"></i> Excel</button>
          </div>
        </div>
      </div>

    </div>

    <!-- TIMELINE -->
    <div style="margin-top:32px;">
      <h3 style="font-size:20px;font-weight:700;margin-bottom:32px;">${t('stats_milestones_title')}</h3>
      <div class="timeline">
        
        <div class="tl-card">
          <div class="tl-num yellow">1</div>
          <div class="tl-img-wrap" style="background:#F9EED9;">
            <img src="./ngangnho.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">${t('milestone_1_title')}</div>
          <div class="tl-date">01/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">2</div>
          <div class="tl-img-wrap">
            <img src="./doc.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">${t('milestone_2_title')}</div>
          <div class="tl-date">15/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">3</div>
          <div class="tl-img-wrap">
            <img src="./ngangnho.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">${t('milestone_3_title')}</div>
          <div class="tl-date">${t('milestone_3_desc')}</div>
        </div>

        <div class="tl-capture" style="opacity: 0.7; cursor: not-allowed;" onclick="alert('Tính năng chụp ảnh cập nhật sẽ được phát triển sau!');" title="Tính năng phát triển sau">
          <i data-lucide="camera" style="width:32px;height:32px;margin-bottom:8px; color: #8A968C;"></i>
          <span style="color: #8A968C;">${t('milestone_capture')}</span>
        </div>

      </div>
    </div>
  </div>

  <!-- ══ SCHEDULE ══ -->
  <div id="page-schedule" class="inner-page">
    <div class="schedule-grid">
      <!-- LEFT COLUMN -->
      <div class="schedule-col-left">
        <div class="card">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px">
            <i data-lucide="calendar" style="color:var(--primary-green); width:20px; height:20px;"></i> ${t('schedule_new_title')}
          </h3>
          <p style="font-size: 13px; color: #8A968C; margin-bottom: 20px;">${t('schedule_select_category')}</p>

          <!-- Hạng mục -->
          <div style="margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('schedule_maint_category')}</label>
            <select id="maint-category" style="width:100%; height: 42px; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green); cursor: pointer;">
              <option value="soil">${t('schedule_opt_soil')}</option>
              <option value="fertilizer">${t('schedule_opt_fertilizer')}</option>
              <option value="prune">${t('schedule_opt_prune')}</option>
              <option value="custom" style="color: var(--primary-green); font-weight: 600;">${t('schedule_opt_custom')}</option>
            </select>
          </div>

          <div id="maint-custom-wrap" style="display:none; margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--primary-green);">${t('schedule_custom_category')}</label>
            <input type="text" id="maint-custom-category" placeholder="${t('schedule_custom_placeholder')}" style="width:100%; height: 42px; border:1.5px solid var(--primary-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green);" />
          </div>

          <!-- Kiểu lịch -->
          <div style="margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 8px; color: var(--dark-green);">${t('schedule_recur_type')}</label>
            <div style="display:flex; gap:8px;">
              <button class="maint-recur-btn active" data-recur="once" id="maint-recur-once" style="flex:1; padding:8px 4px; border-radius:8px; border:1.5px solid var(--primary-green); background:var(--primary-green); color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                <i data-lucide="calendar-check" style="width:14px;height:14px;vertical-align:middle;"></i> ${t('schedule_recur_once')}
              </button>
              <button class="maint-recur-btn" data-recur="weekly" id="maint-recur-weekly" style="flex:1; padding:8px 4px; border-radius:8px; border:1.5px solid #ccc; background:#f5f5f5; color:var(--dark-green); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                <i data-lucide="repeat" style="width:14px;height:14px;vertical-align:middle;"></i> ${t('schedule_recur_weekly')}
              </button>
              <button class="maint-recur-btn" data-recur="monthly" id="maint-recur-monthly" style="flex:1; padding:8px 4px; border-radius:8px; border:1.5px solid #ccc; background:#f5f5f5; color:var(--dark-green); font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;">
                <i data-lucide="calendar-range" style="width:14px;height:14px;vertical-align:middle;"></i> ${t('schedule_recur_monthly')}
              </button>
            </div>
          </div>

          <!-- Panel: Một lần -->
          <div id="maint-panel-once" style="margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('schedule_once_label')}</label>
            <input type="datetime-local" id="maint-datetime" style="width:100%; height: 42px; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green);" />
          </div>

          <!-- Panel: Hàng tuần -->
          <div id="maint-panel-weekly" style="display:none; margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 8px; color: var(--dark-green);">${t('schedule_weekly_label')}</label>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
              <button class="maint-dow-btn" data-dow="1" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T2</button>
              <button class="maint-dow-btn" data-dow="2" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T3</button>
              <button class="maint-dow-btn" data-dow="3" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T4</button>
              <button class="maint-dow-btn" data-dow="4" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T5</button>
              <button class="maint-dow-btn" data-dow="5" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T6</button>
              <button class="maint-dow-btn" data-dow="6" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">T7</button>
              <button class="maint-dow-btn" data-dow="0" style="width:44px;height:38px;border-radius:8px;border:1.5px solid #ccc;background:#f5f5f5;color:var(--dark-green);font-size:12px;font-weight:600;cursor:pointer;">CN</button>
            </div>
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('schedule_weekly_time')}</label>
            <input type="time" id="maint-weekly-time" value="08:00" style="width:140px; height: 42px; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green);" />
          </div>

          <!-- Panel: Hàng tháng -->
          <div id="maint-panel-monthly" style="display:none; margin-bottom: 16px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 8px; color: var(--dark-green);">${t('schedule_monthly_label')}</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="number" id="maint-monthly-day" min="1" max="28" value="1" style="width:80px; height: 42px; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green); text-align:center;" />
              <span style="font-size:13px; color:#8A968C;">${t('schedule_monthly_time_sub')}</span>
              <input type="time" id="maint-monthly-time" value="08:00" style="width:140px; height: 42px; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box; background: var(--white); color: var(--dark-green);" />
            </div>
            <p style="font-size:11px; color:#8A968C; margin-top:6px; margin-bottom:0;">${t('schedule_monthly_tip')}</p>
          </div>

          <div style="margin-top:20px;">
            <button class="btn-login" id="btn-save-maint" style="width:100%; padding:14px; font-size:15px; font-weight:600; background:var(--dark-green); color:var(--white); border-radius:var(--radius-pill); cursor:pointer;">${t('schedule_btn_save')}</button>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="schedule-col-right">
        <div class="card" style="height:100%; display:flex; flex-direction:column;">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px">
            <i data-lucide="list-todo" style="color:var(--primary-green); width:20px; height:20px;"></i> ${t('schedule_list_title')}
          </h3>
          <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; max-height: 520px;" id="maint-scheduled-list">
            <!-- Sẽ được hiển thị động bằng JS -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ SETTINGS ══ -->
  <div id="page-settings" class="inner-page">
    <div class="settings-grid">

      <!-- LEFT COLUMN -->
      <div class="settings-col-left">
        <div class="card profile-card">
          <img src="./doc.jpg" alt="Linh Garden" />
          <h3 id="profile-display-name">Linh Garden</h3>
          <p id="profile-display-email">Đang tải email...</p>
          <p>${t('settings_profile_member_since')}</p>
          <button class="btn-outline dark" id="btn-edit-profile"><i data-lucide="user" style="width:18px;height:18px"></i> ${t('settings_profile_btn_edit')}</button>
          <button class="btn-outline" id="btn-logout"><i data-lucide="log-out" style="width:18px;height:18px"></i> ${t('settings_profile_btn_logout')}</button>
        </div>

        <div class="card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
            <i data-lucide="sliders" style="width:18px;height:18px;color:var(--primary-green)"></i> ${t('settings_app_customization')}
          </h3>
          <div class="toggle-list-item">
            <div><strong>${t('settings_dark_mode')}</strong><span>${t('settings_dark_mode_sub')}</span></div>
            <label class="switch"><input type="checkbox" id="dark-mode-toggle" /><span class="slider"></span></label>
          </div>
          <div class="toggle-list-item">
            <div><strong>${t('settings_email_alerts')}</strong><span>${t('settings_email_alerts_sub')}</span></div>
            <label class="switch"><input type="checkbox" id="email-notification-toggle" checked /><span class="slider"></span></label>
          </div>
          <div class="toggle-list-item">
            <div><strong>${t('settings_language')}</strong><span>${t('settings_language_sub')}</span></div>
            <select id="language-select" style="border: 1.5px solid var(--dark-green); border-radius: 8px; padding: 4px 8px; background: var(--white); color: var(--dark-green); font-weight: 600; font-family: inherit; font-size: 13px; cursor: pointer; outline: none;">
              <option value="vi" ${currentLang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
              <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="settings-col-right">
        
        <div class="card alert-card">
          <div class="alert-hdr">
            <div class="alert-icon-wrap"><i data-lucide="droplet"></i></div>
            <div>
              <h3>${t('settings_water_alert_title')}</h3>
              <p>${t('settings_water_alert_desc')}</p>
            </div>
          </div>
          <div class="alert-controls">
            <div class="slider-row" style="flex:1">
              <span>${t('settings_alert_threshold')}</span>
              <span class="val" id="water-alert-label">15%</span>
              <input type="range" id="water-alert-slider" min="5" max="50" value="15" />
            </div>
            <div class="alert-toggle-pill">
              <span style="display:flex;align-items:center;gap:8px"><i data-lucide="bell" style="width:16px;height:16px;color:var(--light-blue)"></i> ${t('settings_enable_alert')}</span>
              <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
            </div>
          </div>
        </div>

        <div class="card env-card">
          <h3><i data-lucide="droplet" style="width:20px;height:20px;color:var(--primary-green)"></i> ${t('settings_humidity_threshold')}</h3>
          <div style="margin-top: 20px;">
            <div class="slider-row" style="margin-bottom: 16px;">
              <span style="flex:1">${t('settings_min')}</span>
              <input type="range" min="0" max="100" value="40" id="hum-min" />
              <span class="val" id="hum-min-label" style="color:var(--dark-green)">40%</span>
            </div>
            <div class="slider-row" style="margin-bottom: 16px;">
              <span style="flex:1">${t('settings_max')}</span>
              <input type="range" min="0" max="100" value="80" id="hum-max" />
              <span class="val" id="hum-max-label" style="color:var(--dark-green)">80%</span>
            </div>
            <div class="toggle-row">
              <span>${t('settings_auto_water')}</span>
              <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
            </div>
          </div>
        </div>

        <div class="card env-card">
          <h3><i data-lucide="sun" style="width:20px;height:20px;color:var(--yellow)"></i> ${t('settings_light_settings')}</h3>
          <div style="margin-top: 20px;">
            <div class="slider-row">
              <span style="flex:1">${t('settings_lux_threshold')}</span>
              <input type="range" min="0" max="2000" value="200" id="lux-low" style="flex: 2;" />
              <div style="display:flex; align-items:center; gap:4px; margin-left: 8px;">
                <input type="number" id="lux-low-input" style="width: 70px; border: 1.5px solid var(--dark-green); border-radius: 8px; padding: 4px 8px; text-align: right; color: var(--dark-green); font-weight: 600; font-family: inherit; font-size: 13px;" min="0" max="2000" value="200" />
                <span style="font-size:13px; font-weight:600;">lx</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card emrg-card">
          <div class="emrg-hdr"><span>${t('settings_emergency_title')}</span> <i data-lucide="hand" style="width:18px;height:18px"></i></div>
          <p>${t('settings_emergency_desc')}</p>
          <button class="btn-emrg" id="btn-emergency">${t('settings_emergency_btn')}</button>
        </div>
      </div>

      </div>
    </div>
  </div>

  <!-- Bottom Nav (Mobile) -->
  <nav class="bottom-nav">
    <button class="nav-btn active" data-goto="dashboard">
      <div class="nav-icon"><i data-lucide="layout-dashboard"></i></div>
    </button>
    <button class="nav-btn" data-goto="statistics">
      <div class="nav-icon"><i data-lucide="bar-chart-2"></i></div>
    </button>
    <button class="nav-btn" data-goto="schedule">
      <div class="nav-icon"><i data-lucide="calendar"></i></div>
    </button>
    <button class="nav-btn" data-goto="settings">
      <div class="nav-icon"><i data-lucide="settings"></i></div>
    </button>
  </nav>
<div id="toast" class="toast hidden"><i data-lucide="droplet" style="width:18px;height:18px"></i> Đã gửi lệnh tưới nước!</div>
<div id="toast-container" class="toast-container"></div>

  <!-- Modal Lịch Sử Bơm -->
  <div id="modal-pump-history" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <h3><i data-lucide="droplet" style="color:var(--light-blue); fill:var(--light-blue); width:20px; height:20px;"></i> ${t('pump_history_modal_title')}</h3>
        <button class="btn-close-modal" id="btn-close-pump-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" id="pump-history-content">
        <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">${t('loading_data')}</p>
      </div>
    </div>
  </div>
  <!-- Modal Chỉnh sửa hồ sơ -->
  <div id="modal-edit-profile" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <h3><i data-lucide="user" style="color:var(--primary-green); width:20px; height:20px;"></i> ${t('modal_profile_title')}</h3>
        <button class="btn-close-modal" id="btn-close-profile-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('modal_profile_username')}</label>
          <input type="text" id="edit-profile-username" readonly style="width:100%; border:1.5px solid #ccc; background:#f5f5f5; padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('modal_profile_email')}</label>
          <input type="email" id="edit-profile-email" placeholder="example@gmail.com" style="width:100%; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display:block; font-size:13px; font-weight:600; margin-bottom: 6px; color: var(--dark-green);">${t('modal_profile_password_new')}</label>
          <input type="password" id="edit-profile-password" placeholder="Nhập mật khẩu mới" style="width:100%; border:1.5px solid var(--dark-green); padding:8px 12px; border-radius:8px; font-size:14px; outline:none; box-sizing: border-box;" />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:12px; align-items: center;">
          <button class="btn-modal-cancel" id="btn-cancel-profile">${t('modal_profile_btn_cancel')}</button>
          <button class="btn-modal-save" id="btn-save-profile">${t('modal_profile_btn_save')}</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Chi Tiết Nhật Ký -->
  <div id="modal-activity-detail" class="modal-overlay hidden">
    <div class="modal-card" style="max-width: 450px;">
      <div class="modal-header">
        <h3><i data-lucide="info" style="color:var(--primary-green); width:20px; height:20px;"></i> ${t('modal_activity_title')}</h3>
        <button class="btn-close-modal" id="btn-close-activity-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" id="activity-detail-content" style="padding: 20px;">
        <!-- Nội dung sẽ được điền động -->
      </div>
    </div>
  </div>`;
