/* ============================================================
   🌐 Fine Defense NAV System — ULTRA-STABLE VERSION (2025)
   - Header/Footer Auto Load (KR/EN)
   - Active Menu Highlight
   - Breadcrumb SideTabs
   - Newsroom / Downloads 상세 Active Fix
   - AdminBar (Home / Dashboard / Logout)
   - Header + AdminBar Stack Fix
============================================================ */

let hideTimer = null;

/* ------------------------------------------------------------
   1) 언어 자동 감지
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
   4) 상단 메뉴 강조
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = location.pathname.toLowerCase();

  const MAP = LANG === "kr"
    ? [
        { k: "/company/", t: "회사소개" },
        { k: "/products/", t: "제품소개" },
        { k: "/product/", t: "제품소개" },
        { k: "/pr/", t: "홍보센터" },
        { k: "/support/", t: "고객지원" },
      ]
    : [
        { k: "/company/", t: "Company" },
        { k: "/products/", t: "Products" },
        { k: "/product/", t: "Products" },
        { k: "/pr/", t: "PR Center" },
        { k: "/support/", t: "Support" },
      ];

  document.querySelectorAll(".main-menu > li > a").forEach(a => {
    const txt = a.textContent.trim();
    if (MAP.some(m => path.includes(m.k) && m.t === txt)) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   5) Side Tabs 표시
------------------------------------------------------------ */
function showSideTabs(list, trigger) {
  const side = document.getElementById("side-tabs");
  const bc = document.querySelector(".breadcrumb");
  if (!side || !bc || !trigger) return;

  clearTimeout(hideTimer);

  side.innerHTML = list
    .map(t => `<a href="${t.link}" class="tab-item">${t.name}</a>`)
    .join("");

  const current = location.pathname.toLowerCase();

  side.querySelectorAll(".tab-item").forEach(a => {
    const href = new URL(a.href).pathname.toLowerCase();

    // 일반 경로 매칭
    if (current === href) a.classList.add("active");

    // PR > Newsroom 상세 페이지 → index.html 강조
    if (current.includes("/pr/newsroom/news-view") &&
        href.includes("/pr/newsroom/index.html")) {
      a.classList.add("active");
    }

    // Support > Downloads 상세 페이지 → index.html 강조
    if (current.includes("/support/downloads/") &&
        href.includes("/support/downloads/index.html")) {
      a.classList.add("active");
    }
  });

  const a = trigger.getBoundingClientRect();
  const b = bc.getBoundingClientRect();

  side.style.left = `${a.left - b.left}px`;
  side.style.top = `${a.bottom - b.top + 8}px`;
  side.classList.add("visible");
}

/* ------------------------------------------------------------
   6) Breadcrumb 탭 초기화
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
        { name: "고객지원", link: `${base}/support/` },
      ]
    : [
        { name: "Company", link: `${base}/company/overview.html` },
        { name: "Products", link: `${base}/products/sub-towed.html` },
        { name: "PR Center", link: `${base}/pr/newsroom/index.html` },
        { name: "Support", link: `${base}/support/` },
      ];

  /* --- 1단계 메뉴 --- */
  if (lv1) lv1.addEventListener("mouseenter", () => showSideTabs(TOP, lv1));

  /* --- 2단계 메뉴 --- */
  if (lv2) {
    lv2.addEventListener("mouseenter", () => {
      const p = location.pathname.toLowerCase();
      let tabs = [];

      /* 회사소개 */
      if (p.includes("/company/")) {
        tabs = LANG === "kr"
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

      /* 제품소개 */
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

      /* 홍보센터 */
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

      /* 고객지원 */
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
  }

  document.querySelector(".breadcrumb")?.addEventListener("mouseleave", scheduleHideTabs);
}

/* ------------------------------------------------------------
   7) Admin Bar
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

  const style = document.createElement("style");
  style.textContent = `
    #adminBar .admin-right { display:flex; align-items:center; }
    #adminBar .admin-btn {
      color:white;
      margin-left:16px;
      text-decoration:none;
      padding:6px 10px;
      border-radius:4px;
      white-space:nowrap;
      transition:0.2s;
    }
    #adminBar .admin-btn:hover { background:rgba(255,255,255,0.25); }
  `;
  document.head.appendChild(style);

  const header = document.querySelector("header.header-inner");
  if (header) header.style.marginTop = "48px";

  document.body.prepend(bar);

  document.getElementById("adminLogout").addEventListener("click", () => {
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
  });
}

/* ------------------------------------------------------------
   8) 초기화
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  highlightTopMenu();
  initBreadcrumbTabs();
  initAdminBar();
});

/* ------------------------------------------------------------
   9) SideTabs 자동 숨김
------------------------------------------------------------ */
function scheduleHideTabs() {
  const s = document.getElementById("side-tabs");
  if (!s) return;
  hideTimer = setTimeout(() => s.classList.remove("visible"), 150);
}
