// /js/include.js

document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(async (el) => {
    const url = el.getAttribute("data-include");
    if (!url) return;

    try {
      // ★ admin bar 먼저 처리 (url 기준)
      if (url.includes("admin-session-bar.html")) {
        const res = await fetch(url);
        const html = await res.text();
        el.innerHTML = html;

        // admin bar가 로드되었음을 body에 표시 → padding-top 등 조정
        document.body.classList.add("has-admin-bar");
        return; // 아래 일반 include 로직 실행 안함
      }

      // ★ 일반 include 처리
      const res = await fetch(url);
      const html = await res.text();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      // include된 요소를 현재 위치에 삽입
      while (temp.firstChild) {
        el.parentNode.insertBefore(temp.firstChild, el);
      }

      // placeholder 제거
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





document.addEventListener("includeLoaded", () => {
  fetch("/api/traffic/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: location.pathname,
      referrer: document.referrer || ""
    })
  });
});
