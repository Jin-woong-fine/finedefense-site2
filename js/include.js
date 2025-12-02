// /js/include.js — 완전 정리본 (공백 완벽 제거)
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(el => {
    const url = el.getAttribute("data-include");
    if (!url) return;

    fetch(url)
      .then(res => res.text())
      .then(html => {
        // placeholder를 대체하고 공백 제거
        const parent = el.parentNode;
        const temp = document.createElement("div");
        temp.innerHTML = html;

        // include 요소를 실제 콘텐츠로 교체
        while (temp.firstChild) {
          parent.insertBefore(temp.firstChild, el);
        }
        parent.removeChild(el); // placeholder 제거
      })
      .catch(err => console.error("include error:", url, err));
  });
});
