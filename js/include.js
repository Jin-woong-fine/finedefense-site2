// /js/include.js
let trafficSent = false;

document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll("[data-include]");

  targets.forEach(async (el) => {
    // ✅ 중복 include 방지
    if (el.dataset.included === "true") return;
    el.dataset.included = "true";

    const url = el.getAttribute("data-include");
    if (!url) return;

    try {
      // ★ admin bar 먼저 처리
      if (url.includes("admin-session-bar.html")) {
        const res = await fetch(url);
        const html = await res.text();
        el.innerHTML = html;
        return;
      }

      // ★ 일반 include 처리
      const res = await fetch(url);
      const html = await res.text();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      while (temp.firstChild) {
        el.parentNode.insertBefore(temp.firstChild, el);
      }

      el.remove();
    } catch (err) {
      console.error("include error:", url, err);
    }
  });

  setTimeout(() => {
    document.dispatchEvent(new Event("includeLoaded"));
  }, 20);
});

document.addEventListener("includeLoaded", () => {
  if (trafficSent) return;   // ✅ 이제 존재함
  trafficSent = true;

  fetch("/api/traffic/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: location.pathname,
      referrer: document.referrer || ""
    })
  });
});
