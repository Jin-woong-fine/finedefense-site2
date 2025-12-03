// --------------------------------------------
// 🌐 Fine Defense Language Switch — Perfect Stable Version
// --------------------------------------------

function changeLanguage(lang) {
  let url = window.location.pathname;

  // 1) 현재 언어 제거
  url = url.replace(/^\/(kr|en)\//, "/");

  // 2) 새 언어 붙이기
  const newUrl = `/${lang}${url}`;

  window.location.href = newUrl;
}

// --------------------------------------------
// 🌐 Dropdown Init
// --------------------------------------------
function initLanguageDropdown() {
  const dropdown = document.querySelector(".language-dropdown");
  const toggle = document.querySelector(".lang-toggle");
  const links = document.querySelectorAll(".lang-list a");

  if (!dropdown || !toggle || !links.length) return false;

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      changeLanguage(a.dataset.lang);
    });
  });

  return true;
}

// --------------------------------------------
// 🔍 MutationObserver — header include 끝날 때까지 대기
// --------------------------------------------
function waitForHeader() {
  const ok = initLanguageDropdown();
  if (ok) return;

  const obs = new MutationObserver(() => {
    if (initLanguageDropdown()) obs.disconnect();
  });

  obs.observe(document.body, { childList: true, subtree: true });
}

waitForHeader();
