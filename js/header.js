// ================================================
//  Fine Defense — Header Menu Controller
//  (PC: hover, Mobile: click-accordion)
// ================================================

// 헤더가 include로 로드되어도 안전하게 기다림
function waitForHeader(callback) {
  const timer = setInterval(() => {
    const menu = document.querySelector(".main-menu");
    if (menu) {
      clearInterval(timer);
      callback();
    }
  }, 80);
}

function initHeaderScript() {
  const menuItems = document.querySelectorAll(".main-menu > li");

  menuItems.forEach(li => {
    const link = li.querySelector("a");
    const submenu = li.querySelector(".submenu");

    if (!submenu) return; // 서브메뉴 없는 항목 스킵

    link.addEventListener("click", (e) => {
      const isMobile = window.innerWidth <= 1024;

      if (!isMobile) return; // PC에서는 기본 hover 유지

      e.preventDefault(); // 모바일에서는 링크 이동 막기

      const isOpen = li.classList.contains("open");

      // -------------------------
      // 🔥 모든 메뉴 닫기
      // -------------------------
      document.querySelectorAll(".main-menu > li.open").forEach(item => {
        item.classList.remove("open");
      });

      // -------------------------
      // 🔥 이미 열려있던 메뉴이면 닫기만 하고 끝
      // -------------------------
      if (isOpen) return;

      // -------------------------
      // 🔥 닫혀있던 메뉴는 열기
      // -------------------------
      li.classList.add("open");
    });
  });

  // -------------------------
  // 📌 화면 크기 변경 시 초기화
  // -------------------------
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      document.querySelectorAll(".main-menu > li.open").forEach(li => {
        li.classList.remove("open");
      });
    }
  });
}

// include.js로 header가 로드될 때까지 대기
waitForHeader(initHeaderScript);
