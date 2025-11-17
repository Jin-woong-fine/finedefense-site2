/* ============================================================
   🌐 Fine Defense Global Navigation (KR + EN unified)
   - Auto language detection
   - Auto header/footer load
   - Admin mode global bar
   - Breadcrumb & side tabs
   ============================================================ */

let hideTimer = null;

/* ------------------------------------------------------------
   🌐 언어 판단 (URL 기반)
------------------------------------------------------------ */
function detectLang() {
  const path = window.location.pathname.toLowerCase();
  return path.startsWith("/en/") ? "en" : "kr";
}
const LANG = detectLang();

/* ------------------------------------------------------------
   🌐 언어별 경로 세팅
------------------------------------------------------------ */
const PATH = {
  header: `/${LANG}/components/header.html`,
  footer: `/${LANG}/components/footer.html`,
  scriptLang: `/${LANG}/js/language.js`,
};

/* ------------------------------------------------------------
   🌐 Fetch Helper (대기업 스타일)
------------------------------------------------------------ */
async function loadComponent(targetId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} not found`);

    const html = await res.text();
    const target = document.getElementById(targetId);
    if (!target) throw new Error(`#${targetId} missing`);

    target.innerHTML = html;
  } catch (err) {
    console.error("Component Load Error:", err);
  }
}

/* ------------------------------------------------------------
   🔹 상단 메뉴 강조
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = window.location.pathname;

  const menuMap = LANG === "kr" 
    ? [
        { keyword: "/company/", label: "회사소개" },
        { keyword: "/product/", label: "제품소개" },
        { keyword: "/pr/", label: "홍보센터" },
        { keyword: "/support/", label: "고객지원" },
      ]
    : [
        { keyword: "/company/", label: "Company" },
        { keyword: "/product/", label: "Products" },
        { keyword: "/pr/", label: "PR Center" },
        { keyword: "/support/", label: "Support" },
      ];

  const activeMenu = menuMap.find(m => path.includes(m.keyword));
  if (!activeMenu) return;

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    if (a.textContent.trim() === activeMenu.label) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   🔹 사이드 탭 표시
------------------------------------------------------------ */
function showSideTabs(tabList, target) {
  const side = document.getElementById("side-tabs");
  const breadcrumb = document.querySelector(".breadcrumb");
  if (!side || !target || !breadcrumb) return;

  clearTimeout(hideTimer);

  side.innerHTML = tabList
    .map(t => `<a href="${t.link}" class="tab-item">${t.name}</a>`)
    .join("");

  const current = window.location.pathname.toLowerCase();
  const isTopTabs = target.classList.contains("crumb-level1");

  side.querySelectorAll(".tab-item").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (!href) return;

    if (isTopTabs) {
      if (current.includes("/product/") && href.includes("/product/")) a.classList.add("active");
      if (current.includes("/company/") && href.includes("/company/")) a.classList.add("active");
      if (current.includes("/pr/") && href.includes("/pr/")) a.classList.add("active");
      if (current.includes("/support/") && href.includes("/support/")) a.classList.add("active");
    } else {
      const abs = new URL(href, location.origin).pathname.toLowerCase();
      if (current === abs) a.classList.add("active");

      if (
        current.includes("/pr/newsroom/post_template") &&
        href.includes("/pr/newsroom/newsroom.html")
      ) a.classList.add("active");
    }
  });

  const rect = target.getBoundingClientRect();
  const parent = breadcrumb.getBoundingClientRect();

  side.style.position = "absolute";
  side.style.left = `${rect.left - parent.left}px`;
  side.style.top = `${rect.bottom - parent.top + 8}px`;
  side.classList.add("visible");
}

