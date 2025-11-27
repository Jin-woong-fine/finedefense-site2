/* ============================================================
   🌐 Fine Defense NAV — FINAL STABLE (2025.12)
   - AdminBar 먼저 로드 (중요!!)
   - Header / Footer 정상 로딩
   - Top Menu Active
   - Breadcrumb Level1/2 Active
   - SideTabs + 상세페이지 index Active
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
   2) Header / Footer 경로 (⭐ 상대 경로로 변경)
------------------------------------------------------------ */
const PATH = {
  header: `/${LANG}/components/header.html`,
  footer: `/${LANG}/components/footer.html`,
};

/* ------------------------------------------------------------
   3) 공통 컴포넌트 로더
------------------------------------------------------------ */
async function loadComponent(targetId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + " not found");

    const html = await res.text();
    const el = document.getElementById(targetId);
    if (el) el.innerHTML = html;

  } catch (e) {
    console.error("Component Load Error:", e);
  }
}

/* ------------------------------------------------------------
   4) Admin Bar (⭐ 헤더보다 먼저 로드해야 함!)
------------------------------------------------------------ */
function initAdminBar() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!["admin", "superadmin"].includes(role) || !token) return;

  const bar = document.createElement("div");
  bar.id = "adminBar";

  bar.innerHTML = `
    <div class="admin-left"><strong>FINE DEFENSE ADMIN MODE</strong></div>
    <div class="admin-right">
      <a href="/${LANG}/index.html" class="admin-btn">홈</a>
      <a href="/${LANG}/admin/dashboard.html" class="admin-btn">대시보드</a>
      <a href="#" id="adminLogout" class="admin-btn">로그아웃</a>
    </div>
  `;

  bar.style.cssText = `
    width: 100%;
    height: 48px;
    background: #0f2679;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    position: fixed;
    top: 0; left: 0;
    z-index: 9999;
    font-size: 14px;
  `;

  // 헤더 밀림 방지 → body padding만 추가
  document.body.style.paddingTop = "48px";

  document.body.prepend(bar);

  document.getElementById("adminLogout")?.addEventListener("click", e => {
    e.preventDefault();
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
  });
}

/* ------------------------------------------------------------
   5) Top Menu Active (회사소개/제품소개/홍보센터/고객지원)
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = location.pathname.toLowerCase();

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();

    if (
      (path.includes("/company/")  && href.includes("/company/"))  ||
      (path.includes("/products/") && href.includes("/products/")) ||
      (path.includes("/product/")  && href.includes("/products/")) ||
      (path.includes("/pr/")       && href.includes("/pr/"))       ||
      (path.includes("/support/")  && href.includes("/support/"))
    ) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   6) Breadcrumb Level1 / Level2 Active
------------------------------------------------------------ */
function highlightBreadcrumb() {
  const path = location.pathname.toLowerCase();

  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  if (!lv1 || !lv2) return;

  if (path.includes("/company/")) lv1.classList.add("active");
  if (path.includes("/products/") || path.includes("/product/")) lv1.classList.add("active");
  if (path.includes("/pr/")) lv1.classList.add("active");
  if (path.includes("/support/")) lv1.classList.add("active");

  lv2.classList.add("active");
}

/* ------------------------------------------------------------
   7) Side Tabs + 상세페이지 index 활성화
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

    if (current === href) a.classList.add("active");

    const DETAIL_MAPPING = [
      { d: "/pr/notice/notice-view",         i: "/pr/notice/index.html" },
      { d: "/pr/newsroom/news-view",         i: "/pr/newsroom/index.html" },
      { d: "/pr/gallery/gallery-view",       i: "/pr/gallery/index.html" },
      { d: "/pr/certification/certification-view", i: "/pr/certification/index.html" },
      { d: "/pr/catalog/catalog-view",       i: "/pr/catalog/index.html" },
      { d: "/support/downloads/downloads-view", i: "/support/downloads/index.html" },
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
  side.style.top  = `${a.bottom - b.top + 8}px`;
  side.classList.add("visible");
}

function scheduleHideTabs() {
  const s = document.getElementById("side-tabs");
  if (!s) return;
  hideTimer = setTimeout(() => s.classList.remove("visible"), 150);
}

/* ------------------------------------------------------------
   8) Breadcrumb 탭 초기화
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  const side = document.getElementById("side-tabs");
  if (!side) return;

  const base = `/${LANG}/sub`;

  const TOP = LANG === "kr"
    ? [
        { name: "회사소개", link: `${base}/company/overview.html` },
        { name: "제품소개", link: `${base}/products/sub-towed.html` },
        { name: "홍보센터", link: `${base}/pr/newsroom/index.html` },
        { name: "고객지원", link: `${base}/support/inquiry/index.html` },
      ]
    : [
        { name: "Company",   link: `${base}/company/overview.html` },
        { name: "Products",  link: `${base}/products/sub-towed.html` },
        { name: "PR Center", link: `${base}/pr/newsroom/index.html` },
        { name: "Support",   link: `${base}/support/inquiry/index.html` },
      ];

  // lv1 탭
  lv1?.addEventListener("mouseenter", () => showSideTabs(TOP, lv1));

  // lv2 탭
  lv2?.addEventListener("mouseenter", () => {
    const p = location.pathname.toLowerCase();
    let tabs = [];

    // 회사소개
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

    // 제품소개
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

    // 홍보센터
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

    // 고객지원
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
   9) DOM 로드 후 초기화 — ⭐ AdminBar 먼저 실행
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  initAdminBar();  // ⭐ 가장 먼저

  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  highlightTopMenu();
  highlightBreadcrumb();
  initBreadcrumbTabs();

  setTimeout(() => highlightTopMenu(), 80);
});
