document.addEventListener("DOMContentLoaded", () => {
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userBtn || !dropdown) return;

  // 관리자 버튼 클릭 → 드롭다운 토글
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  // 로그아웃
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      location.href = "/kr/login.html";
    });
  }
});
