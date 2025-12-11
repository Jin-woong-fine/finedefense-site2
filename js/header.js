// ================================================
//  Fine Defense — Mobile Header Menu (Accordion)
// ================================================

// 헤더 로드 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    if (document.querySelector(".main-menu")) {
      clearInterval(timer);
      callback();
    }
  }, 80);
}

function initHeaderScript() {
  const menuLinks = document.querySelectorAll(".main-menu > li > a");
  const panel = document.querySelector(".mobile-menu-panel"); // 모바일 패널

  menuLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const isMobile = window.innerWidth <= 1024;

      if (!isMobile) return; // PC에서는 기본 hover

      // 패널이 닫혀 있으면 아코디언 실행하지 않음 (중요!)
      if (panel && !panel.classList.contains("open")) return;

      const li = link.parentElement;
      const submenu = li.querySelector(".submenu");

      if (!submenu) return; // 서브 없는 경우는 이동 허용

      e.preventDefault(); // 모바일에서는 열기/닫기만

      // 이미 열려있으면 닫기
      if (li.classList.contains("open")) {
        li.classList.remove("open");
        return;
      }

      // 다른 모든 open 닫기
      document.querySelectorAll(".main-menu li.open").forEach(openLi => {
        openLi.classList.remove("open");
      });

      // 현재 li 열기
      li.classList.add("open");
    });
  });

  // PC로 전환시 초기화
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      document.querySelectorAll(".main-menu li.open").forEach(li => {
        li.classList.remove("open");
      });
    }
  });
}

waitForHeader(initHeaderScript);
