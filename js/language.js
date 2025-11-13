// ------------------------------------------
// 🌐 Fine Defense Language Dropdown Switch
// ------------------------------------------

function initLanguageDropdown() {
  const dropdown = document.querySelector('.language-dropdown');
  const toggle = document.querySelector('.lang-toggle');
  const links = document.querySelectorAll('.lang-list a');

  if (!dropdown || !toggle || links.length === 0) return false;

  // 🔹 토글 클릭 시 열기/닫기
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // 🔹 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
  });

  // 🔹 언어 전환 처리
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

// ✅ fetch된 header 로드 후 반복 확인
const langInitTimer = setInterval(() => {
  if (initLanguageDropdown()) clearInterval(langInitTimer);
}, 200);

function changeLanguage(lang) {
  const path = window.location.pathname;
  const segments = path.split("/");

  // kr/en 폴더 교체 로직
  if (segments.includes("kr")) {
    segments[segments.indexOf("kr")] = lang;
  } else if (segments.includes("en")) {
    segments[segments.indexOf("en")] = lang;
  } else {
    segments.splice(1, 0, lang);
  }

  const newUrl = segments.join("/");
  window.location.href = newUrl;
}
