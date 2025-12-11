// ======================================================
//   Fine Defense — Mobile Fullscreen Overlay Menu (Final)
// ======================================================

// include.js 로딩 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    const btn = document.querySelector(".mobile-menu-btn");
    const overlay = document.querySelector(".mobile-overlay");
    const langToggle = document.querySelector(".lang-toggle");

    if (btn && overlay && langToggle) {
      clearInterval(timer);
      callback();
    }
  }, 60);
}

function initHeaderScript() {
  const btn = document.querySelector(".mobile-menu-btn");
  const overlay = document.querySelector(".mobile-overlay");
  const submenuButtons = document.querySelectorAll(".m-item");
  const body = document.body;
  const langDropdown = document.querySelector(".language-dropdown");

  if (!btn || !overlay) return;

  // -----------------------------
  //  오버레이 열기 (모바일 전용)
  // -----------------------------
  const openOverlay = () => {
    if (window.innerWidth > 1024) return;

    overlay.classList.add("open");
    body.style.overflow = "hidden";

    // 언어 드롭다운 강제 닫기
    if (langDropdown) langDropdown.classList.remove("open");
  };

  // -----------------------------
  //  오버레이 닫기
  // -----------------------------
  const closeOverlay = () => {
    overlay.classList.remove("open");
    body.style.overflow = "";
    submenuButtons.forEach(btn => btn.nextElementSibling.classList.remove("open"));
  };

  // 햄버거 → 오버레이 열기
  btn.addEventListener("click", openOverlay);

  // 배경 클릭 → 닫기
  overlay.addEventListener("click", (e) => {
    if (e.target.classList.contains("mobile-overlay")) {
      closeOverlay();
    }
  });

  // -----------------------------
  // 모바일 아코디언 메뉴
  // -----------------------------
  submenuButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sub = button.nextElementSibling;

      // 다른 열린 서브메뉴 모두 닫기
      document.querySelectorAll(".m-sub.open").forEach(opened => {
        if (opened !== sub) opened.classList.remove("open");
      });

      sub.classList.toggle("open");
    });
  });

  // 모바일 링크 클릭 시 메뉴 닫기
  document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", closeOverlay);
  });

  // -----------------------------
  // PC 전환 시 자동 초기화
  // -----------------------------
  const resetOnResize = () => {
    if (window.innerWidth > 1024) {
      closeOverlay();
    }
  };

  window.addEventListener("resize", resetOnResize);

  // -----------------------------
  // 언어 드롭다운 (PC/모바일 통합 안정화)
  // -----------------------------
  const langToggle = document.querySelector(".lang-toggle");
  const langList = document.querySelector(".lang-list");

  if (langToggle && langList) {
    langToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle("open");
    });

    // 외부 클릭 시 닫기
    document.addEventListener("click", () => {
      langDropdown.classList.remove("open");
    });
  }
}

waitForHeader(initHeaderScript);
