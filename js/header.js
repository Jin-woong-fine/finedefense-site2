// ======================================================
//   Fine Defense — Mobile Fullscreen Overlay Menu
// ======================================================

// 헤더가 include.js로 로드될 때까지 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    if (document.querySelector(".mobile-menu-btn") &&
        document.querySelector(".mobile-overlay")) {
      clearInterval(timer);
      callback();
    }
  }, 80);
}

function initHeaderScript() {
  const btn = document.querySelector(".mobile-menu-btn");
  const overlay = document.querySelector(".mobile-overlay");
  const submenuButtons = document.querySelectorAll(".m-item");
  const body = document.body;

  // -----------------------------------------------
  // 1) 햄버거 버튼 → 오버레이 열기
  // -----------------------------------------------
  btn.addEventListener("click", () => {
    overlay.classList.add("open");
    body.style.overflow = "hidden"; // 스크롤 방지
  });

  // -----------------------------------------------
  // 2) 오버레이 닫기 (배경 클릭 시)
  // -----------------------------------------------
  overlay.addEventListener("click", (e) => {
    if (e.target.classList.contains("mobile-overlay")) {
      closeOverlay();
    }
  });

  // -----------------------------------------------
  // 3) 아코디언 메뉴 동작
  // -----------------------------------------------
  submenuButtons.forEach(button => {
    button.addEventListener("click", () => {

      const sub = button.nextElementSibling;

      // 다른 모든 아코디언 닫기
      document.querySelectorAll(".m-sub.open").forEach(opened => {
        if (opened !== sub) opened.classList.remove("open");
      });

      // 현재 아코디언 토글
      sub.classList.toggle("open");
    });
  });

  // -----------------------------------------------
  // 4) PC로 전환 시 초기화
  // -----------------------------------------------
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeOverlay();
    }
  });

  function closeOverlay() {
    overlay.classList.remove("open");
    body.style.overflow = ""; // 스크롤 복원

    // 열려 있던 아코디언 모두 닫기
    document.querySelectorAll(".m-sub.open").forEach(sub => {
      sub.classList.remove("open");
    });
  }
}

waitForHeader(initHeaderScript);
