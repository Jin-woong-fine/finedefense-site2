// /kr/admin/js/sidebar.js
console.log("%c[sidebar] 로드 완료", "color:#4caf50;font-weight:bold;");

// -------------------------------------------------------------
// 🔵 프로필 avatar 로드
// -------------------------------------------------------------
async function fetchUserAvatar() {
  try {
    const res = await fetch("/api/users/me", {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatar || null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// 🔵 사이드바 렌더 (ALWAYS OPEN)
// -------------------------------------------------------------
async function loadSidebar(activePage = "") {
  const wrap = document.getElementById("sidebar");
  if (!wrap) return;

  const role = localStorage.getItem("role") || "user";
  const name = localStorage.getItem("name") || "관리자";

  const avatarUrl = await fetchUserAvatar();
  const avatarSrc = avatarUrl || "/img/admin/avatar-placeholder.png";

  const menu = [
    { title: "대시보드", link: "/kr/admin/dashboard.html", key: "dashboard", special: "dashboard-root" },

    {
      title: "트래픽 분석",
      children: [
        { title: "일별 통계", link: "/kr/admin/traffic_daily.html", key: "traffic_daily" },
        { title: "월별 통계", link: "/kr/admin/traffic_monthly.html", key: "traffic_monthly" },
        { title: "유입경로", link: "/kr/admin/traffic_referrer.html", key: "traffic_referrer" },
        { title: "페이지 조회", link: "/kr/admin/traffic_pages.html", key: "traffic_pages" },
        { title: "국가/디바이스", link: "/kr/admin/traffic_device_country.html", key: "traffic_device_country" }
      ]
    },

    {
      title: "게시물 관리",
      children: [
        { title: "공지사항", link: "/kr/admin/notice-list.html", key: "notice" },
        { title: "뉴스룸", link: "/kr/admin/news-list.html", key: "news" }
      ]
    },

    { title: "자료실", link: "/kr/admin/downloads-list.html", key: "downloads" },
    { title: "제품 관리", link: "/kr/admin/products-list.html", key: "products" },
    { title: "고객 문의", link: "/kr/admin/inquiry-list.html", key: "inquiry" }
  ];

  if (role === "admin" || role === "superadmin") {
    menu.push({ title: "사용자 관리", link: "/kr/admin/users.html", key: "users" });
  }

  wrap.innerHTML = `
    <div class="sidebar">

      <div class="sidebar-header">
        <div class="logo">FINE DEFENSE</div>
      </div>

      <div class="user-block">
        <img class="avatar" src="${avatarSrc}" alt="avatar" />
        <div class="user-info">
          <div class="name">${name}</div>
          <div class="role">${role}</div>
        </div>
      </div>

      <div class="menu-title">MENU</div>

      <div class="sidebar-menu">
        ${menu.map(item => {
          if (item.children) {
            return `
              <div class="menu-group open">
                <div class="menu-title">${item.title}</div>
                <div class="submenu">
                  ${item.children.map(ch => `
                    <a class="menu-item ${ch.key === activePage ? "active" : ""}"
                       href="${ch.link}">
                      ${ch.title}
                    </a>
                  `).join("")}
                </div>
              </div>
            `;
          }

          return `
            <a class="menu-item ${item.special || ""} ${item.key === activePage ? "active" : ""}"
               href="${item.link}">
              ${item.title}
            </a>
          `;
        }).join("")}
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 🔵 자동 실행
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const active = document.body.dataset.adminPage || "";
  loadSidebar(active);
});
