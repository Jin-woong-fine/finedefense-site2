// /kr/admin/js/sidebar.js

(function () {
  /**
   * 사이드바 HTML 로드 + 현재 메뉴 활성화
   * @param {string} activeKey - "dashboard" | "inquiry" | "newsroom" | "files" | "products" 등
   */
  window.loadSidebar = function (activeKey) {
    const container = document.getElementById("sidebar");
    if (!container) return;

    fetch("/kr/admin/sidebar.html")
      .then((res) => res.text())
      .then((html) => {
        container.innerHTML = html;

        // a 태그에 data-menu 속성 달아놓았다는 가정 (아래에서 sidebar.html도 수정할 거)
        if (activeKey) {
          const activeLink =
            container.querySelector(`[data-menu="${activeKey}"]`) ||
            container.querySelector(`a[href*="${activeKey}"]`);

          if (activeLink) {
            activeLink.classList.add("active");
          }
        }
      })
      .catch((err) => {
        console.error("Sidebar load error:", err);
      });
  };
})();
