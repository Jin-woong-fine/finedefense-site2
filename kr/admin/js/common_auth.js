// /kr/admin/js/common_auth.js

// 🔐 로그인 여부 체크
export function requireAdmin() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    alert("관리자 로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
    return false;
  }
  return true;
}

// 🔐 로그아웃
export function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}
