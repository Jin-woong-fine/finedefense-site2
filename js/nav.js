/* ============================================================
   ✅ Fine Defense 통합 네비게이션 (회사소개 / 제품소개 / 기타)
   ============================================================ */

let hideTimer = null;

/* ------------------------------------------------------------
   🔹 위치 기반 탭 표시
------------------------------------------------------------ */
function showSideTabs(tabList, target) {
  const side = document.getElementById("side-tabs");
  const breadcrumb = document.querySelector(".breadcrumb");
  if (!side || !target || !breadcrumb) return;

  clearTimeout(hideTimer);

  // 탭 구성
  side.innerHTML = tabList
    .map(tab => `<a href="${tab.link}" class="tab-item">${tab.name}</a>`)
    .join("");

  const current = window.location.pathname.toLowerCase();
  const isTopTabs = target.classList.contains("crumb-level1");

  side.querySelectorAll(".tab-item").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (!href) return;

    if (isTopTabs) {
      // 상위탭(active)
      if (current.includes("/product/") && href.includes("/product/")) {
        a.classList.add("active");
      } else if (current.includes("/company/") && href.includes("/company/")) {
        a.classList.add("active");
      } else if (current.includes("/pr/") && href.includes("/pr/")) {
        a.classList.add("active");
      } else if (current.includes("/support/") && href.includes("/support/")) {
        a.classList.add("active");
      }
    } else {
      const absHref = new URL(href, location.origin).pathname.toLowerCase();

      // URL 완전 일치
      if (current === absHref) a.classList.add("active");

      // 상세페이지 → 뉴스룸 탭 active
      else if (
        current.includes("/pr/newsroom/post_template") &&
        href.includes("/pr/newsroom/newsroom.html")
      ) {
        a.classList.add("active");
      }
    }
  });

  // 위치 계산
  const rect = target.getBoundingClientRect();
  const parentRect = breadcrumb.getBoundingClientRect();
  side.style.position = "absolute";
  side.style.left = `${rect.left - parentRect.left}px`;
  side.style.top = `${rect.bottom - parentRect.top + 8}px`;
  side.classList.add("visible");
}


/* ------------------------------------------------------------
   🔹 탭 숨김 (지연 닫기)
------------------------------------------------------------ */
function scheduleHideTabs() {
  hideTimer = setTimeout(() => {
    const side = document.getElementById("side-tabs");
    if (side) side.classList.remove("visible");
  }, 250);
}

/* ------------------------------------------------------------
   🔹 상단 메뉴 강조
------------------------------------------------------------ */
function highlightTopMenu() {
  const path = window.location.pathname;
  const menuMap = [
    { keyword: "/company/", label: "회사소개" },
    { keyword: "/product/", label: "제품소개" },
    { keyword: "/pr/", label: "홍보센터" },
    { keyword: "/support/", label: "고객지원" },
  ];

  const activeMenu = menuMap.find(m => path.includes(m.keyword));
  if (!activeMenu) return;

  const topLinks = document.querySelectorAll(".main-menu > li > a");
  topLinks.forEach(a => {
    if (a.textContent.trim() === activeMenu.label) {
      a.classList.add("active");
    }
  });
}

