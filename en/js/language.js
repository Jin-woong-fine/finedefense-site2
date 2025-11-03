// ------------------------------------------
// 🌐 NAVER-style Language Dropdown Switch
// ------------------------------------------

const langDropdown = document.querySelector('.language-dropdown');
const langToggle = document.querySelector('.lang-toggle');
const langLinks = document.querySelectorAll('.lang-list a');

// ▼ 열기 / 닫기
if (langToggle) {
  langToggle.addEventListener('click', (e) => {
    e.preventDefault();
    langDropdown.classList.toggle('open');
  });
}

// ▼ 외부 클릭 시 닫기
document.addEventListener('click', (e) => {
  if (!langDropdown.contains(e.target)) {
    langDropdown.classList.remove('open');
  }
});

// ▼ 언어 전환
langLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetLang = link.dataset.lang;
    changeLanguage(targetLang);
  });
});

function changeLanguage(lang) {
  const path = window.location.pathname;
  let file = path.substring(path.lastIndexOf('/') + 1);
  if (file === '' || file === '/') file = 'index.html';

  const parts = path.split('/');
  parts.pop(); // 파일명 제거
  parts.pop(); // 언어 폴더 제거
  const base = parts.join('/') || '/';

  let newUrl = '';
  if (lang === 'kor') {
    newUrl = `${base}/kr/${file}`;
  } else {
    newUrl = `${base}/en/${file}`;
  }

  newUrl = newUrl.replace(/\/+/g, '/');
  window.location.href = newUrl;
}

document.querySelectorAll('.lang-list a').forEach(langLink => {
  langLink.addEventListener('click', (e) => {
    e.preventDefault();
    const lang = langLink.dataset.lang;

    if (lang === 'kor') window.location.href = '/kr/index.html';
    if (lang === 'eng') window.location.href = '/en/index.html';
  });
});