/* ------------------------------------------------------------
   🔹 breadcrumb 탭 초기화
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const topTabs = LANG === "kr" 
    ? [
        { name: "회사소개", link: "/kr/sub/company/overview.html" },
        { name: "제품소개", link: "/kr/sub/product/towed-cable.html" },
        { name: "홍보센터", link: "/kr/sub/pr/newsroom/newsroom.html" },
        { name: "고객지원", link: "/kr/sub/support/" },
      ]
    : [
        { name: "Company", link: "/en/sub/company/overview.html" },
        { name: "Products", link: "/en/sub/product/towed-cable.html" },
        { name: "PR Center", link: "/en/sub/pr/newsroom/newsroom.html" },
        { name: "Support", link: "/en/sub/support/" },
      ];

  const level1 = document.querySelector(".crumb-level1");
  const level2 = document.querySelector(".crumb-level2");
  const breadcrumb = document.querySelector(".breadcrumb");
  const sideTabs = document.getElementById("side-tabs");

  if (!breadcrumb || !sideTabs) return;

  sideTabs.classList.remove("visible");

  if (level1)
    level1.addEventListener("mouseenter", () => showSideTabs(topTabs, level1));

  if (level2) {
    level2.addEventListener("mouseenter", () => {
      const path = location.href.toLowerCase();
      let subTabs = [];

      const base = `/${LANG}/sub`;

      if (path.includes("/company/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "기업개요", link: `${base}/company/overview.html` },
              { name: "CEO 인사말", link: `${base}/company/ceo.html` },
              { name: "기업이념 및 비전", link: `${base}/company/vision.html` },
              { name: "연혁", link: `${base}/company/history.html` },
              { name: "조직도", link: `${base}/company/organization.html` },
              { name: "찾아오시는 길", link: `${base}/company/location.html` },
            ]
          : [
              { name: "Overview", link: `${base}/company/overview.html` },
              { name: "CEO Message", link: `${base}/company/ceo.html` },
              { name: "Mission & Vision", link: `${base}/company/vision.html` },
              { name: "History", link: `${base}/company/history.html` },
              { name: "Organization", link: `${base}/company/organization.html` },
              { name: "Location", link: `${base}/company/location.html` },
            ];
      }

      if (path.includes("/products/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "수중이동형케이블", link: `${base}/product/towed-cable.html` },
              { name: "수중고정형케이블", link: `${base}/product/underwater-fixed-cable.html` },
              { name: "수중커넥터", link: `${base}/product/underwater-connector.html` },
              { name: "커스텀케이블", link: `${base}/product/custom-cable.html` },
            ]
          : [
              { name: "Towed Cable", link: `${base}/product/towed-cable.html` },
              { name: "Fixed Underwater Cable", link: `${base}/product/underwater-fixed-cable.html` },
              { name: "Underwater Connector", link: `${base}/product/underwater-connector.html` },
              { name: "Custom Cable", link: `${base}/product/custom-cable.html` },
            ];
      }

      if (path.includes("/pr/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "뉴스룸", link: `${base}/pr/newsroom/newsroom.html` },
              { name: "공지사항", link: `${base}/pr/notice/notice.html` },
              { name: "갤러리", link: `${base}/pr/gallery/gallery.html` },
              { name: "인증 및 특허", link: `${base}/pr/cert/cert.html` },
              { name: "카탈로그", link: `${base}/pr/catalog/catalog.html` },
            ]
          : [
              { name: "Newsroom", link: `${base}/pr/newsroom/newsroom.html` },
              { name: "Notice", link: `${base}/pr/notice/notice.html` },
              { name: "Gallery", link: `${base}/pr/gallery/gallery.html` },
              { name: "Certificates", link: `${base}/pr/cert/cert.html` },
              { name: "Catalog", link: `${base}/pr/catalog/catalog.html` },
            ];
      }

      if (path.includes("/support/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "자료실", link: `${base}/support/download.html` },
              { name: "문의하기", link: `${base}/support/contact.html` },
            ]
          : [
              { name: "Downloads", link: `${base}/support/download.html` },
              { name: "Contact", link: `${base}/support/contact.html` },
            ];
      }

      showSideTabs(subTabs, level2);
    });
  }

  breadcrumb.addEventListener("mouseleave", scheduleHideTabs);
}

/* ============================================================
   🔥 Admin Mode (KR/EN 자동 대응)
============================================================ */
function initAdminBar() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (role !== "admin" || !token) return;

  const adminBar = document.createElement("div");
  adminBar.id = "adminBar";

  // 언어별 텍스트
  const LABEL = LANG === "kr"
    ? { mode: "FINE DEFENSE ADMIN MODE", dashboard: "관리자 대시보드", logout: "로그아웃" }
    : { mode: "FINE DEFENSE ADMIN MODE", dashboard: "Admin Dashboard", logout: "Logout" };

  adminBar.innerHTML = `
    <div class="admin-left"><strong>${LABEL.mode}</strong></div>
    <div class="admin-right">
      <a href="/${LANG}/admin/dashboard.html">${LABEL.dashboard}</a>
      <a href="#" id="adminLogout">${LABEL.logout}</a>
    </div>
  `;

  adminBar.style.cssText = `
    width:100%;
    height:48px;
    background:#0f2679;
    color:#fff;
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:0 20px;
    box-sizing:border-box;
    position:fixed;
    top:0;
    left:0;
    z-index:9999;
  `;

  document.body.classList.add("admin-mode");
  document.body.prepend(adminBar);

  document.getElementById("adminLogout").addEventListener("click", () => {
    if (confirm(LANG === "kr" ? "로그아웃하시겠습니까?" : "Log out?")) {
      localStorage.clear();
      location.href = `/${LANG}/admin/login.html`;
    }
  });
}

/* ============================================================
   🚀 DOMContentLoaded
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  // 언어 파일 로드
  const langScript = document.createElement("script");
  langScript.src = PATH.scriptLang;
  document.body.appendChild(langScript);

  initBreadcrumbTabs();
  highlightTopMenu();
  initAdminBar();
});



/* ------------------------------------------------------------
   🔹 사이드 탭 자동 숨김 (필수)
------------------------------------------------------------ */
function scheduleHideTabs() {
  const side = document.getElementById("side-tabs");
  if (!side) return;

  // 0.2초 뒤 자동 숨김
  hideTimer = setTimeout(() => {
    side.classList.remove("visible");
  }, 200);
}
