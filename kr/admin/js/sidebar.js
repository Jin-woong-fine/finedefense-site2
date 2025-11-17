// /kr/admin/js/sidebar.js

export function loadSidebar(active = "") {
  fetch("/kr/admin/sidebar.html")
    .then(r => r.text())
    .then(html => {
      const box = document.getElementById("sidebar");
      if (!box) return;

      box.innerHTML = html;

      // 현재 페이지 강조
      if (active) {
        const activeEl = box.querySelector(`[data-menu='${active}']`);
        if (activeEl) activeEl.classList.add("active");
      }
    })
    .catch(err => console.error("sidebar load error:", err));
}
