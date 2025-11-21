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
  scriptLang: `/js/language.js`,   // 🔥 공통 경로로 고정 (language.js 오류 해결)
};

/* ------------------------------------------------------------
   🌐 Fetch Helper
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
        { keyword: "/products/", label: "제품소개" },
        { keyword: "/product/", label: "제품소개" },
        { keyword: "/pr/", label: "홍보센터" },
        { keyword: "/support/", label: "고객지원" },
      ]
    : [
        { keyword: "/company/", label: "Company" },
        { keyword: "/products/", label: "Products" },
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
      if (current.includes("/products/") && href.includes("/products/")) a.classList.add("active");
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
        { name: "제품소개", link: "/kr/sub/products/sub-towed.html" },
        { name: "홍보센터", link: "/kr/sub/pr/newsroom/newsroom.html" },
        { name: "고객지원", link: "/kr/sub/support/" },
      ]
    : [
        { name: "Company", link: "/en/sub/company/overview.html" },
        { name: "Products", link: "/en/sub/products/sub-towed.html" },
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

      /* -------------------------------
        📌 제품소개
      --------------------------------*/
      if (path.includes("/products/") || path.includes("/product/")) {
        subTabs = LANG === "kr"
          ? [
              { name: "수중이동형케이블", link: "/kr/sub/products/sub-towed.html" },
              { name: "수중고정형케이블", link: "/kr/sub/products/sub-fixed.html" },
              { name: "수중커넥터", link: "/kr/sub/products/sub-connector.html" },
              { name: "커스텀케이블", link: "/kr/sub/products/sub-custom.html" },
            ]
          : [
              { name: "Towed Cable", link: "/en/sub/products/sub-towed.html" },
              { name: "Fixed Underwater Cable", link: "/en/sub/products/sub-fixed.html" },
              { name: "Underwater Connector", link: "/en/sub/products/sub-connector.html" },
              { name: "Custom Cable", link: "/en/sub/products/sub-custom.html" },
            ];
      }

      /* -------------------------------
        📌 회사소개
      --------------------------------*/
      if (path.includes("/company/")) {
        const base = `/${LANG}/sub/company`;
        subTabs = LANG === "kr"
          ? [
              { name: "기업개요", link: `${base}/overview.html` },
              { name: "CEO 인사말", link: `${base}/ceo.html` },
              { name: "기업이념 및 비전", link: `${base}/vision.html` },
              { name: "연혁", link: `${base}/history.html` },
              { name: "조직도", link: `${base}/organization.html` },
              { name: "찾아오시는 길", link: `${base}/location.html` },
            ]
          : [
              { name: "Overview", link: `${base}/overview.html` },
              { name: "CEO Message", link: `${base}/ceo.html` },
              { name: "Mission & Vision", link: `${base}/vision.html` },
              { name: "History", link: `${base}/history.html` },
              { name: "Organization", link: `${base}/organization.html` },
              { name: "Location", link: `${base}/location.html` },
            ];
      }

      /* -------------------------------
        📌 홍보센터 (PR) → 5개
      --------------------------------*/
      if (path.includes("/pr/")) {
        const base = `/${LANG}/sub/pr`;

        subTabs = LANG === "kr"
          ? [
              { name: "공지사항", link: `${base}/notice/notice.html` },
              { name: "뉴스룸", link: `${base}/newsroom/newsroom.html` },
              { name: "갤러리", link: `${base}/gallery/gallery.html` },
              { name: "인증 및 특허", link: `${base}/cert/cert.html` },
              { name: "카탈로그", link: `${base}/catalog/catalog.html` },
            ]
          : [
              { name: "Notice", link: `${base}/notice/index.html` },
              { name: "Newsroom", link: `${base}/newsroom/newsroom.html` },
              { name: "Gallery", link: `${base}/gallery/gallery.html` },
              { name: "Certificates", link: `${base}/cert/cert.html` },
              { name: "Catalog", link: `${base}/catalog/catalog.html` },
            ];
      }

      /* -------------------------------
        📌 고객지원 (Support) → 2개
      --------------------------------*/
      if (path.includes("/support/")) {
        const base = `/${LANG}/sub/support`;

        subTabs = LANG === "kr"
          ? [
              { name: "1:1 문의", link: `${base}/inquiry.html` },
              { name: "자료실", link: `${base}/download.html` },
            ]
          : [
              { name: "Contact", link: `${base}/inquiry.html` },
              { name: "Downloads", link: `${base}/download.html` },
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

  // superadmin + admin만 표시
  if (!["admin", "superadmin"].includes(role) || !token) {
    return;
  }

  const adminBar = document.createElement("div");
  adminBar.id = "adminBar";

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
    localStorage.clear();
    location.href = `/${LANG}/admin/login.html`;
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
   🔹 사이드 탭 자동 숨김
------------------------------------------------------------ */
function scheduleHideTabs() {
  const side = document.getElementById("side-tabs");
  if (!side) return;

  hideTimer = setTimeout(() => {
    side.classList.remove("visible");
  }, 200);
}
