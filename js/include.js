// /js/include.js

document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(async (el) => {
    const url = el.getAttribute("data-include");
    if (!url) return;

    try {
      const res = await fetch(url);
      const html = await res.text();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      // include된 요소를 현재 위치에 삽입
      while (temp.firstChild) {
        el.parentNode.insertBefore(temp.firstChild, el);
      }

      // ★ placeholder 제거 → 공백 제거 핵심!
      el.remove();
    } catch (err) {
      console.error("include error:", url, err);
    }
  });

  // include 완료 신호 (옵션)
  setTimeout(() => {
    document.dispatchEvent(new Event("includeLoaded"));
  }, 20);
});
