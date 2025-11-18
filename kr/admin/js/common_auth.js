// ==============================
// 🔐 공통 인증 함수
// ==============================

// 로컬스토리지에서 인증 정보 꺼내기
function getUser() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name")
  };
}

// 인증 헤더 반환
function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ------------------------------
// 🔥 로그인 여부 체크
// ------------------------------
function requireLogin() {
  const { token } = getUser();
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// ------------------------------
// 🔥 관리자 전용(admin 이상)
// ------------------------------
function requireAdmin() {
  const { role } = getUser();

  if (!role || (role !== "admin" && role !== "superadmin")) {
    alert("관리자만 접근할 수 있습니다.");
    location.href = "/kr/admin/login.html";
  }
}

// ------------------------------
// 🔥 superadmin 또는 admin만
// ------------------------------
function requireAdminOrSuperadmin() {
  const { role } = getUser();

  if (!role || (role !== "admin" && role !== "superadmin")) {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
    return;
  }
}

// ------------------------------
// 🔥 superadmin만
// ------------------------------
function requireSuperadmin() {
  const { role } = getUser();

  if (role !== "superadmin") {
    alert("슈퍼관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// ------------------------------
// 🔥 로그아웃 처리
// ------------------------------
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  location.href = "/kr/admin/login.html";
}

// 전역으로 노출
window.getUser = getUser;
window.requireLogin = requireLogin;
window.requireAdmin = requireAdmin;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireSuperadmin = requireSuperadmin;
window.logout = logout;
window.authHeaders = authHeaders;


// ------------------------------
// 🔥 editor 이상 허용 (editor, admin, superadmin)
// ------------------------------
function requireAdminOrEditor() {
  const { role } = getUser();

  if (!role || (role !== "editor" && role !== "admin" && role !== "superadmin")) {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
    return;
  }
}

window.requireAdminOrEditor = requireAdminOrEditor;
