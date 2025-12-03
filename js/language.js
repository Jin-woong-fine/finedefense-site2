// --------------------------------------------
// 🌐 Fine Defense Language Switch (Perfect Final)
// --------------------------------------------

function changeLanguage(lang) {
  const path = window.location.pathname;

  // 🚫 이미 그 언어이면 중복 변환 금지 → 무한 kr/kr/kr 방지 핵심!!
  if (path.startsWith("/" + lang + "/")) return;

  const segments = path.split("/").filter(seg => seg.length > 0);

  // 첫 번째가 언어 폴더면 교체
  if (segments[0] === "kr" || segments[0] === "en") {
    segments[0] = lang;
  } else {
    // 아니라면 앞에 lang 붙임
    segments.unshift(lang);
  }

  const newUrl = "/" + segments.join("/");
  window.location.href = newUrl;
}

// --------------------------------------------
// 🌐 Language Dropdown Init
// --------------------------------------------

function initLanguageDropdown() {
  const dropdown = document.querySelector('.language-dropdown');
  const toggle = document.querySelector('.lang-toggle');
  const links = document.querySelectorAll('.lang-list a');

  if (!dropdown || !toggle || !links.length) return false;

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    dropdown.classList.toggle('open');
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
  });

  // 언어 선택
  links.forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      changeLanguage(a.dataset.lang);
    });
  });

  return true;
}

// --------------------------------------------
// 📌 헤더 include 완료 대기 후 자동 실행
// --------------------------------------------
function waitForHeader() {
  if (initLanguageDropdown()) return;

  const obs = new MutationObserver(() => {
    if (initLanguageDropdown()) obs.disconnect();
  });

  obs.observe(document.body, { childList: true, subtree: true });
}

waitForHeader();
