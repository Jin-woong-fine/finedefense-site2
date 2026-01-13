/* ============================================================
   🌐 Fine Defense NAV — PERFECT FINAL (2025.12)
   - AdminBar 먼저 로드
   - Header / Footer 자동 로드
   - Top Menu Highlight
   - Breadcrumb Lv1 / Lv2 Highlight
   - SideTabs Lv1 / Lv2 Active
   - 상세페이지 index Active 매핑
============================================================ */

let hideTimer = null;
let lv2Ready = false;

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
   3) 공통 컴포넌트 로더
------------------------------------------------------------ */
async function loadComponent(targetId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} not found`);

    const html = await res.text();
    const el = document.getElementById(targetId);
    if (el) el.innerHTML = html;

  } catch (e) {
    console.error("Component Load Error:", e);
  }
}

/* ------------------------------------------------------------
   4) Admin Bar (⭐ 헤더보다 먼저!)
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

  document.body.style.paddingTop = "48px";
  document.body.prepend(bar);

  document.getElementById("adminLogout")?.addEventListener("click", e => {
    e.preventDefault();
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
  });
}

/* ------------------------------------------------------------
   5) Top Menu Active
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = location.pathname.toLowerCase();

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();

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
   6) Breadcrumb 레벨1/2 + 카테고리 저장
------------------------------------------------------------ */
function highlightBreadcrumb() {
  function tryActivate() {
    const lv1 = document.querySelector(".crumb-level1");
    const lv2 = document.querySelector(".crumb-level2");

    if (!lv1 || !lv2) return setTimeout(tryActivate, 50);

    lv1.classList.add("active");
    lv2.classList.add("active");

    const path = location.pathname.toLowerCase();

    if (path.includes("/company/")) window.currentCategory = "company";
    else if (path.includes("/products/") || path.includes("/product/")) window.currentCategory = "products";
    else if (path.includes("/pr/")) window.currentCategory = "pr";
    else if (path.includes("/support/")) window.currentCategory = "support";
    else window.currentCategory = null;
  }
  tryActivate();
}

/* ------------------------------------------------------------
   7) SideTabs + 상세 index Active + Lv1 Active
------------------------------------------------------------ */
function showSideTabs(list, trigger) {
  const side = document.getElementById("side-tabs");
  const bc = document.querySelector(".breadcrumb");
  if (!side || !bc || !trigger) return;

  clearTimeout(hideTimer);

  const current = location.pathname.toLowerCase();

  // HTML 생성
  side.innerHTML = list
    .map(t => `<a href="${t.link}" class="tab-item">${t.name}</a>`)
    .join("");

  const items = side.querySelectorAll(".tab-item");

  // 📌 레벨2 Active 처리
  items.forEach(a => {
    const href = new URL(a.href).pathname.toLowerCase();

    if (current === href) a.classList.add("active");

    // 🔥 Inquiry 페이지는 상세페이지 없음 → DETAIL 처리 비활성화 (버그 방지)
    if (current.includes("/support/inquiry/")) return;

    const DETAIL = [
      { d: "/pr/notice/notice-view",         i: "/pr/notice/index.html" },
      { d: "/pr/newsroom/news-view",         i: "/pr/newsroom/index.html" },
      { d: "/pr/gallery/gallery-view",       i: "/pr/gallery/index.html" },
      { d: "/pr/certification/certification-view", i: "/pr/certification/index.html" },
      { d: "/pr/catalog/catalog-view",       i: "/pr/catalog/index.html" },
      //{ d: "/support/downloads/downloads-view", i: "/support/downloads/index.html" },
    ];

    DETAIL.forEach(m => {
      if (current.includes(m.d) && href.includes(m.i)) {
        a.classList.add("active");
      }
    });
  });

  // ⭐ 레벨1 Active 처리 (TOP 목록일 때만)
  if (list.isTop && window.currentCategory) {
    const map = { company: 0, products: 1, pr: 2, support: 3 };
    const idx = map[window.currentCategory];
    if (items[idx]) items[idx].classList.add("active");
  }

  // 위치 조정
  const a = trigger.getBoundingClientRect();
  const b = bc.getBoundingClientRect();
  side.style.left = `${a.left - b.left}px`;
  side.style.top  = `${a.bottom - b.top + 8}px`;
  side.classList.add("visible");
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

  // ⭐ 레벨1 목록 정의 + 표식 추가
  const TOP = LANG === "kr"
    ? [
        { name: "회사소개", link: `${base}/company/overview.html` },
        { name: "제품소개", link: `${base}/products/sub-towed.html` },
        { name: "홍보센터", link: `${base}/pr/newsroom/index.html` },
        { name: "고객지원", link: `${base}/support/inquiry/index.html` },
      ]
    : [
        { name: "Who we are", link: `${base}/company/overview.html` },
        { name: "What we do", link: `${base}/products/sub-towed.html` },
        { name: "Media Center", link: `${base}/pr/newsroom/index.html` },
        { name: "Support", link: `${base}/support/inquiry/index.html` },
      ];

  TOP.isTop = true; // ⭐ TOP임을 표시

  // 레벨1 Hover
  lv1?.addEventListener("mouseenter", () => showSideTabs(TOP, lv1));

  // 레벨2 Hover
  lv2?.addEventListener("mouseenter", () => {
    if (!lv2Ready) return;   // ⭐ 추가된 가드

    const p = location.pathname.toLowerCase();
    let tabs = [];

    // 회사소개
    if (p.includes("/company/")) {
      tabs = LANG === "kr"
        ? [
            { name: "기업소개", link: `${base}/company/overview.html` },
            { name: "연혁", link: `${base}/company/history.html` },
            { name: "사업장", link: `${base}/company/location.html` },
          ]
        : [
            { name: "About Us", link: `${base}/company/overview.html` },
            { name: "Our History", link: `${base}/company/history.html` },
            { name: "Locations", link: `${base}/company/location.html` },
          ];
    }

    // 제품소개
    if (p.includes("/products/") || p.includes("/product/")) {
      tabs = LANG === "kr"
        ? [
            { name: "수중이동형 케이블", link: `${base}/products/sub-towed.html` },
            { name: "수중고정형 케이블", link: `${base}/products/sub-fixed.html` },
            { name: "수중커넥터", link: `${base}/products/sub-connector.html` },
            { name: "커스텀케이블", link: `${base}/products/sub-custom.html` },
          ]
        : [
            { name: "Towed Underwater Cables", link: `${base}/products/sub-towed.html` },
            { name: "Fixed Underwater Cables", link: `${base}/products/sub-fixed.html` },
            { name: "Underwater Connectors", link: `${base}/products/sub-connector.html` },
            { name: "Custom Cables", link: `${base}/products/sub-custom.html` },
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
            { name: "Certificates", link: `${base}/pr/certification/index.html` },
            { name: "Catalog", link: `${base}/pr/catalog/index.html` },
          ];
    }

    // 고객지원
    if (p.includes("/support/")) {
      tabs = LANG === "kr"
        ? [
            { name: "1:1 문의", link: `${base}/support/inquiry/index.html` },
    //        { name: "자료실", link: `${base}/support/downloads/index.html` },
            { name: "기술지원", link: `${base}/support/Technical_support/index.html` },
            { name: "채용안내 및 지원", link: `${base}/support/recruit/index.html` },
          ]
        : [
            { name: "Inquiry", link: `${base}/support/inquiry/index.html` },
    //        { name: "Download", link: `${base}/support/downloads/index.html` },
            { name: "Technical Support", link: `${base}/support/Technical_support/index.html` },
          ];
    }

    showSideTabs(tabs, lv2);
  });

  document.querySelector(".breadcrumb")?.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(() => side.classList.remove("visible"), 150);
  });
}

/* ------------------------------------------------------------
   9) DOM 로드 후 실행
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  initAdminBar();
    await loadComponent("headerContainer", PATH.header);
    await loadComponent("footerContainer", PATH.footer);

  highlightTopMenu();
  initBreadcrumbTabs();

  setTimeout(() => {
    lv2Ready = true;
  }, 300);
});

window.addEventListener("load", () => {
  highlightBreadcrumb();
});
