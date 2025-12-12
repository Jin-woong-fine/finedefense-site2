// /kr/admin/js/sidebar.js

console.log("%c[sidebar] Apple-style sidebar 로드", "color:#4caf50;font-weight:bold;");

// -------------------------------------------------------------
// 🔵 1) 프로필 API에서 avatar 가져오기
// -------------------------------------------------------------
async function fetchUserAvatar() {
  try {
    const res = await fetch("/api/users/me", {
      headers: authHeaders(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.avatar || null;
  } catch (err) {
    console.warn("[sidebar] avatar 불러오기 실패:", err);
    return null;
  }
}

// -------------------------------------------------------------
// 🔵 2) 사이드바 렌더링
// -------------------------------------------------------------
async function loadSidebar(activePage = "") {
  const wrap = document.getElementById("sidebar");
  if (!wrap) {
    console.warn("[sidebar] #sidebar 요소를 찾을 수 없습니다.");
    return;
  }

  const role = localStorage.getItem("role") || "user";
  const name = localStorage.getItem("name") || "관리자";

  const avatarUrl = await fetchUserAvatar();
  const avatarSrc = avatarUrl || "/img/admin/avatar-placeholder.png";

  // -------------------------------------------------------------
  // 🔵 메뉴 정의 (항상 열린 구조)
  // -------------------------------------------------------------
  const menu = [
    {
      title: "대시보드",
      link: "/kr/admin/dashboard.html",
      key: "dashboard",
      single: true,
    },
    {
      title: "트래픽 분석",
      children: [
        { title: "일별 통계", link: "/kr/admin/traffic_daily.html", key: "traffic_daily" },
        { title: "월별 통계", link: "/kr/admin/traffic_monthly.html", key: "traffic_monthly" },
        { title: "유입경로", link: "/kr/admin/traffic_referrer.html", key: "traffic_referrer" },
        { title: "페이지 조회", link: "/kr/admin/traffic_pages.html", key: "traffic_pages" },
        { title: "국가 / 디바이스", link: "/kr/admin/traffic_device_country.html", key: "traffic_device_country" },
      ],
    },
    {
      title: "게시물 관리",
      children: [
        { title: "공지사항", link: "/kr/admin/notice-list.html", key: "notice" },
        { title: "뉴스룸", link: "/kr/admin/news-list.html", key: "news" },
      ],
    },
    {
      title: "자료실",
      link: "/kr/admin/downloads-list.html",
      key: "downloads",
      single: true,
    },
    {
      title: "제품 관리",
      link: "/kr/admin/products-list.html",
      key: "products",
      single: true,
    },
    {
      title: "고객 문의",
      link: "/kr/admin/inquiry-list.html",
      key: "inquiry",
      single: true,
    },
  ];

  if (role === "admin" || role === "superadmin") {
    menu.push({
      title: "사용자 관리",
      link: "/kr/admin/users.html",
      key: "users",
      single: true,
    });
  }

  // -------------------------------------------------------------
  // 🔵 HTML 렌더링
  // -------------------------------------------------------------
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

      <div class="sidebar-menu">
        ${menu
          .map((item) => {
            // 단일 메뉴
            if (item.single) {
              return `
                <a class="menu-item ${item.key === activePage ? "active" : ""}"
                   href="${item.link}">
                  ${item.title}
                </a>
              `;
            }

            // 그룹 메뉴 (항상 열린 구조)
            return `
              <div class="menu-group">
                <div class="menu-title">${item.title}</div>
                <div class="submenu">
                  ${item.children
                    .map(
                      (ch) => `
                        <a class="menu-item ${ch.key === activePage ? "active" : ""}"
                           href="${ch.link}">
                          ${ch.title}
                        </a>
                      `
                    )
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>

    </div>
  `;

  console.log("[sidebar] 렌더 완료 — activePage:", activePage);
}

// -------------------------------------------------------------
// 🔵 3) 자동 로딩
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const active = document.body.dataset.adminPage || "";
  loadSidebar(active);
});