/* ------------------------------------------------------------
   🔹 header / footer 로드 및 초기화
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ nav.js loaded");

  // header 로드
  fetch("/kr/components/header.html")
    .then(res => {
      if (!res.ok) throw new Error("❌ header.html not found");
      return res.text();
    })
    .then(html => {
      const headerEl = document.getElementById("header");
      if (!headerEl) throw new Error("❌ #header element missing");

      headerEl.innerHTML = html;

      // 언어 스크립트 로드
      const langScript = document.createElement("script");
      langScript.src = "/kr/js/language.js";
      document.body.appendChild(langScript);

      setTimeout(() => {
        initBreadcrumbTabs();
        highlightTopMenu();
      }, 300);
    })
    .catch(err => console.error(err));

  // footer 로드
  fetch("/kr/components/footer.html")
    .then(res => {
      if (!res.ok) throw new Error("❌ footer.html not found");
      return res.text();
    })
    .then(html => {
      const footerEl = document.getElementById("footer");
      if (!footerEl) throw new Error("❌ #footer element missing");
      footerEl.innerHTML = html;
    })
    .catch(err => console.error(err));
});

/* ------------------------------------------------------------
   🔹 breadcrumb 탭 이벤트
------------------------------------------------------------ */
function initBreadcrumbTabs() {
  const topTabs = [
    { name: "회사소개", link: "/kr/sub/company/overview.html" },
    { name: "제품소개", link: "/kr/sub/product/towed-cable.html" },
    { name: "홍보센터", link: "/kr/sub/pr/newsroom/newsroom.html" },
    { name: "고객지원", link: "/kr/sub/support/" },
  ];

  const level1 = document.querySelector(".crumb-level1");
  const level2 = document.querySelector(".crumb-level2");
  const breadcrumb = document.querySelector(".breadcrumb");
  const sideTabs = document.getElementById("side-tabs");

  if (!breadcrumb || !sideTabs) return;

  sideTabs.classList.remove("visible");

  // 상위 탭 hover 시
  if (level1)
    level1.addEventListener("mouseenter", () => showSideTabs(topTabs, level1));

  // 2단계 탭 hover 시
  if (level2) {
    level2.addEventListener("mouseenter", () => {
      const path = location.href.toLowerCase();
      let subTabs = [];

      /* -------------------------
         🔥 회사소개
      ------------------------- */
      if (path.includes("/company/")) {
        subTabs = [
          { name: "기업개요", link: "/kr/sub/company/overview.html" },
          { name: "CEO 인사말", link: "/kr/sub/company/ceo.html" },
          { name: "기업이념 및 비전", link: "/kr/sub/company/vision.html" },
          { name: "연혁", link: "/kr/sub/company/history.html" },
          { name: "조직도", link: "/kr/sub/company/organization.html" },
          { name: "찾아오시는 길", link: "/kr/sub/company/location.html" },
        ];
      }

      /* -------------------------
         🔥 제품소개
      ------------------------- */
      else if (path.includes("/product/")) {
        subTabs = [
          { name: "수중이동형케이블", link: "/kr/sub/product/towed-cable.html" },
          { name: "수중고정형케이블", link: "/kr/sub/product/underwater-fixed-cable.html" },
          { name: "수중커넥터", link: "/kr/sub/product/underwater-connector.html" },
          { name: "커스텀케이블", link: "/kr/sub/product/custom-cable.html" },
        ];
      }

      /* -------------------------
         🔥 홍보센터(뉴스룸/공지/갤러리/인증/카탈로그)
         ※ 상세페이지는 뉴스룸만 고정
      ------------------------- */
      else if (path.includes("/pr/")) {
        
        // 상세페이지
        if (path.includes("/pr/newsroom/post_template")) {
          subTabs = [
            { name: "뉴스룸", link: "/kr/sub/pr/newsroom/newsroom.html" }
          ];
        }

        // PR 전체 페이지
        else {
          subTabs = [
            { name: "뉴스룸", link: "/kr/sub/pr/newsroom/newsroom.html" },
            { name: "공지사항", link: "/kr/sub/pr/notice/notice.html" },
            { name: "갤러리", link: "/kr/sub/pr/gallery/gallery.html" },
            { name: "인증 및 특허", link: "/kr/sub/pr/cert/cert.html" },
            { name: "카탈로그", link: "/kr/sub/pr/catalog/catalog.html" },
          ];
        }
      }

      /* -------------------------
         🔥 고객지원
      ------------------------- */
      else if (path.includes("/support/")) {
        subTabs = [
          { name: "자료실", link: "/kr/sub/support/download.html" },
          { name: "문의하기", link: "/kr/sub/support/contact.html" },
        ];
      }

      showSideTabs(subTabs, level2);
    });
  }

  // hover 해제 시 숨김
  breadcrumb.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  breadcrumb.addEventListener("mouseleave", scheduleHideTabs);
  sideTabs.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  sideTabs.addEventListener("mouseleave", scheduleHideTabs);
}
