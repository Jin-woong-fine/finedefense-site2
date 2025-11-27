/* ============================================================
   🌐 Fine Defense NAV System — ULTRA-STABLE FINAL EDITION (2025)
   ------------------------------------------------------------
   - Header/Footer Auto Load
   - Top Menu Active (href 기반, 완전 안정)
   - Breadcrumb / SideTabs (PR·Support 상세 active fix)
   - AdminBar (Home / Dashboard / Logout)
   - Header + AdminBar Stack Fix (절대 겹치지 않음)
   - Load 순서 / 비동기 문제 완전 해결
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
   3) 컴포넌트 로딩
------------------------------------------------------------ */
async function loadComponent(targetId, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + " not found");
    const html = await res.text();
    const el = document.getElementById(targetId);
    if (el) el.innerHTML = html;
  } catch (err) {
    console.error("Component Load Error:", err);
  }
}

/* ------------------------------------------------------------
   4) Top Menu Active (href 기반 완전 안정)
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

    if (current === href) a.classList.add("active");

    // Newsroom 상세
    if (current.includes("/pr/newsroom/news-view") &&
        href.includes("/pr/newsroom/index.html")) {
      a.classList.add("active");
    }

    // Gallery 상세
    if (current.includes("/pr/gallery/gallery-view") &&
        href.includes("/pr/gallery/index.html")) {
      a.classList.add("active");
    }

    // Certification 상세
    if (current.includes("/pr/certification/certification-view") &&
        href.includes("/pr/certification/index.html")) {
      a.classList.add("active");
    }

    // Catalog 상세
    if (current.includes("/pr/catalog/catalog-view") &&
        href.includes("/pr/catalog/index.html")) {
      a.classList.add("active");
    }

    // Downloads 상세
    if (current.includes("/support/downloads/downloads-view") &&
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
   6) Breadcrumb Tabs 초기화
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const lv1 = document.querySelector(".crumb-level1");
  const lv2 = document.querySelector(".crumb-level2");
  const side = document.getElementById("side-tabs");
  const base = `/${LANG}/sub`;

  if (!side) return;

  /* --- 1단계 대분류 탭 --- */
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

  if (lv1) lv1.addEventListener("mouseenter", () => showSideTabs(TOP, lv1));

  /* --- 2단계 서브 탭 --- */
  if (lv2) {
    lv2.addEventListener("mouseenter", () => {
      const p = location.pathname.toLowerCase();
      let tabs = [];

      // 회사소개
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
              { name: "자료실",  link: `${base}/support/downloads/index.html` },
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
   7) AdminBar
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
    top:0;
    left:0;
    z-index:9999;
    font-size:14px;
  `;

  document.body.prepend(bar);

  document.getElementById("adminLogout").addEventListener("click", () => {
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
  });
}

/* ------------------------------------------------------------
   8) Header가 adminBar와 겹치지 않게 보정
------------------------------------------------------------ */
function applyAdminBarMargin() {
  const bar = document.getElementById("adminBar");
  if (!bar) return;

  const header =
    document.querySelector("header") ||
    document.querySelector("header.header-inner") ||
    document.getElementById("header");

  if (header) {
    header.style.marginTop = bar.offsetHeight + "px";
  }
}

/* ------------------------------------------------------------
   9) 초기화
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", PATH.header);
  await loadComponent("footer", PATH.footer);

  initAdminBar();
  applyAdminBarMargin();

  highlightTopMenu();
  initBreadcrumbTabs();

  // 비동기 로드로 놓친 요소들 재보정
  setTimeout(() => {
    applyAdminBarMargin();
    highlightTopMenu();
  }, 30);
});

/* ------------------------------------------------------------
   10) SideTabs 자동 숨김
------------------------------------------------------------ */
function scheduleHideTabs() {
  const s = document.getElementById("side-tabs");
  if (!s) return;
  hideTimer = setTimeout(() => s.classList.remove("visible"), 150);
}
