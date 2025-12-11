// /kr/admin/js/sidebar.js

console.log("%c[sidebar] 로드 완료", "color:#4caf50;font-weight:bold;");

function loadSidebar(activePage = "") {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  const role = localStorage.getItem("role") || "user";

  // 메뉴 구성
  const menu = [
    {
      title: "대시보드",
      icon: "📊",
      link: "/kr/admin/dashboard.html",
      key: "dashboard"
    },
    {
      title: "트래픽 분석",
      icon: "🌐",
      key: "traffic",
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
      icon: "📝",
      key: "posts",
      children: [
        { title: "공지사항", link: "/kr/admin/notice-list.html", key: "notice" },
        { title: "뉴스룸", link: "/kr/admin/news-list.html", key: "news" }
      ]
    },
    {
      title: "자료실",
      icon: "📁",
      link: "/kr/admin/downloads-list.html",
      key: "downloads"
    },
    {
      title: "제품 관리",
      icon: "📦",
      link: "/kr/admin/products-list.html",
      key: "products"
    },
    {
      title: "고객 문의",
      icon: "💬",
      link: "/kr/admin/inquiry-list.html",
      key: "inquiry"
    }
  ];

  // 관리자만 추가되는 영역
  if (role === "admin" || role === "superadmin") {
    menu.push({
      title: "사용자 관리",
      icon: "👤",
      link: "/kr/admin/users.html",
      key: "users"
    });
  }

  // HTML 렌더링
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <img src="/img/logo/fd-logo-white.png" alt="Fine Defense" />
    </div>
    <ul class="sidebar-menu">
      ${menu
        .map((item) => {
          // 서브 메뉴가 있는 경우
          if (item.children) {
            const open = item.children.some((ch) => ch.key === activePage);
            return `
              <li class="menu-group ${open ? "open" : ""}">
                <div class="menu-title">
                  <span class="icon">${item.icon}</span>
                  ${item.title}
                </div>
                <ul class="submenu">
                  ${item.children
                    .map(
                      (child) => `
                    <li class="${child.key === activePage ? "active" : ""}">
                      <a href="${child.link}">${child.title}</a>
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </li>
            `;
          }

          // 단일 메뉴
          return `
            <li class="${item.key === activePage ? "active" : ""}">
              <a href="${item.link}">
                <span class="icon">${item.icon}</span>
                ${item.title}
              </a>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;

  // 서브메뉴 클릭 시 토글 기능
  document.querySelectorAll(".menu-group .menu-title").forEach((el) => {
    el.addEventListener("click", () => {
      const parent = el.parentElement;
      parent.classList.toggle("open");
    });
  });
}
