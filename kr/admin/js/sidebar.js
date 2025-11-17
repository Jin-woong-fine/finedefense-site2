export function loadSidebar() {
  const target = document.getElementById("sidebar");
  if (!target) return;

  fetch("/kr/admin/sidebar.html")   // ← 여기로 고정!!
    .then(res => res.text())
    .then(html => {
      target.innerHTML = html;

      // active 표시
      const current = window.location.pathname;
      document.querySelectorAll("#sidebar nav a").forEach(a => {
        if (current.includes(a.getAttribute("href"))) {
          a.classList.add("active");
        }
      });
    })
    .catch(err => console.error("Sidebar Load Error:", err));
}
