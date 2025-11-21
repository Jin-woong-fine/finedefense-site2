console.log("%c[auth] common_auth.js 로드됨", "color:#ff9800;font-weight:bold;");

function getUser() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name"),
    id: localStorage.getItem("user_id")
  };
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 🔥 로그인 여부만 확인
function requireLogin() {
  const { token } = getUser();
  console.log("[auth] requireLogin 실행됨, token:", token);
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 🔥 admin + superadmin
function requireAdminOrSuperadmin() {
  const { role } = getUser();
  console.log("[auth] requireAdminOrSuperadmin 실행됨, role:", role);
  if (role !== "admin" && role !== "superadmin") {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

// 🔥 editor 이상 (editor, admin, superadmin)
function requireAdminOrEditor() {
  const { role } = getUser();
  console.log("[auth] requireAdminOrEditor 실행됨, role:", role);
  if (role !== "editor" && role !== "admin" && role !== "superadmin") {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

// 🔥 모든 로그인 사용자(viewer 포함)
function requireAnyUser() {
  const { role } = getUser();
  console.log("[auth] requireAnyUser 실행됨, role:", role);
  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}

// ⭐ 드롭다운 초기화 (권한 체크 없음)
document.addEventListener("DOMContentLoaded", () => {
  console.log("[auth] 공통 인증 시스템 초기화 완료");

  const user = getUser();
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl && user.name) nameEl.textContent = user.name;
});

// 전역 노출
window.getUser = getUser;
window.logout = logout;
window.authHeaders = authHeaders;
window.requireLogin = requireLogin;
window.requireAnyUser = requireAnyUser;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
