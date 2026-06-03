export const loginHTML = /* html */`
<div id="page-login">
  <div class="login-card">
    <div class="login-left">
      <div class="login-logo"><img src="/Vector.svg" class="icon-plant" alt="Plant"/></div>
      <h1>Vườn Sen Đá Của Tôi</h1>
      <p>Chăm sóc những mầm xanh của bạn bằng tình yêu và công nghệ.</p>
    </div>
    <div class="login-right">
      <h2>Chào Mừng Trở Lại!</h2>
      <p>Vườn sen đá đang đợi bạn đấy <img src="/Vector.svg" class="icon-plant" alt="Plant"/></p>
      <div class="form-group">
        <label for="login-email">Email hoặc Tên đăng nhập</label>
        <div class="input-wrap">
          <input id="login-email" type="text" placeholder="vidu@gmail.com" />
          <span class="input-icon"><i data-lucide="user"></i></span>
        </div>
      </div>
      <div class="form-group">
        <label for="login-pass">Mật khẩu</label>
        <div class="input-wrap">
          <input id="login-pass" type="password" placeholder="••••••••" />
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
      <div class="header-logo"><img src="/Vector.svg" class="icon-plant" alt="Plant"/></div>
      <div class="hdr-title-wrap">
        <span class="hdr-title" id="hdr-title">Vườn Sen Đá Của Tôi</span>
        <span class="hdr-sub" id="hdr-sub">Chào buổi sáng, người làm vườn! <img src="/Vector.svg" class="icon-plant" alt="Plant"/></span>
      </div>
    </div>
    <div class="header-right">
      <nav class="desktop-menu">
        <button class="nav-btn-desktop active" data-goto="dashboard">Tổng quan</button>
        <button class="nav-btn-desktop" data-goto="statistics">Thống kê</button>
        <button class="nav-btn-desktop" data-goto="settings">Cài đặt</button>
      </nav>
      <div class="weather-badge" id="weather-badge">
        <span><i data-lucide="cloud-sun"></i></span><span class="weather-temp">28°C</span>
        <span class="sep">|</span><span>Đà Lạt, VN</span>
      </div>
      <div class="tab-group hidden" id="stats-tabs">
        <button class="tab-btn active" data-tab="daily">Hàng Ngày</button>
        <button class="tab-btn" data-tab="weekly">Hàng Tuần</button>
        <button class="tab-btn" data-tab="monthly">Hàng Tháng</button>
      </div>
      <div class="avatar-wrap" id="avatar-goto-settings">
        <img src="/doc.jpg" alt="Avatar" class="avatar" />
        <span class="notif-badge">2</span>
      </div>
    </div>
  </header>

  <!-- ══ DASHBOARD ══ -->
  <div id="page-dashboard" class="inner-page active">
    <div class="dashboard-grid">

      <!-- Hero -->
      <div class="hero-card">
        <img src="/ngang.jpg" alt="Vườn sen đá" class="hero-img" />
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
            <div class="alert-pill">
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
            <p>Thành phố Đà Lạt</p>
          </div>
          <i data-lucide="cloud-sun"></i>
        </div>
        <div class="wc-temp">24°<span>C</span></div>
        <div class="wc-details">
          <div class="wc-box"><span>ĐỘ ẨM</span><strong>65%</strong></div>
          <div class="wc-box"><span>UV INDEX</span><strong>Cực cao</strong></div>
        </div>
        <div class="wc-forecast">
          <div class="wc-f-title">Dự báo 3 ngày tới</div>
          <div class="wc-row"><span>Ngày mai</span><i data-lucide="sun" style="width:16px;height:16px"></i><span>26° / 18°</span></div>
          <div class="wc-row"><span>Thứ 4</span><i data-lucide="cloud-rain" style="width:16px;height:16px"></i><span>22° / 17°</span></div>
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
              <div class="tank-note"><strong>LƯU Ý</strong> Cần thêm 45 Lít để đầy bể.</div>
              <button class="btn-pump">Lịch sử bơm</button>
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
            <h3>Biểu Đồ Sức Khỏe</h3>
            <div class="tab-group">
              <button class="tab-btn active" data-chart="today">Hôm nay</button>
              <button class="tab-btn" data-chart="week">Tuần này</button>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="healthChart"></canvas></div>
        </div>

      </div>

      <!-- Plants -->
      <div class="col-2 plant-list">
        <div class="plant-chip">
          <img src="/ngangnho.jpg" alt="Plant" />
          <div>
            <strong>Sen Đá Phật Bà</strong>
            <span>Sức khỏe: Rất tốt</span>
          </div>
        </div>
        <div class="plant-chip">
          <img src="/doc.jpg" alt="Plant" />
          <div>
            <strong>Sen Đá Thạch Ngọc</strong>
            <span>Sức khỏe: Bình thường</span>
          </div>
        </div>
        <div class="plant-chip add" id="plant-add">
          <div class="add-circle"><i data-lucide="plus"></i></div>
          <div>
            <strong>Thêm Cây Mới</strong>
            <span>Cập nhật vườn của bạn</span>
          </div>
        </div>
        <button class="btn-sys-settings" id="btn-sys-settings"><i data-lucide="settings"></i> Cài Đặt Hệ Thống</button>
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
            <svg viewBox="0 0 600 300" style="width:100%;height:100%">
              <!-- Grid lines -->
              <path d="M40 250 L560 250 M40 210 L560 210 M40 170 L560 170 M40 130 L560 130 M40 90 L560 90 M40 50 L560 50" stroke="#F0F2E9" stroke-width="1.5" fill="none"/>
              <!-- Y axis left -->
              <text x="30" y="254" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">0</text>
              <text x="30" y="214" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">2k</text>
              <text x="30" y="174" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">4k</text>
              <text x="30" y="134" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">6k</text>
              <text x="30" y="94" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">8k</text>
              <text x="30" y="54" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">10k</text>
              <!-- Y axis right -->
              <text x="570" y="254" font-size="11" fill="#A0ADA2" font-weight="500">0</text>
              <text x="570" y="214" font-size="11" fill="#A0ADA2" font-weight="500">20</text>
              <text x="570" y="174" font-size="11" fill="#A0ADA2" font-weight="500">40</text>
              <text x="570" y="134" font-size="11" fill="#A0ADA2" font-weight="500">60</text>
              <text x="570" y="94" font-size="11" fill="#A0ADA2" font-weight="500">80</text>
              <text x="570" y="54" font-size="11" fill="#A0ADA2" font-weight="500">100</text>
              <!-- X axis -->
              <text x="50" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">00:00</text>
              <text x="130" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">04:00</text>
              <text x="210" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">08:00</text>
              <text x="290" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">12:00</text>
              <text x="370" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">16:00</text>
              <text x="450" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">20:00</text>
              <text x="530" y="270" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">23:59</text>
              <!-- Yellow Curve -->
              <path d="M50 250 C100 250 150 220 210 100 C250 20 330 20 370 100 C430 220 480 250 530 250" stroke="#FFD166" stroke-width="4.5" fill="none" stroke-linecap="round"/>
              <!-- Green Line -->
              <path d="M50 160 L130 165 L210 175 L290 195 L370 205 L450 185 L530 170" stroke="#88AB75" stroke-width="3.5" fill="none" stroke-linejoin="round"/>
              <!-- Dots -->
              <circle cx="50" cy="160" r="5" fill="#88AB75"/>
              <circle cx="130" cy="165" r="5" fill="#88AB75"/>
              <circle cx="210" cy="175" r="5" fill="#88AB75"/>
              <circle cx="290" cy="195" r="5" fill="#88AB75"/>
              <circle cx="370" cy="205" r="5" fill="#88AB75"/>
              <circle cx="450" cy="185" r="5" fill="#88AB75"/>
              <circle cx="530" cy="170" r="5" fill="#88AB75"/>
            </svg>
          </div>
        </div>

        <div class="card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="chart-header" style="margin-bottom:0;">
            <h3>Lượng Nước Tiêu Thụ</h3>
            <div class="pill" style="padding:8px 16px;border:none;background:#EAF5FC"><i data-lucide="droplet" style="color:var(--light-blue);width:14px;height:14px;fill:var(--light-blue)"></i> <span style="color:var(--light-blue);font-weight:700">Tổng: 12.5 Lít/Tuần</span></div>
          </div>
          <div class="chart-wrap" style="flex: 1; min-height: 200px; margin-top:24px;">
            <svg viewBox="0 0 600 200" style="width:100%;height:100%" preserveAspectRatio="none">
              <!-- Grid -->
              <path d="M40 170 L560 170 M40 120 L560 120 M40 70 L560 70 M40 20 L560 20" stroke="#F0F2E9" stroke-width="1.5" fill="none"/>
              <text x="30" y="174" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">0</text>
              <text x="30" y="124" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">1</text>
              <text x="30" y="74" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">2</text>
              <text x="30" y="24" font-size="11" fill="#A0ADA2" font-weight="500" text-anchor="end">3</text>
              <!-- Bars -->
              <g fill="#8CE0F5" stroke="#4A5B4C" stroke-width="2.5">
                <rect x="65" y="120" width="35" height="50"/>
                <rect x="135" y="90" width="35" height="80"/>
                <rect x="205" y="150" width="35" height="20"/>
                <rect x="275" y="70" width="35" height="100"/>
                <rect x="345" y="110" width="35" height="60"/>
                <rect x="415" y="30" width="35" height="140"/>
                <rect x="485" y="60" width="35" height="110"/>
              </g>
              <!-- X axis -->
              <text x="82.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 2</text>
              <text x="152.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 3</text>
              <text x="222.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 4</text>
              <text x="292.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 5</text>
              <text x="362.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 6</text>
              <text x="432.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Thứ 7</text>
              <text x="502.5" y="190" font-size="11" fill="#4A5B4C" font-weight="700" text-anchor="middle">Chủ Nhật</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- RIGHT COL -->
      <div class="col-right" style="display:flex; flex-direction:column; gap:24px;">
        <div class="monthly-card">
          <h3><i data-lucide="award" style="color:var(--yellow);fill:var(--yellow)"></i> Tổng Kết Tháng 10</h3>
          <div class="monthly-row"><span>Sức khỏe trung bình</span><strong style="color:var(--yellow)">94%</strong></div>
          <div class="monthly-row"><span>Số lần tưới tự động</span><strong style="color:var(--light-blue)">18 lần</strong></div>
          <div class="monthly-row"><span>Tiết kiệm nước</span><strong style="color:var(--primary-green)">+12%</strong></div>
        </div>

        <div class="log-card card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 style="font-size:18px;font-weight:700">Nhật Ký Hoạt Động</h3>
            <i data-lucide="list" style="color:#A0ADA2"></i>
          </div>
          
          <div class="log-item">
            <div class="log-icon blue"><i data-lucide="droplet" style="fill:var(--light-blue)"></i></div>
            <div class="log-info">
              <strong>Đã tưới nước</strong>
              <span>Hệ thống đã tưới 200ml cho khu vực Sen Đá.</span>
            </div>
            <span class="log-time">10:30 AM</span>
          </div>
          
          <div class="log-item">
            <div class="log-icon yellow"><i data-lucide="sun" style="fill:var(--yellow)"></i></div>
            <div class="log-info">
              <strong>Ánh sáng cực đại</strong>
              <span>Cường độ sáng vượt 15,000 Lux. Đã kéo lưới che.</span>
            </div>
            <span class="log-time">12:15 PM</span>
          </div>
          
          <div class="log-item">
            <div class="log-icon red"><i data-lucide="alert-triangle" style="fill:var(--red-alert)"></i></div>
            <div class="log-info">
              <strong>Cảnh báo nước</strong>
              <span>Mực nước bể chứa xuống dưới 15%.</span>
            </div>
            <span class="log-time">Hôm qua</span>
          </div>
          
          <div class="log-item">
            <div class="log-icon green"><img src="/Vector.svg" class="icon-plant" alt="Plant"/></div>
            <div class="log-info">
              <strong>Thêm cây mới</strong>
              <span>Sen Đá Phật Bà đã được thêm vào hệ thống.</span>
            </div>
            <span class="log-time">3 ngày trước</span>
          </div>
          
          <button class="btn-view-log">Xem Tất Cả Nhật Ký</button>
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
            <img src="/ngangnho.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">Nảy mầm</div>
          <div class="tl-date">01/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">2</div>
          <div class="tl-img-wrap">
            <img src="/doc.jpg" alt="Plant"/>
          </div>
          <div class="tl-title">Ra lá thật</div>
          <div class="tl-date">15/10/2023</div>
        </div>

        <div class="tl-card">
          <div class="tl-num">3</div>
          <div class="tl-img-wrap">
            <img src="/ngangnho.jpg" alt="Plant"/>
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
          <img src="/doc.jpg" alt="Linh Garden" />
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
          <h3><i data-lucide="sliders" style="width:20px;height:20px;color:var(--primary-green)"></i> Ngưỡng Môi Trường Lý Tưởng</h3>
          <div class="env-grid">
            <div class="env-box">
              <h4><div class="icon green"><i data-lucide="droplet" style="width:16px;height:16px"></i></div> Độ ẩm đất (%)</h4>
              <div class="slider-row">
                <span style="flex:1">Tối thiểu</span>
                <input type="range" min="0" max="100" value="40" id="hum-min" />
                <span class="val" id="hum-min-label" style="color:var(--dark-green)">40%</span>
              </div>
              <div class="slider-row">
                <span style="flex:1">Tối đa</span>
                <input type="range" min="0" max="100" value="80" id="hum-max" />
                <span class="val" id="hum-max-label" style="color:var(--dark-green)">80%</span>
              </div>
              <div class="toggle-row">
                <span>Tự động tưới</span>
                <label class="switch"><input type="checkbox" checked /><span class="slider"></span></label>
              </div>
            </div>
            <div class="env-box">
              <h4><div class="icon yellow"><i data-lucide="sun" style="width:16px;height:16px"></i></div> Ánh sáng (Lux)</h4>
              <div class="slider-row">
                <span style="flex:1">Ngưỡng che nắng</span>
                <input type="range" min="0" max="20000" value="12000" id="lux-shade" />
                <span class="val" id="lux-shade-label" style="color:var(--dark-green)">12,000 lx</span>
              </div>
              <div class="slider-row">
                <span style="flex:1">Cảnh báo thiếu sáng</span>
                <input type="range" min="0" max="20000" value="2000" id="lux-low" />
                <span class="val" id="lux-low-label" style="color:var(--dark-green)">2,000 lx</span>
              </div>
              <div class="toggle-row">
                <span>Tự động kéo rèm</span>
                <label class="switch"><input type="checkbox" /><span class="slider"></span></label>
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
`;
