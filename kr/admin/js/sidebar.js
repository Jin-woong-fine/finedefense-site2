window.loadSidebar = function (activeKey) {
  const sidebarContainer = document.getElementById("sidebar");
  if (!sidebarContainer) return;

  /* 🔥 role 안정 처리 */
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole : "viewer";

  const name = localStorage.getItem("name") || "사용자";
  const avatar = localStorage.getItem("avatar")
    ? `/uploads/avatars/${localStorage.getItem("avatar")}`
    : "/kr/admin/img/default-avatar.png";

  /* 메뉴 데이터 */
  const menuItems = [
    { key: "dashboard", label: "대시보드", link: "/kr/admin/dashboard.html", roles: ["superadmin", "admin", "editor", "viewer"] },
    { key: "users", label: "사용자 관리", link: "/kr/admin/users.html", roles: ["superadmin", "admin"] },
    { key: "products", label: "제품 관리", link: "/kr/admin/products-list.html", roles: ["superadmin", "admin", "editor"] },
    { key: "newsroom", label: "뉴스룸 관리", link: "/kr/admin/news-list.html", roles: ["superadmin", "admin", "editor"] },
    { key: "notice", label: "공지사항 관리", link: "/kr/admin/notice-list.html", roles: ["superadmin", "admin", "editor"] },
    { key: "gallery", label: "갤러리 관리", link: "/kr/admin/gallery-list.html", roles: ["superadmin", "admin", "editor"] },

    // ⭐ 인증/특허
    { key: "certifications", label: "인증/특허 관리", link: "/kr/admin/certification-list.html", roles: ["superadmin", "admin", "editor"] },

    // ⭐ 카탈로그 (추가됨)
    { key: "catalog", label: "카탈로그 관리", link: "/kr/admin/catalog-list.html", roles: ["superadmin", "admin", "editor"] },

    // ⭐ 1:1 문의 관리
    { key: "inquiry", label: "1:1 문의 관리", link: "/kr/admin/inquiry-list.html", roles: ["superadmin", "admin"] },

    { key: "downloads", label: "자료실 관리", link: "/kr/admin/downloads-list.html", roles: ["superadmin", "admin", "editor"] },

    { key: "loginlogs", label: "로그인 기록", link: "/kr/admin/login_logs.html", roles: ["superadmin", "admin"] },
  ];

  /* 메뉴 렌더링 */
  const menuHTML = menuItems
    .filter(item => item.roles.includes(role))
    .map(item => `
      <a href="${item.link}" class="menu-item ${activeKey === item.key ? "active" : ""}">
        ${item.label}
      </a>
    `).join("");

  sidebarContainer.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">FINE DEFENSE ADMIN</div>

      <div class="sidebar-profile">
        <img src="${avatar}" class="sidebar-avatar"/>
        <div>
          <div class="profile-name">${name}</div>
          <div class="profile-role">${role.toUpperCase()}</div>
        </div>
      </div>

      <nav class="sidebar-menu">
        ${menuHTML}
      </nav>
    </div>
  `;
};
