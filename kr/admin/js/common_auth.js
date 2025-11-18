// 로그인 여부 + 역할 체크
function requireAdminOrEditor() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return location.href = "/kr/admin/login.html";
  }

  if (role !== "admin" && role !== "editor" && role !== "superadmin") {
    alert("권한이 없습니다.");
    return location.href = "/kr/admin/login.html";
  }
}

function requireAdmin() {
  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    alert("관리자 권한이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");

  location.href = "/kr/admin/login.html";
}

window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdmin = requireAdmin;
window.logout = logout;
