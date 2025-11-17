// ES Module 제거 버전 (브라우저 전역에서 사용 가능)

// 로그인 여부 확인
function requireAdmin() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    alert("관리자 로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 로그아웃
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.href = "/kr/admin/login.html";
}

// 전역에 노출
window.requireAdmin = requireAdmin;
window.logout = logout;
