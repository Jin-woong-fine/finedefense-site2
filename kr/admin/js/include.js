/**
 * include.js - 공통 Header/Footer 로더
 * 대기업 서비스 방식: HTML 로딩 → DOM 삿입 → 내부 script 재실행
 */
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(async (target) => {
    const url = target.dataset.include;
    if (!url) return;

    try {
      const res = await fetch(url);
      const html = await res.text();

      // 1) HTML 삽입
      target.innerHTML = html;

      // 2) 삽입된 HTML 내부 script 재실행
      const scripts = target.querySelectorAll("script");

      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");

        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }

        document.body.appendChild(newScript);
      });
    } catch (err) {
      console.error("include load error:", url, err);
    }
  });
});
