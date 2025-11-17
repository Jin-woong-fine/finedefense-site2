export function loadSidebar(activeMenu) {

  fetch("./sidebar.html")
    .then(res => {
      if (!res.ok) throw new Error("Sidebar load failed");
      return res.text();
    })
    .then(html => {
      const container = document.getElementById("sidebar");
      container.innerHTML = html;

      // 메뉴 강조 처리
      const menuItem = container.querySelector(`[data-menu="${activeMenu}"]`);
      if (menuItem) menuItem.classList.add("active");
    })
    .catch(err => {
      console.error("Sidebar Load Error:", err);
    });

}
