/* ============================================================
   ⭐ Fine Defense Admin Sidebar (Stable Version)
   ============================================================ */

window.loadSidebar = function(activeKey) {

  const sidebarContainer = document.getElementById("sidebar");
  if (!sidebarContainer) return;

  const name = localStorage.getItem("name") || "사용자";
  const role = localStorage.getItem("role") || "";
  const avatar = localStorage.getItem("avatar")
    ? `/uploads/avatars/${localStorage.getItem("avatar")}`
    : "/kr/admin/img/default-avatar.png";

  const menuItems = [
    { key: "dashboard", label: "대시보드", link: "/kr/admin/dashboard.html", roles: ["superadmin","admin","editor","viewer"] },
    { key: "users", label: "사용자 관리", link: "/kr/admin/users.html", roles: ["superadmin","admin"] },
    { key: "products", label: "제품 관리", link: "/kr/admin/products.html", roles: ["superadmin","admin","editor"] },
    { key: "newsroom", label: "뉴스룸 관리", link: "/kr/admin/news-list.html", roles: ["superadmin","admin","editor"] },
    { key: "notice", label: "공지사항 관리", link: "/kr/admin/notice-list.html", roles: ["superadmin","admin","editor"] },
    { key: "inquiry", label: "1:1 문의 관리", link: "/kr/admin/inquiry.html", roles: ["superadmin","admin"] },
    { key: "loginlogs", label: "로그인 기록", link: "/kr/admin/login-logs.html", roles: ["superadmin"] }
  ];

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
        ${menuItems
          .filter(item => item.roles.includes(role))
          .map(item => `
            <a href="${item.link}" 
               class="menu-item ${activeKey === item.key ? "active" : ""}">
              ${item.label}
            </a>
          `).join("")}
      </nav>
    </div>
  `;
};
