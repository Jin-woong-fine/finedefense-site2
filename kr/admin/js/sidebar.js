export function loadSidebar() {
  const target = document.getElementById("sidebar");
  if (!target) return;

  fetch("/kr/admin/components/sidebar.html")   // ← 절대경로로 고정 (가장 안정적)
    .then(res => {
      if (!res.ok) throw new Error("Sidebar load failed");
      return res.text();
    })
    .then(html => {
      target.innerHTML = html;

      // active 처리
      const current = window.location.pathname;
      document.querySelectorAll("#sidebar nav a").forEach(a => {
        const href = a.getAttribute("href");
        if (href && current.includes(href.replace("/kr/admin/", ""))) {
          a.classList.add("active");
        }
      });
    })
    .catch(err => console.error(err));
}
