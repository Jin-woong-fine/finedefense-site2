// ======================================================
// 📌 HEADER.JS — Fine Defense 공통 헤더 스크립트
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  // ==============================================
  // 1) 모바일 햄버거 메뉴 열기 / 닫기
  // ==============================================
  const hamburger = document.querySelector(".hamburger");
  const mainMenu = document.querySelector(".main-menu");

  if (hamburger && mainMenu) {
    hamburger.addEventListener("click", () => {
      mainMenu.classList.toggle("show");
      hamburger.classList.toggle("active");
      document.body.classList.toggle("menu-open"); // 스크롤 막기용
    });
  }

  // ==============================================
  // 2) 모바일 서브메뉴 아코디언
  // ==============================================
  const menuItems = document.querySelectorAll(".main-menu > li");

  menuItems.forEach((li) => {
    li.addEventListener("click", (e) => {
      // PC에서는 무시
      if (window.innerWidth > 1024) return;

      // 이미 열려있으면 닫기
      if (li.classList.contains("open")) {
        li.classList.remove("open");
      } else {
        // 다른 메뉴 닫기 (아코디언 방식)
        menuItems.forEach(item => item.classList.remove("open"));
        li.classList.add("open");
      }

      e.stopPropagation();
    });
  });

  // ==============================================
  // 3) 화면 크기 변경 시 모바일 메뉴 초기화
  // ==============================================
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      mainMenu?.classList.remove("show");
      hamburger?.classList.remove("active");
      document.body.classList.remove("menu-open");
      menuItems.forEach(item => item.classList.remove("open"));
    }
  });
});
