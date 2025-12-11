// ======================================================
//   Fine Defense — Mobile Fullscreen Overlay Menu
// ======================================================

// 헤더가 include.js로 로드될 때까지 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    const btn = document.querySelector(".mobile-menu-btn");
    const overlay = document.querySelector(".mobile-overlay");
    if (btn && overlay) {
      clearInterval(timer);
      callback();
    }
  }, 60); // 더 빠른 반응 속도
}

// ======================================================
//   초기화 함수
// ======================================================
function initHeaderScript() {
  const btn = document.querySelector(".mobile-menu-btn");
  const overlay = document.querySelector(".mobile-overlay");
  const submenuButtons = document.querySelectorAll(".m-item");
  const body = document.body;

  if (!btn || !overlay) return; // 안전 장치

  // -----------------------------
  //  오버레이 열기 / 닫기 함수
  // -----------------------------
  const openOverlay = () => {
    overlay.classList.add("open");
    body.style.overflow = "hidden";
  };

  const closeOverlay = () => {
    overlay.classList.remove("open");
    body.style.overflow = "";

    // 열린 아코디언 모두 닫기
    document.querySelectorAll(".m-sub.open").forEach(sub => {
      sub.classList.remove("open");
    });
  };

  // -----------------------------
  //  햄버거 클릭 → 열기
  // -----------------------------
  btn.addEventListener("click", openOverlay);

  // -----------------------------
  //  배경 클릭 → 닫기
  // -----------------------------
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  // -----------------------------
  //  아코디언 토글
  // -----------------------------
  submenuButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sub = button.nextElementSibling;

      // 다른 아코디언 닫기
      document.querySelectorAll(".m-sub.open").forEach(opened => {
        if (opened !== sub) opened.classList.remove("open");
      });

      // 현재 토글
      sub.classList.toggle("open");
    });
  });

  // -----------------------------
  //  PC 화면으로 전환 시 초기화
  //  (Debounce 적용)
  // -----------------------------
  let resizeTimer = null;

  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 1024) {
        closeOverlay();
      }
    }, 120);
  });
}

// 실행
waitForHeader(initHeaderScript);
