// kr/admin/js/sidebar.js

function loadSidebar(activeMenu) {
  const container = document.getElementById("sidebar");
  if (!container) return;

  // 관리자 사이드바 HTML을 직접 넣는다 (fetch, 인코딩 그런 거 전부 X)
  container.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-title">관리자 메뉴</div>
      <div class="sidebar-menu">
        <a href="./dashboard.html" data-menu="dashboard">대시보드</a>
        <a href="./products.html" data-menu="products">제품 관리</a>
        <a href="./inquiry_list.html" data-menu="inquiry">1:1 문의</a>
        <a href="./newsroom_list.html" data-menu="news">뉴스룸 관리</a>
        <a href="./files.html" data-menu="files">자료실 관리</a>
      </div>
    </div>
  `;

  // 활성 메뉴 강조
  if (activeMenu) {
    const activeEl = container.querySelector(`[data-menu="${activeMenu}"]`);
    if (activeEl) {
      activeEl.classList.add("active");
    }
  }
}

// 전역으로 노출 (type="module" 안 쓰고 그냥 <script>에서 쓰기 위함)
window.loadSidebar = loadSidebar;
