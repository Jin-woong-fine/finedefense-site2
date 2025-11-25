/* ============================================================
   🌐 Fine Defense Unified Navigation System (Optimized)
   - KR/EN 자동 인식
   - Header/Footer 자동 로딩
   - Breadcrumb & Side Tabs
   - News Detail active fix
   - Admin Mode 표시
   ============================================================ */

let hideTimer = null;

/* ------------------------------------------------------------
   1) 언어 자동 감지 (경로 기반)
------------------------------------------------------------ */
function detectLang() {
  const path = window.location.pathname.toLowerCase();
  return path.startsWith("/en/") ? "en" : "kr";
}
const LANG = detectLang();

/* ------------------------------------------------------------
   2) 공통 경로 설정
------------------------------------------------------------ */
const PATH = {
  header: `/${LANG}/components/header.html`,
  footer: `/${LANG}/components/footer.html`,
};

/* ------------------------------------------------------------
   3) HTML 컴포넌트 로더
------------------------------------------------------------ */
async function loadComponent(targetId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} not found`);
    const html = await res.text();

    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = html;
  } catch (err) {
    console.error("Component Load Error:", err);
  }
}

/* ------------------------------------------------------------
   4) 상단 메뉴 활성화
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = window.location.pathname.toLowerCase();

  const menuMap = LANG === "kr"
    ? [
        { key: "/company/", txt: "회사소개" },
        { key: "/products/", txt: "제품소개" },
        { key: "/product/", txt: "제품소개" },
        { key: "/pr/", txt: "홍보센터" },
        { key: "/support/", txt: "고객지원" },
      ]
    : [
        { key: "/company/", txt: "Company" },
        { key: "/products/", txt: "Products" },
        { key: "/product/", txt: "Products" },
        { key: "/pr/", txt: "PR Center" },
        { key: "/support/", txt: "Support" },
      ];

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    const label = a.textContent.trim();
    if (menuMap.some(m => path.includes(m.key) && m.txt === label)) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   5) 사이드 탭 표시
------------------------------------------------------------ */
function showSideTabs(tabList, triggerEl) {
  const side = document.getElementById("side-tabs");
  const breadcrumb = document.querySelector(".breadcrumb");
  if (!side || !breadcrumb || !triggerEl) return;

  clearTimeout(hideTimer);

  side.innerHTML = tabList
    .map(t => `<a href="${t.link}" class="tab-item">${t.name}</a>`)
    .join("");

  // 활성 탭
  const current = location.pathname.toLowerCase();
  side.querySelectorAll(".tab-item").forEach(a => {
    const href = new URL(a.href).pathname.toLowerCase();
    if (current === href) a.classList.add("active");

    // 🔥 뉴스룸 상세페이지(active fix)
    if (current.includes("/pr/newsroom/news-view") && href.includes("/pr/newsroom/index.html")) {
      a.classList.add("active");
    }
  });

  const rect = triggerEl.getBoundingClientRect();
  const parent = breadcrumb.getBoundingClientRect();

  side.style.left = `${rect.left - parent.left}px`;
  side.style.top = `${rect.bottom - parent.top + 8}px`;
  side.classList.add("visible");
}

/* ------------------------------------------------------------
   6) Breadcrumb 상단 탭 초기화
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const level1 = document.querySelector(".crumb-level1");
  const level2 = document.querySelector(".crumb-level2");
  const side = document.getElementById("side-tabs");
  if (!side) return;

  const TOP_TABS = LANG === "kr"
    ? [
        { name: "회사소개", link: "/kr/sub/company/overview.html" },
        { name: "제품소개", link: "/kr/sub/products/sub-towed.html" },
        { name: "홍보센터", link: "/kr/sub/pr/newsroom/index.html" },
        { name: "고객지원", link: "/kr/sub/support/" },
      ]
    : [
        { name: "Company", link: "/en/sub/company/overview.html" },
        { name: "Products", link: "/en/sub/products/sub-towed.html" },
        { name: "PR Center", link: "/en/sub/pr/newsroom/index.html" },
        { name: "Support", link: "/en/sub/support/" },
      ];

  if (level1) {
    level1.addEventListener("mouseenter", () => showSideTabs(TOP_TABS, level1));
  }

  if (level2) {
    level2.addEventListener("mouseenter", () => {
      const path = location.pathname.toLowerCase();
      const base = `/${LANG}/sub`;

      let subTabs = [];

      // 회사소개
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
              { name: "Vision", link: `${base}/company/vision.html` },
              { name: "History", link: `${base}/company/history.html` },
              { name: "Organization", link: `${base}/company/organization.html` },
              { name: "Location", link: `${base}/company/location.html` },
            ];
      }

      // 제품소개
      if (path.includes("/product/") || path.includes("/products/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "수중이동형케이블", link: `${base}/products/sub-towed.html` },
              { name: "수중고정형케이블", link: `${base}/products/sub-fixed.html` },
              { name: "수중커넥터", link: `${base}/products/sub-connector.html` },
              { name: "커스텀케이블", link: `${base}/products/sub-custom.html` },
            ]
          : [
              { name: "Towed Cable", link: `${base}/products/sub-towed.html` },
              { name: "Fixed Cable", link: `${base}/products/sub-fixed.html` },
              { name: "Connector", link: `${base}/products/sub-connector.html` },
              { name: "Custom Cable", link: `${base}/products/sub-custom.html` },
            ];
      }

      // 홍보센터 (PR)
      if (path.includes("/pr/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "공지사항", link: `${base}/pr/notice/index.html` },
              { name: "뉴스룸", link: `${base}/pr/newsroom/index.html` },
              { name: "갤러리", link: `${base}/pr/gallery/gallery.html` },
              { name: "인증/특허", link: `${base}/pr/cert/cert.html` },
              { name: "카탈로그", link: `${base}/pr/catalog/catalog.html` },
            ]
          : [
              { name: "Notice", link: `${base}/pr/notice/index.html` },
              { name: "Newsroom", link: `${base}/pr/newsroom/index.html` },
              { name: "Gallery", link: `${base}/pr/gallery/gallery.html` },
              { name: "Certificates", link: `${base}/pr/cert/cert.html` },
              { name: "Catalog", link: `${base}/pr/catalog/catalog.html` },
            ];
      }

      // 고객지원
      if (path.includes("/support/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "1:1 문의", link: `${base}/support/inquiry.html` },
              { name: "자료실", link: `${base}/support/download.html` },
            ]
          : [
              { name: "Inquiry", link: `${base}/support/inquiry.html` },
              { name: "Download", link: `${base}/support/download.html` },
            ];
      }

      showSideTabs(subTabs, level2);
    });
  }

  document.querySelector(".breadcrumb")?.addEventListener("mouseleave", scheduleHideTabs);
}

/* ------------------------------------------------------------
   7) Admin Mode Bar
------------------------------------------------------------ */
function initAdminBar() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!["admin", "superadmin"].includes(role) || !token) return;

  const adminBar = document.createElement("div");
  adminBar.id = "adminBar";

  adminBar.innerHTML = `
    <div class="admin-left"><strong>FINE DEFENSE ADMIN MODE</strong></div>
    <div class="admin-right">
      <a href="/${LANG}/admin/dashboard.html">관리자</a>
      <a href="#" id="adminLogout">로그아웃</a>
    </div>
  `;

  adminBar.style.cssText = `
    width:100%; height:48px; background:#0f2679; color:white;
    display:flex; justify-content:space-between; align-items:center;
    padding:0 20px; position:fixed; top:0; left:0; z-index:9999;
  `;

  document.body.prepend(adminBar);

  document.getElementById("adminLogout").addEventListener("click", () => {
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
  });
}

/* ------------------------------------------------------------
   8) DOMContentLoaded: 전체 초기화
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  highlightTopMenu();
  initBreadcrumbTabs();
  initAdminBar();
});

/* ------------------------------------------------------------
   9) 사이드 탭 자동 숨김
------------------------------------------------------------ */
function scheduleHideTabs() {
  const side = document.getElementById("side-tabs");
  if (!side) return;
  hideTimer = setTimeout(() => side.classList.remove("visible"), 150);
}
