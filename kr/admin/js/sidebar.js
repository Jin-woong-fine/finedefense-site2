window.loadSidebar = function(activeKey) {

  const sidebarContainer = document.getElementById("sidebar");
  if (!sidebarContainer) return;

  /* 🔥 role 안정 처리 */
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole : "viewer";

  const name = localStorage.getItem("name") || "사용자";
  const avatar = localStorage.getItem("avatar")
    ? `/uploads/avatars/${localStorage.getItem("avatar")}`
    : "/kr/admin/img/default-avatar.png";

  /* 메뉴 구성이 undefined 방지 */
  const menuItems = [
    { key: "dashboard", label: "대시보드", link: "/kr/admin/dashboard.html", roles: ["superadmin","admin","editor","viewer"] },
    { key: "users", label: "사용자 관리", link: "/kr/admin/users.html", roles: ["superadmin","admin"] },
    { key: "products", label: "제품 관리", link: "/kr/admin/products.html", roles: ["superadmin","admin","editor"] },
    { key: "newsroom", label: "뉴스룸 관리", link: "/kr/admin/news-list.html", roles: ["superadmin","admin","editor"] },
    { key: "notice", label: "공지사항 관리", link: "/kr/admin/notice-list.html", roles: ["superadmin","admin","editor"] },
    { key: "gallery", label: "갤러리 관리", link: "/kr/admin/gallery-list.html", roles: ["superadmin","admin","editor"] },

    /* 🔥 인증/특허 메뉴 */
    { key: "certifications", label: "인증/특허 관리", link: "/kr/admin/certification-list.html", roles: ["superadmin","admin","editor"] },

    { key: "inquiry", label: "1:1 문의 관리", link: "/kr/admin/inquiry.html", roles: ["superadmin","admin"] },
    { key: "loginlogs", label: "로그인 기록", link: "/kr/admin/login_logs.html", roles: ["superadmin"] }
  ];

  /* 메뉴 필터와 렌더링 */
  const menuHTML = menuItems
    .filter(item => item.roles.includes(role))   // 🔥 여기 안전해짐
    .map(item => `
      <a href="${item.link}" class="menu-item ${activeKey === item.key ? "active" : ""}">
        ${item.label}
      </a>
    `)
    .join("");

  sidebarContainer.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">FINE DEFENSE ADMIN</div>

      <div class="sidebar-profile">
        <img src="${avatar}" class="sidebar-avatar"/>
        <div>
          <div class="profile-name">${name}</div>
          <div class="profile-role">${(role || "").toUpperCase()}</div>
        </div>
      </div>

      <nav class="sidebar-menu">
        ${menuHTML}
      </nav>
    </div>
  `;
};
