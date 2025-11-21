// /kr/admin/js/sidebar.js

function loadSidebar(active) {
  const userName = localStorage.getItem("name") || "사용자";
  const userRole = localStorage.getItem("role") || "-";
  const avatar = localStorage.getItem("avatar") 
    ? `/uploads/avatars/${localStorage.getItem("avatar")}`
    : "/kr/admin/img/default-avatar.png";

  const isSuperadmin = userRole === "superadmin";
  const isAdmin = userRole === "admin";
  const isEditor = userRole === "editor";
  const isViewer = userRole === "viewer";

  document.getElementById("sidebar").innerHTML = `
    <div class="sidebar">

      <div class="sidebar-header">
        <div class="logo">Fine Defense Admin</div>

        <div class="user-block">
          <img src="${avatar}" class="avatar">
          <div class="user-info">
            <div class="name">${userName}</div>
            <div class="role">${userRole}</div>
          </div>
        </div>
      </div>

      <div class="sidebar-menu">
        <a class="menu-item ${active === "dashboard" ? "active" : ""}" 
           href="/kr/admin/dashboard.html">
           📊 대시보드
        </a>

        ${
          // 사용자 관리: superadmin + admin만
          (isSuperadmin || isAdmin)
            ? `
              <div class="menu-title">사용자 관리</div>
              <a class="menu-item ${active === "users" ? "active" : ""}"
                href="/kr/admin/users.html">
                🧑‍🤝‍🧑 전체 사용자
              </a>
              <a class="menu-item ${active === "profile" ? "active" : ""}"
                href="/kr/admin/user_profile.html">
                🙋 내 프로필
              </a>
            `
            : `
              <div class="menu-title">사용자 관리</div>
              <a class="menu-item ${active === "profile" ? "active" : ""}"
                href="/kr/admin/user_profile.html">
                🙋 내 프로필
              </a>
            `
        }

        <div class="menu-title">콘텐츠 관리</div>

        ${
          // editor/admin/superadmin만 제품/뉴스룸 활성화, viewer는 비활성화
          isViewer
            ? `
                <div style="padding:8px 15px; color:#888;">
                  (권한 없음)
                </div>
              `
            : `
                <a class="menu-item ${active === "products" ? "active" : ""}"
                  href="/kr/admin/products.html">
                  📦 제품 관리
                </a>
                <a class="menu-item ${active === "posts" ? "active" : ""}"
                  href="/kr/admin/posts.html">
                  📰 뉴스룸 관리
                </a>
              `
        }

        <div class="menu-title">시스템</div>
        <a class="menu-item" onclick="logout()">🚪 로그아웃</a>
      </div>
    </div>
  `;
}
