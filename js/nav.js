/* ============================================================
   🌐 Fine Defense NAV — FINAL (Breadcrumb + Menu Active Fix)
============================================================ */

let hideTimer = null;

/* ------------------------------------------------------------
   1) 언어 감지
------------------------------------------------------------ */
function detectLang() {
  const p = location.pathname.toLowerCase();
  return p.startsWith("/en/") ? "en" : "kr";
}
const LANG = detectLang();

/* ------------------------------------------------------------
   2) Header / Footer 경로
------------------------------------------------------------ */
const PATH = {
  header: `/${LANG}/components/header.html`,
  footer: `/${LANG}/components/footer.html`,
};

/* ------------------------------------------------------------
   3) HTML 로더
------------------------------------------------------------ */
function highlightBreadcrumb() {
  const path = location.pathname.toLowerCase();

  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  if (!lv1 || !lv2) return;

  // Level1 (경로 기반)
  if (path.includes("/company/")) lv1.classList.add("active");
  if (path.includes("/products/") || path.includes("/product/"))
    lv1.classList.add("active");
  if (path.includes("/pr/")) lv1.classList.add("active");
  if (path.includes("/support/")) lv1.classList.add("active");

  // Level2 (항상 강조)
  lv2.classList.add("active");
}


/* ------------------------------------------------------------
   4) 상단 메뉴 강조 (메인 메뉴 전용)
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = location.pathname.toLowerCase();

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    const href = a.getAttribute("href")?.toLowerCase() || "";

    if (
      (path.includes("/company/")  && href.includes("/company/")) ||
      (path.includes("/products/") && href.includes("/products/")) ||
      (path.includes("/product/")  && href.includes("/products/")) ||
      (path.includes("/pr/")       && href.includes("/pr/")) ||
      (path.includes("/support/")  && href.includes("/support/"))
    ) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   5) Breadcrumb Level1 / Level2 강조 기능
------------------------------------------------------------ */
function highlightBreadcrumb() {
  const path = location.pathname.toLowerCase();

  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  if (!lv1 || !lv2) return;

  // Level1 (경로 기반)
  if (path.includes("/company/")) lv1.classList.add("active");
  if (path.includes("/products/") || path.includes("/product/"))
    lv1.classList.add("active");
  if (path.includes("/pr/")) lv1.classList.add("active");
  if (path.includes("/support/")) lv1.classList.add("active");

  // Level2 (항상 강조)
  lv2.classList.add("active");
}


/* ------------------------------------------------------------
   6) Side Tabs 표시 + 상세 페이지 Active 처리
------------------------------------------------------------ */
function showSideTabs(list, trigger) {
  const side = document.getElementById("side-tabs");
  const bc = document.querySelector(".breadcrumb");
  if (!side || !bc || !trigger) return;

  clearTimeout(hideTimer);
  const current = location.pathname.toLowerCase();

  side.innerHTML = list
    .map(t => `<a href="${t.link}" class="tab-item">${t.name}</a>`)
    .join("");

  side.querySelectorAll(".tab-item").forEach(a => {
    const href = new URL(a.href).pathname.toLowerCase();

    // 기본 매칭
    if (current === href) a.classList.add("active");

    // 상세 페이지 → index.html 강조 규칙
    const DETAIL_MAPPING = [
      { d: "/pr/newsroom/news-view",       i: "/pr/newsroom/index.html" },
      { d: "/pr/gallery/gallery-view",     i: "/pr/gallery/index.html" },
      { d: "/pr/certification/certification-view", i: "/pr/certification/index.html" },
      { d: "/pr/catalog/catalog-view",     i: "/pr/catalog/index.html" },
      { d: "/support/downloads/downloads-view", i: "/support/downloads/index.html" },
      { d: "/pr/notice/notice-view",       i: "/pr/notice/index.html" },
    ];

    DETAIL_MAPPING.forEach(m => {
      if (current.includes(m.d) && href.includes(m.i)) {
        a.classList.add("active");
      }
    });
  });

  const a = trigger.getBoundingClientRect();
  const b = bc.getBoundingClientRect();

  side.style.left = `${a.left - b.left}px`;
  side.style.top = `${a.bottom - b.top + 8}px`;
  side.classList.add("visible");
}

