export const loginHTML = /* html */`
<div id="page-login">
  <div class="login-card">
    <div class="login-left">
      <div class="login-logo"><img src="./Vector.svg" class="icon-plant" alt="Plant"/></div>
      <h1>Vườn Sen Đá Của Tôi</h1>
      <p>Chăm sóc những mầm xanh của bạn bằng tình yêu và công nghệ.</p>
    </div>
    <div class="login-right">
      <h2>Chào Mừng Trở Lại!</h2>
      <p>Vườn sen đá đang đợi bạn đấy <img src="./Vector.svg" class="icon-plant" alt="Plant"/></p>
      <div class="form-group">
        <div class="input-wrap">
          <input id="login-email" type="text" placeholder="Tên đăng nhập" />
          <span class="input-icon"><i data-lucide="user"></i></span>
        </div>
      </div>
      <div class="form-group">
        <div class="input-wrap">
          <input id="login-pass" type="password" placeholder="Mật khẩu" />
          <span class="input-icon"><i data-lucide="lock"></i></span>
        </div>
      </div>
      <label class="remember-label">
        <input type="checkbox" id="remember" />
        <span class="check-box"></span>
        Ghi nhớ tôi
      </label>
      <button class="btn-login" id="btn-login">Đăng Nhập</button>
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
        <span class="hdr-title" id="hdr-title">Vườn Sen Đá Của Tôi</span>
        <span class="hdr-sub" id="hdr-sub">Chào buổi sáng, người làm vườn! <img src="./Vector.svg" class="icon-plant" alt="Plant"/></span>
      </div>
    </div>
    <div class="header-right">
      <nav class="desktop-menu">
        <button class="nav-btn-desktop active" data-goto="dashboard">Tổng quan</button>
        <button class="nav-btn-desktop" data-goto="statistics">Thống kê</button>
        <button class="nav-btn-desktop" data-goto="settings">Cài đặt</button>
      </nav>
      <div class="weather-badge" id="weather-badge">
        <span><i data-lucide="cloud-sun"></i></span><span class="weather-temp">32°C</span>
        <span class="sep">|</span><span>Đồng Nai, VN</span>
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
                <div class="pill-text">ÁNH SÁNG</div>
                <div class="pill-val" id="val-light">12,500 Lux</div>
              </div>
            </div>
            <div class="pill">
              <div class="pill-icon blue"><i data-lucide="droplet" style="width:18px;height:18px"></i></div>
              <div>
                <div class="pill-text">ĐỘ ẨM ĐẤT</div>
                <div class="pill-val" id="val-hum">42%</div>
              </div>
            </div>
          </div>
          <div class="hero-bottom">
            <div class="alert-pill" id="alert-water-low">
              <i data-lucide="alert-triangle" class="icon" style="width:20px;height:20px"></i>
              <div>
                <strong>Cảnh báo: Mực nước thấp!</strong>
                <span>Bể nước chỉ còn 12% - Vui lòng châm thêm.</span>
              </div>
            </div>
            <button class="btn-water" id="btn-water"><i data-lucide="help-circle" style="width:18px;height:18px"></i> Tưới Ngay</button>
          </div>
        </div>
      </div>

      <!-- Weather -->
      <div class="weather-card">
        <div class="wc-hdr">
          <div>
            <h3>Thời Tiết Hiện Tại</h3>
            <p>Tỉnh Đồng Nai</p>
          </div>
          <i data-lucide="cloud-sun"></i>
        </div>
        <div class="wc-temp">32°<span>C</span></div>
        <div class="wc-details">
          <div class="wc-box"><span>ĐỘ ẨM</span><strong>65%</strong></div>
          <div class="wc-box"><span>UV INDEX</span><strong>Cực cao</strong></div>
        </div>
        <div class="wc-forecast">
          <div class="wc-f-title">Dự báo 3 ngày tới</div>
          <div class="wc-row"><span>Ngày mai</span><i data-lucide="sun" style="width:16px;height:16px"></i><span>34° / 26°</span></div>
          <div class="wc-row"><span>Thứ 4</span><i data-lucide="cloud-rain" style="width:16px;height:16px"></i><span>33° / 25°</span></div>
        </div>
      </div>

      <!-- Chart Row: Tank+Tip on left, Health Chart on right -->
      <div class="chart-row col-2">

        <!-- Left sidebar: Tank + Tip stacked -->
        <div class="chart-sidebar">

          <!-- Water Drop Tank -->
          <div class="card tank-card">
            <h3>Mực Nước Bể</h3>
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
                <span class="drop-sub" id="drop-sub">Thấp</span>
              </div>
            </div>
            <div class="drop-info">
              <div class="tank-note"><strong>LƯU Ý</strong> Cần thêm 440 ml để đầy bể.</div>
              <div style="display:flex; gap:8px; width:100%; margin-top:8px;">
                <button class="btn-pump" style="flex:1;">Lịch sử bơm</button>
                <button id="btn-refill-water" class="btn-refill" style="flex:1; padding: 6px 8px; border-radius: var(--radius-pill); background: #EAF5FC; border: 1.5px solid var(--light-blue); font-weight: 600; color: var(--dark-green); font-size: 13px; display:flex; align-items:center; justify-content:center; gap:4px;"><i data-lucide="plus-circle" style="width:14px; height:14px; color:var(--light-blue);"></i> Thêm nước</button>
              </div>
            </div>
          </div>

          <!-- Device Control -->
          <div class="card control-card">
            <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">
              <i data-lucide="sliders" style="width:18px;height:18px;color:var(--primary-green)"></i> Điều Khiển
            </h3>
            <div class="toggle-list-item" style="padding: 10px 0; border:none;">
              <div><strong style="font-size:14px;">Đèn LED</strong><span style="font-size:11px;color:#8A968C">Bật thủ công</span></div>
              <label class="switch"><input type="checkbox" id="control-light-manual" /><span class="slider"></span></label>
            </div>
          </div>

          <!-- Tip -->
          <div class="card tip-card">
            <i data-lucide="lightbulb"></i>
            <div>
              <h3>Mẹo chăm sóc</h3>
              <p>Trời đang nắng gắt, hãy kéo lưới che lán để tránh cây bị cháy lá nhé! Sen đá cần ánh sáng nhưng không phải nắng trực tiếp buổi trưa.</p>
            </div>
          </div>

        </div>

        <!-- Health Chart -->
        <div class="card chart-main">
          <div class="chart-header">
            <h3>Biểu Đồ Cường Độ Ánh Sáng</h3>
            <div class="tab-group" id="health-tabs">
              <button class="tab-btn active" data-chart="today">Hôm nay</button>
              <button class="tab-btn" data-chart="week">Tuần này</button>
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
      <div class="col-left" style="display:flex; flex-direction:column; gap:24px;">
        <div class="card">
          <div class="chart-header" style="margin-bottom:0;">
            <div>
              <h3>Cường Độ Ánh Sáng & Độ Ẩm</h3>
              <span style="font-size:12px;color:#8A968C">Dữ liệu được cập nhật mỗi 30 phút</span>
            </div>
            <div style="display:flex;gap:16px;font-size:12px;font-weight:600">
              <span style="color:var(--yellow);display:flex;align-items:center;gap:4px"><i data-lucide="circle" style="fill:var(--yellow);width:10px;height:10px"></i> Ánh sáng (Lux)</span>
              <span style="color:var(--primary-green);display:flex;align-items:center;gap:4px"><i data-lucide="circle" style="fill:var(--primary-green);width:10px;height:10px"></i> Độ ẩm (%)</span>
            </div>
          </div>
          <div class="chart-wrap" style="height:300px; margin-top: 24px;">
            <canvas id="statChart"></canvas>
          </div>
        </div>

        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="chart-header" style="margin-bottom:0;">
            <h3>Lượng Nước Tiêu Thụ</h3>
            <div class="pill" style="padding:8px 16px;border:none;background:#EAF5FC"><i data-lucide="droplet" style="color:var(--light-blue);width:14px;height:14px;fill:var(--light-blue)"></i> <span style="color:var(--light-blue);font-weight:700">Tổng: 12.5 Lít/Tuần</span></div>
          </div>
          <div class="chart-wrap" style="flex: 1; min-height: 200px; margin-top:24px;">
            <canvas id="waterChart"></canvas>
          </div>
        </div>
      </div>

      <!-- RIGHT COL -->
      <div class="col-right" style="display:flex; flex-direction:column; gap:24px;">
        <div class="monthly-card">
          <h3><i data-lucide="award" style="color:var(--yellow);fill:var(--yellow)"></i> Tổng Kết Tháng 6</h3>
          <div class="monthly-row"><span>Cường độ ánh sáng TB</span><strong style="color:var(--yellow)">-- lux</strong></div>
          <div class="monthly-row"><span>Số lần tưới tự động</span><strong style="color:var(--light-blue)">-- lần</strong></div>
          <div class="monthly-row"><span>Tiết kiệm nước</span><strong style="color:var(--primary-green)">--%</strong></div>
        </div>

        <div class="log-card card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:18px;font-weight:700">Nhật Ký Hoạt Động</h3>
            <div class="log-filter-wrap" id="log-filter-wrap">
              <button class="log-filter-btn" id="log-filter-toggle" title="Lọc theo mục">
                <i data-lucide="sliders-horizontal"></i>
              </button>
              <div class="log-filter-dropdown hidden" id="log-filter-dropdown">
                <button class="log-filter-chip active" data-cat="all">Tất cả</button>
                <button class="log-filter-chip" data-cat="den">Đèn LED</button>
                <button class="log-filter-chip" data-cat="bom">Máy bơm</button>
                <button class="log-filter-chip" data-cat="canh_bao">Cảnh báo</button>
              </div>
            </div>
          </div>
<<<<<<< HEAD
          <div id="activity-log-list" class="activity-log-scroll">
            <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Chưa có hoạt động nào.</p>
=======
          <div class="log-columns">
            <div class="log-col-box">
              <div class="log-col-header"><i data-lucide="sun" class="log-cat-icon yellow" style="color:var(--yellow)"></i> Đèn LED</div>
              <div id="activity-log-list-den" class="log-list-scroll">
                <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:13px">Chưa có hoạt động nào.</p>
              </div>
            </div>
            <div class="log-col-box">
              <div class="log-col-header"><i data-lucide="droplet" class="log-cat-icon blue" style="color:var(--light-blue)"></i> Máy bơm</div>
              <div id="activity-log-list-bom" class="log-list-scroll">
                <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:13px">Chưa có hoạt động nào.</p>
              </div>
            </div>
>>>>>>> f30acb0cc7dde880c8f56f8287db25245542ced9
          </div>
        </div>

        <div class="card export-card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:8px">Xuất Dữ Liệu</h3>
          <p style="font-size:13px;color:#8A968C;margin-bottom:16px">Tải báo cáo sức khỏe vườn dưới dạng PDF hoặc Excel.</p>
          <div class="export-btns">
            <button><i data-lucide="file-text"></i> PDF</button>
            <button><i data-lucide="sheet"></i> Excel</button>
          </div>
        </div>
      </div>

    </div>

    <!-- TIMELINE -->
    <div style="margin-top:32px;">
      <h3 style="font-size:20px;font-weight:700;margin-bottom:32px;">Cột Mốc Phát Triển</h3>
      <div class="timeline">
        
        <div class="tl-card">
          <div class="tl-num yellow">1</div>
          <div class="tl-img-wrap" style="background:#F9EED9;">
            <img src="./ngangnho.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">Nảy mầm</div>
          <div class="tl-date">01/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">2</div>
          <div class="tl-img-wrap">
            <img src="./doc.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">Ra lá thật</div>
          <div class="tl-date">15/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">3</div>
          <div class="tl-img-wrap">
            <img src="./ngangnho.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">Trưởng thành</div>
          <div class="tl-date">Dự kiến: 11/2023</div>
        </div>

        <div class="tl-capture">
          <i data-lucide="camera" style="width:32px;height:32px;margin-bottom:8px"></i>
          Chụp ảnh cập nhật
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
          <h3>Linh Garden</h3>
          <p>Thành viên từ: 05/2023</p>
          <button class="btn-outline dark"><i data-lucide="user" style="width:18px;height:18px"></i> Chỉnh sửa hồ sơ</button>
          <button class="btn-outline" id="btn-logout"><i data-lucide="log-out" style="width:18px;height:18px"></i> Đăng xuất</button>
        </div>

        <div class="card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
            <i data-lucide="sliders" style="width:18px;height:18px;color:var(--primary-green)"></i> Tùy Chỉnh Ứng Dụng
          </h3>
          <div class="toggle-list-item">
            <div><strong>Chế độ tối</strong><span>Tiết kiệm pin cho điện thoại</span></div>
            <label class="switch"><input type="checkbox" id="dark-mode-toggle" /><span class="slider"></span></label>
          </div>
          <div class="toggle-list-item">
            <div><strong>Thông báo đẩy</strong><span>Nhận cảnh báo tức thì</span></div>
            <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
          </div>
          <div class="toggle-list-item">
            <div><strong>Ngôn ngữ</strong><span>Tiếng Việt (Mặc định)</span></div>
            <i data-lucide="chevron-right" style="color:#8A968C"></i>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="settings-col-right">
        
        <div class="card alert-card">
          <div class="alert-hdr">
            <div class="alert-icon-wrap"><i data-lucide="droplet"></i></div>
            <div>
              <h3>Cảnh Báo Mực Nước Thấp</h3>
              <p>Hệ thống sẽ gửi thông báo và tin nhắn SMS khi nước trong bể còn dưới mức quy định.</p>
            </div>
          </div>
          <div class="alert-controls">
            <div class="slider-row" style="flex:1">
              <span>Ngưỡng báo động</span>
              <span class="val" id="water-alert-label">15%</span>
              <input type="range" id="water-alert-slider" min="5" max="50" value="15" />
            </div>
            <div class="alert-toggle-pill">
              <span style="display:flex;align-items:center;gap:8px"><i data-lucide="bell" style="width:16px;height:16px;color:var(--light-blue)"></i> Bật cảnh báo</span>
              <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
            </div>
          </div>
        </div>

        <div class="card env-card">
          <h3><i data-lucide="droplet" style="width:20px;height:20px;color:var(--primary-green)"></i> Ngưỡng Độ Ẩm Đất</h3>
          <div style="margin-top: 20px;">
            <div class="slider-row" style="margin-bottom: 16px;">
              <span style="flex:1">Tối thiểu</span>
              <input type="range" min="0" max="100" value="40" id="hum-min" />
              <span class="val" id="hum-min-label" style="color:var(--dark-green)">40%</span>
            </div>
            <div class="slider-row" style="margin-bottom: 16px;">
              <span style="flex:1">Tối đa</span>
              <input type="range" min="0" max="100" value="80" id="hum-max" />
              <span class="val" id="hum-max-label" style="color:var(--dark-green)">80%</span>
            </div>
            <div class="toggle-row">
              <span>Tự động tưới</span>
              <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
            </div>
          </div>
        </div>

        <div class="card env-card">
          <h3><i data-lucide="sun" style="width:20px;height:20px;color:var(--yellow)"></i> Cài Đặt Ánh Sáng</h3>
          <div style="margin-top: 20px;">
            <div class="slider-row">
              <span style="flex:1">Ngưỡng bật đèn</span>
              <input type="range" min="0" max="2000" value="200" id="lux-low" style="flex: 2;" />
              <div style="display:flex; align-items:center; gap:4px; margin-left: 8px;">
                <input type="number" id="lux-low-input" style="width: 70px; border: 1.5px solid var(--dark-green); border-radius: 8px; padding: 4px 8px; text-align: right; color: var(--dark-green); font-weight: 600; font-family: inherit; font-size: 13px;" min="0" max="2000" value="200" />
                <span style="font-size:13px; font-weight:600;">lx</span>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-row-half">
          <div class="card maint-card">
            <div class="maint-hdr"><span>Lịch bảo trì</span> <i data-lucide="calendar" style="width:18px;height:18px;color:var(--primary-green)"></i></div>
            <p>Tự động nhắc nhở thay đất, bón phân định kỳ.</p>
            <button class="btn-maint">Thiết lập lịch</button>
          </div>

          <div class="card emrg-card">
            <div class="emrg-hdr"><span>Dừng khẩn cấp</span> <i data-lucide="hand" style="width:18px;height:18px"></i></div>
            <p>Ngắt toàn bộ hệ thống điện & nước ngay lập tức.</p>
            <button class="btn-emrg" id="btn-emergency">DỪNG NGAY</button>
          </div>
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
        <h3><i data-lucide="droplet" style="color:var(--light-blue); fill:var(--light-blue); width:20px; height:20px;"></i> Lịch Sử Máy Bơm</h3>
        <button class="btn-close-modal" id="btn-close-pump-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body" id="pump-history-content">
        <p style="color:#8A968C;text-align:center;padding:20px 0;font-size:14px">Đang tải dữ liệu...</p>
      </div>
    </div>
  </div>
`;
