// /kr/js/include.js
// 공통 컴포넌트 로더 (header, footer, admin session bar 등)

document.addEventListener("DOMContentLoaded", () => {
  const includeTargets = document.querySelectorAll("[data-include]");
  if (!includeTargets.length) return;

  includeTargets.forEach((target) => {
    const url = target.getAttribute("data-include");
    if (!url) return;

    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        target.innerHTML = html;

        // 방금 삽입된 HTML 내부의 <script> 태그 다시 실행
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
      })
      .catch((err) => {
        console.error("include load error:", url, err);
      });
  });
});
