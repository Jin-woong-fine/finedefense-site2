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

    // 서브메뉴 없는 경우 스킵
    if (!submenu) return;

    // ----------------------------------------------
    // 📌 모바일 클릭으로 아코디언 열기
    // ----------------------------------------------
    link.addEventListener("click", (e) => {
      const isMobile = window.innerWidth <= 1024;

      if (!isMobile) return; // PC는 기본 이동

      // 모바일에서는 이동 막기
      e.preventDefault();

      // 현재 메뉴 상태 확인
      const willOpen = !li.classList.contains("open");

      // 모든 메뉴 닫기
      document.querySelectorAll(".main-menu > li").forEach(item => {
        item.classList.remove("open");
      });

      // 클릭한 항목만 열기
      if (willOpen) {
        li.classList.add("open");
      }
    });
  });

  // ----------------------------------------------
  // 📌 화면 크기 변경 시 메뉴 초기화
  // ----------------------------------------------
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      // PC 전환 시 아코디언 초기화
      document.querySelectorAll(".main-menu > li").forEach(li => {
        li.classList.remove("open");
      });
    }
  });
}

// include.js가 DOM에 header.html 삽입할 때까지 기다림
waitForHeader(initHeaderScript);
