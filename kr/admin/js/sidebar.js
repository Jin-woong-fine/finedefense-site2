function loadSidebar(activeMenu) {
  const container = document.getElementById("sidebar");
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar">

      <div class="sidebar-logo">관리자 메뉴</div>

      <div class="sidebar-menu">
        <a href="./dashboard.html" class="menu-item" data-menu="dashboard">대시보드</a>
        <a href="./products.html" class="menu-item" data-menu="products">제품 관리</a>
        <a href="./inquiry_list.html" class="menu-item" data-menu="inquiry">1:1 문의</a>
        <a href="./newsroom_list.html" class="menu-item" data-menu="news">뉴스룸 관리</a>
        <a href="./files.html" class="menu-item" data-menu="files">자료실 관리</a>

        <!-- 문제 있었던 부분: class="menu-item" 반드시 추가 -->
        <a href="./users.html" class="menu-item" data-menu="users">사용자 관리</a>
        <a href="./login_logs.html" class="menu-item" data-menu="logs">로그인 기록</a>
      </div>

    </div>
  `;

  if (activeMenu) {
    const activeEl = container.querySelector(`[data-menu="${activeMenu}"]`);
    if (activeEl) {
      activeEl.classList.add("active");
    }
  }
}

window.loadSidebar = loadSidebar;
