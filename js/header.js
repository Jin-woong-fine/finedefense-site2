// ================================================
//  Fine Defense — Mobile Header Menu (Accordion)
// ================================================

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

  menuLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const isMobile = window.innerWidth <= 1024;

      if (!isMobile) return; // PC는 기본 hover

      const li = link.parentElement;
      const submenu = li.querySelector(".submenu");

      if (!submenu) return; // 서브 없는 경우는 이동 허용

      e.preventDefault(); // 모바일에서는 열기/닫기만

      // 이미 open이면 닫기
      if (li.classList.contains("open")) {
        li.classList.remove("open");
        return;
      }

      // 다른 메뉴 모두 닫기
      document.querySelectorAll(".main-menu li.open").forEach(openLi => {
        openLi.classList.remove("open");
      });

      // 현재 메뉴 열기
      li.classList.add("open");
    });
  });

  // PC에서는 모두 닫기
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      document.querySelectorAll(".main-menu li.open").forEach(li => {
        li.classList.remove("open");
      });
    }
  });
}

waitForHeader(initHeaderScript);
