// ===============================================
// 🌐 Fine Defense Language Switch (Stable Version)
// - inquiry 같은 깊은 경로에서도 안전하게 동작
// - /kr/kr/kr, /en/en 같은 중복 언어 경로 자동 정리
// ===============================================

// 🔧 1) 혹시 이미 /kr/kr/kr 이런 게 있다면 한 번에 접어서 정리
(function normalizeLangPath() {
  var p = window.location.pathname;

  // /kr/kr, /en/en 이런 반복 구간을 /kr, /en 하나로 줄이기
  // 예: /en/sub/support/inquiry/kr/kr/kr/index.html
  //  -> /en/sub/support/inquiry/kr/index.html
  var collapsed = p.replace(/^\/(kr|en)(\/\1)+/g, "/$1");

  if (collapsed !== p) {
    // 완전히 새로 고침해서 꼬인 상태를 한 번에 정리
    window.location.replace(collapsed + window.location.search + window.location.hash);
  }
})();

// 🔁 2) 언어 변경 함수 — 항상 "맨 앞 언어코드만 교체"
function changeLanguage(lang) {
  var path = window.location.pathname;

  // 현재 맨 앞에 /kr 또는 /en 이 붙어 있으면 제거
  // 예: /en/sub/support/inquiry/index.html -> /sub/support/inquiry/index.html
  path = path.replace(/^\/(kr|en)\//, "/");

  // 새 언어코드 붙이기
  // 예: /sub/support/inquiry/index.html -> /kr/sub/support/inquiry/index.html
  var newUrl = "/" + lang + path + window.location.search + window.location.hash;

  window.location.href = newUrl;
}

// 🎛 3) 언어 드롭다운 초기화
function initLanguageDropdown() {
  const dropdown = document.querySelector(".language-dropdown");
  if (!dropdown) return false;

  const toggle = dropdown.querySelector(".lang-toggle");
  const links  = dropdown.querySelectorAll(".lang-list a");

  if (!toggle || !links.length) return false;

  // 토글 클릭 → 열기/닫기
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // 바깥 클릭하면 닫기
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  // 언어 선택
  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = a.dataset.lang;
      if (!lang) return;
      changeLanguage(lang);
    });
  });

  return true;
}

// ⏳ 4) include.js가 헤더를 넣고 난 다음까지 기다렸다가 실행
function waitForHeaderAndInitLanguage() {
  if (initLanguageDropdown()) return; // 바로 성공하면 끝

  const observer = new MutationObserver(() => {
    if (initLanguageDropdown()) observer.disconnect();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

document.addEventListener("DOMContentLoaded", waitForHeaderAndInitLanguage);
