// ---------------------------------------------------------
// 🌐 Fine Defense Language Dropdown Switch (Final Version)
// ---------------------------------------------------------

function initLanguageDropdown() {
  const dropdown = document.querySelector('.language-dropdown');
  const toggle = document.querySelector('.lang-toggle');
  const links = document.querySelectorAll('.lang-list a');

  if (!dropdown || !toggle || links.length === 0) return false;

  // 🔹 토글 클릭 → 드롭다운 열기/닫기
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // 🔹 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // 🔹 언어 선택 → 페이지 이동
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = link.dataset.lang;
      changeLanguage(lang);
    });
  });

  console.log("✅ Language dropdown initialized");
  return true;
}

// ---------------------------------------
// 🌐 언어 변경 (경로 분석 → 자동 교체)
// ---------------------------------------
function changeLanguage(lang) {
  const path = window.location.pathname;
  const segments = path.split("/").filter(seg => seg.length > 0); // 빈 문자열 제거
  
  // kr/en 폴더 교체
  if (segments[0] === "kr" || segments[0] === "en") {
    segments[0] = lang;
  } else {
    segments.unshift(lang);
  }

  // URL 재조합
  const newUrl = "/" + segments.join("/");
  window.location.href = newUrl;
}

// ------------------------------------------------------------
// ⏳ 헤더 Include 완료를 자동 감지해서 init 실행
// ------------------------------------------------------------
function waitForHeaderAndInit() {
  if (initLanguageDropdown()) return;

  // DOM 변화 감지 (MutationObserver 사용) ← 강력한 방식
  const observer = new MutationObserver(() => {
    if (initLanguageDropdown()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

waitForHeaderAndInit();
