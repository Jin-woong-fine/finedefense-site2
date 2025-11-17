/* ===============================
   🔐 공통 관리자 인증
================================ */
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

export function requireAdmin() {
  if (!token || role !== "admin") {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

export function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}
