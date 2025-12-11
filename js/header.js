// ================================================
//  Fine Defense — Header Controller (Full Toggle Fix)
// ================================================

// include로 header가 로드될 때까지 대기
function waitForHeader(callback) {
  const timer = setInterval(() => {
    if (document.querySelector(".main-menu")) {
      clearInterval(timer);
      callback();
    }
  }, 80);
}

function initHeaderScript() {
  const menuItems = document.querySelectorAll(".main-menu > li > a");

  menuItems.forEach(aTag => {
    aTag.addEventListener("click", (e) => {
      const isMobile = window.innerWidth <= 1024;

      if (!isMobile) return; // PC는 클릭 영향 없음(hover 로 동작)

      const li = aTag.parentElement;
      const submenu = li.querySelector(".submenu");

      if (!submenu) return; // 서브메뉴 없는 경우 allow link

      e.preventDefault(); // 링크 이동 막기

      // 🔥 이미 열려있으면 닫기
      if (li.classList.contains("open")) {
        li.classList.remove("open");
        return; // 여기서 끝! (닫힘)
      }

      // 🔥 열려 있지 않으면 다른 서브메뉴 닫고 이것만 열기
      document.querySelectorAll(".main-menu > li.open").forEach(openLi => {
        openLi.classList.remove("open");
      });

      li.classList.add("open");
    });
  });

  // PC 사이즈로 돌아오면 모두 초기화
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      document.querySelectorAll(".main-menu > li.open").forEach(li => {
        li.classList.remove("open");
      });
    }
  });
}

waitForHeader(initHeaderScript);
