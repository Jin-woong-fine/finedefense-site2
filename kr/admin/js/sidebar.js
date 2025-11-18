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

        <a href="./users.html" class="menu-item" data-menu="users">사용자 관리</a>

        <a href="./login_logs.html" class="menu-item" data-menu="logs">로그인 기록</a>

        <!-- 🔥 새로 추가된 메뉴 -->
        <a href="./user_profile.html" class="menu-item" data-menu="profile">내 프로필</a>

      </div>

    </div>
  `;

  // 활성 메뉴 강조
  if (activeMenu) {
    const target = container.querySelector(`[data-menu="${activeMenu}"]`);
    if (target) target.classList.add("active");
  }
}

window.loadSidebar = loadSidebar;