/* ------------------------------------------------------------
   7) Breadcrumb 탭 초기화 (탭 목록 구성)
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  const side = document.getElementById("side-tabs");
  if (!side) return;

  const base = `/${LANG}/sub`;

  /* 상위 대분류 */
  const TOP = LANG === "kr"
    ? [
        { name: "회사소개", link: `${base}/company/overview.html` },
        { name: "제품소개", link: `${base}/products/sub-towed.html` },
        { name: "홍보센터", link: `${base}/pr/newsroom/index.html` },
        { name: "고객지원", link: `${base}/support/inquiry/index.html` },
      ]
    : [
        { name: "Company", link: `${base}/company/overview.html` },
        { name: "Products", link: `${base}/products/sub-towed.html` },
        { name: "PR Center", link: `${base}/pr/newsroom/index.html` },
        { name: "Support", link: `${base}/support/inquiry/index.html` },
      ];

  // 레벨1 탭
  lv1?.addEventListener("mouseenter", () => showSideTabs(TOP, lv1));

  // 레벨2 탭
  lv2?.addEventListener("mouseenter", () => {
    const p = location.pathname.toLowerCase();
    let tabs = [];

    if (p.includes("/company/")) {
      tabs = LANG === "kr"
        ? [
            { name: "기업개요", link: `${base}/company/overview.html` },
            { name: "CEO 인사말", link: `${base}/company/ceo.html` },
            { name: "연혁", link: `${base}/company/history.html` },
            { name: "기업이념 및 비전", link: `${base}/company/vision.html` },
            { name: "조직도", link: `${base}/company/organization.html` },
            { name: "찾아오시는 길", link: `${base}/company/location.html` },
          ]
        : [
            { name: "Overview", link: `${base}/company/overview.html` },
            { name: "CEO Message", link: `${base}/company/ceo.html` },
            { name: "History", link: `${base}/company/history.html` },
            { name: "Vision", link: `${base}/company/vision.html` },
            { name: "Organization", link: `${base}/company/organization.html` },
            { name: "Location", link: `${base}/company/location.html` },
          ];
    }

    if (p.includes("/products/") || p.includes("/product/")) {
      tabs = LANG === "kr"
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

    if (p.includes("/pr/")) {
      tabs = LANG === "kr"
        ? [
            { name: "공지사항", link: `${base}/pr/notice/index.html` },
            { name: "뉴스룸", link: `${base}/pr/newsroom/index.html` },
            { name: "갤러리", link: `${base}/pr/gallery/index.html` },
            { name: "인증/특허", link: `${base}/pr/certification/index.html` },
            { name: "카탈로그", link: `${base}/pr/catalog/index.html` },
          ]
        : [
            { name: "Notice", link: `${base}/pr/notice/index.html` },
            { name: "Newsroom", link: `${base}/pr/newsroom/index.html` },
            { name: "Gallery", link: `${base}/pr/gallery/index.html` },
            { name: "Certificates", link: `${base}/pr/cert/index.html` },
            { name: "Catalog", link: `${base}/pr/catalog/index.html` },
          ];
    }

    if (p.includes("/support/")) {
      tabs = LANG === "kr"
        ? [
            { name: "1:1 문의", link: `${base}/support/inquiry/index.html` },
            { name: "자료실", link: `${base}/support/downloads/index.html` },
          ]
        : [
            { name: "Inquiry", link: `${base}/support/inquiry/index.html` },
            { name: "Download", link: `${base}/support/downloads/index.html` },
          ];
    }

    showSideTabs(tabs, lv2);
  });

  document.querySelector(".breadcrumb")?.addEventListener("mouseleave", scheduleHideTabs);
}

/* ------------------------------------------------------------
   8) Admin Bar
------------------------------------------------------------ */
function initAdminBar() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!["admin", "superadmin"].includes(role) || !token) return;

  const bar = document.createElement("div");
  bar.id = "adminBar";

  bar.style.cssText = `
    width:100%;
    height:48px;
    background:#0f2679;
    color:white;
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:0 20px;
    position:fixed;
    top:0; left:0;
    z-index:9999;
    font-size:14px;
  `;

  document.body.prepend(bar);

  // 중요: header 로드가 끝나고 marginTop 적용
  loadComponent("header", PATH.header, () => {
    const header = document.querySelector("header.header-inner");
    if (header) {
      header.style.marginTop = "48px";
    }
  });

  // footer는 기존대로
  loadComponent("footer", PATH.footer);

  // 로그아웃 버튼 처리
  bar.addEventListener("click", (e) => {
    if (e.target.id === "adminLogout") {
      localStorage.clear();
      location.href = `/${LANG}/admin/login.html`;
    }
  });
}


/* ------------------------------------------------------------
   9) DOM 로드 후 초기화
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  highlightTopMenu();
  highlightBreadcrumb();
  initBreadcrumbTabs();
  initAdminBar();

  setTimeout(() => highlightTopMenu(), 50);
});

/* ------------------------------------------------------------
   10) SideTabs 자동 숨김
------------------------------------------------------------ */
function scheduleHideTabs() {
  const s = document.getElementById("side-tabs");
  if (!s) return;
  hideTimer = setTimeout(() => s.classList.remove("visible"), 150);
}
