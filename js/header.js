// ======================================================
//   Fine Defense — Mobile Fullscreen Overlay Menu (Final)
// ======================================================

// include.js 로딩 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    const btn = document.querySelector(".mobile-menu-btn");
    const overlay = document.querySelector(".mobile-overlay");
    if (btn && overlay) {
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

  if (!btn || !overlay) return;

  // -----------------------------
  //  오버레이 열기 (모바일 전용)
  // -----------------------------
  const openOverlay = () => {
    if (window.innerWidth > 1024) return; // 🔥 PC에서는 절대 안 열림
    overlay.classList.add("open");
    body.style.overflow = "hidden";
  };

  // -----------------------------
  //  오버레이 닫기
  // -----------------------------
  const closeOverlay = () => {
    overlay.classList.remove("open");
    body.style.overflow = "";

    document.querySelectorAll(".m-sub.open").forEach(sub => {
      sub.classList.remove("open");
    });
  };

  // 햄버거 → 오버레이 열기
  btn.addEventListener("click", openOverlay);

  // 배경 클릭 → 닫기
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  // 아코디언
  submenuButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sub = button.nextElementSibling;

      document.querySelectorAll(".m-sub.open").forEach(opened => {
        if (opened !== sub) opened.classList.remove("open");
      });

      sub.classList.toggle("open");
    });
  });

  // 모바일 서브메뉴 링크 클릭 → 닫기
  document.querySelectorAll(".mobile-menu a").forEach(link => {
    link.addEventListener("click", closeOverlay);
  });

  // PC 전환 시 자동 초기화
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeOverlay();
    }
  });
}

waitForHeader(initHeaderScript);
