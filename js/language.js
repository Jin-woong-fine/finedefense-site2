// ---------------------------------------------------------
// 🌐 Fine Defense Language Switch — FINAL VERSION (2025.12)
// ---------------------------------------------------------

// initial load 시 언어코드 자동 보정 (중복 방지)
(function fixInitialLanguage() {
  const path = location.pathname;

  // 이미 /kr/ 또는 /en/으로 시작한다면 → 아무 것도 안 함 (중복 방지)
  if (path.startsWith("/kr/") || path.startsWith("/en/")) return;

  // 접두사가 없을 경우 → 브라우저 언어 기반으로 1회 보정
  const browserLang = navigator.language.startsWith("ko") ? "kr" : "en";

  // URL 보정
  location.replace(`/${browserLang}${path}`);
})();

// ---------------------------------------------------------
// 🔻 언어 드롭다운 초기화
// ---------------------------------------------------------
function initLanguageDropdown() {
  const dropdown = document.querySelector('.language-dropdown');
  const toggle = document.querySelector('.lang-toggle');
  const links = document.querySelectorAll('.lang-list a');

  if (!dropdown || !toggle || links.length === 0) return false;

  // 🔹 드롭다운 토글
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

  // 🔹 언어버튼 클릭 → changeLanguage 실행
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

// ---------------------------------------------------------
// 🌐 언어 변경 함수 (URL 분석 후 안전 변환)
// ---------------------------------------------------------
function changeLanguage(lang) {
  const path = window.location.pathname;
  let segments = path.split("/").filter(seg => seg.length > 0);

  // 🔥 무한중복 방지: 기존 URL에서 반복되는 kr/en 제거
  segments = segments.filter((seg, idx) => {
    const lower = seg.toLowerCase();
    if ((lower === "kr" || lower === "en") && idx > 0) {
      return false;  // 첫 위치 외에는 제거
    }
    return true;
  });

  // 🔥 첫 위치의 언어코드 교체 or 삽입
  if (segments[0] === "kr" || segments[0] === "en") {
    segments[0] = lang;
  } else {
    segments.unshift(lang);
  }

  // 🔥 최종 URL 생성
  const newUrl = "/" + segments.join("/");
  window.location.href = newUrl;
}

// ---------------------------------------------------------
// ⏳ Header 포함될 때까지 대기 후 초기화
// ---------------------------------------------------------
function waitForHeaderAndInit() {
  if (initLanguageDropdown()) return;

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
