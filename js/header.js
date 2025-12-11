// ======================================================
//  HEADER.JS — include.js 로딩 이후에도 100% 작동하도록 개선된 버전
// ======================================================

// 헤더 컴포넌트 로드 완료를 기다렸다가 실행
function waitForHeader(callback) {
  const check = setInterval(() => {
    const hamburger = document.querySelector(".hamburger");
    const mainMenu = document.querySelector(".main-menu");

    if (hamburger && mainMenu) {
      clearInterval(check);
      callback(); // 실행
    }
  }, 100); // 0.1초 간격으로 확인
}

// 메인 기능 정의
function initHeader() {
  const hamburger = document.querySelector(".hamburger");
  const mainMenu = document.querySelector(".main-menu");
  const menuItems = document.querySelectorAll(".main-menu > li");

  if (!hamburger || !mainMenu) return;

  // --------------------------------------------------
  // 📌 1) 모바일 햄버거 메뉴 토글
  // --------------------------------------------------
  hamburger.addEventListener("click", () => {
    mainMenu.classList.toggle("show");
    hamburger.classList.toggle("active");

    // 메뉴 열릴 때 스크롤 막기
    document.body.classList.toggle("menu-open");
  });

  // --------------------------------------------------
  // 📌 2) 모바일 서브메뉴 아코디언 기능
  // --------------------------------------------------
  menuItems.forEach(li => {
    li.addEventListener("click", (e) => {
      // PC에서는 적용 X
      if (window.innerWidth > 1024) return;

      // 다른 메뉴 닫고 현재 메뉴 열기
      const isOpen = li.classList.contains("open");
      menuItems.forEach(item => item.classList.remove("open"));
      if (!isOpen) li.classList.add("open");

      e.stopPropagation();
    });
  });

  // --------------------------------------------------
  // 📌 3) 화면 크기 변경 → 초기화
  // --------------------------------------------------
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      mainMenu.classList.remove("show");
      hamburger.classList.remove("active");
      document.body.classList.remove("menu-open");

      menuItems.forEach(item => item.classList.remove("open"));
    }
  });
}

// include 로드 이후 자동 실행
waitForHeader(initHeader);
