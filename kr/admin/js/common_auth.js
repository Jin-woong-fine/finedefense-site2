/****************************************************
 * 🔐 공통 인증 및 권한 관리 — Fine Defense Admin
 * (2025 안정화 버전)
 ****************************************************/
console.log("%c[auth] common_auth.js 로드됨", "color:#ff9800;font-weight:bold;");

/****************************************************
 * 1) 유저 정보 / 토큰 / 헤더
 ****************************************************/
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

/****************************************************
 * 2) 로그인/권한 체크 함수
 ****************************************************/

// 🔹 로그인 여부만 검사
function requireLogin() {
  const { token } = getUser();
  console.log("[auth] requireLogin 실행됨:", !!token);

  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 🔹 모든 로그인 사용자 허용 (viewer ~ superadmin)
function requireAnyUser() {
  const { role } = getUser();
  console.log("[auth] requireAnyUser 실행됨, role:", role);

  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 🔹 editor 이상(뉴스관리, 제품관리 등)
// superadmin / admin / editor 허용
function requireAdminOrEditor() {
  const { role } = getUser();
  console.log("[auth] requireAdminOrEditor 실행됨:", role);

  if (["superadmin", "admin", "editor"].includes(role)) return;

  alert("접근 권한이 없습니다.");
  location.href = "/kr/admin/login.html";
}

// 🔹 admin 이상(사용자 관리, 민감한 시스템)
const ADMIN_ONLY_PATHS = [
  "/kr/admin/users.html",
  "/kr/admin/login-logs.html",
  // 향후 관리자 전용 페이지 추가 시 여기에 push
];

function requireAdminOrSuperadmin() {
  const { role } = getUser();
  const path = location.pathname;

  console.log("[auth] requireAdminOrSuperadmin 실행됨:", role, " path:", path);

  // 이 페이지가 admin 검사 대상인지 확인
  if (!ADMIN_ONLY_PATHS.includes(path)) {
    console.log("[auth] → 이 페이지는 관리자 전용 페이지가 아님 (검사 건너뜀)");
    return;
  }

  if (["superadmin", "admin"].includes(role)) return;

  alert("관리자만 접근 가능합니다.");
  location.href = "/kr/admin/login.html";
}

// 🔹 superadmin만 허용
function requireSuperadminStrict() {
  const { role } = getUser();
  console.log("[auth] requireSuperadminStrict 실행됨:", role);

  if (role !== "superadmin") {
    alert("슈퍼관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}

/****************************************************
 * 3) 로그아웃
 ****************************************************/
function logout() {
  console.log("[auth] 로그아웃 실행");
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}

/****************************************************
 * 4) 공통 UI 초기화
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const nameEl = document.getElementById("topbarUserName");

  console.log("[auth] DOMContentLoaded → 인증 UI 초기화");

  if (nameEl && user.name) {
    nameEl.textContent = user.name;
  }
});

/****************************************************
 * 5) 전역 바인딩
 ****************************************************/
window.getUser = getUser;
window.authHeaders = authHeaders;

window.requireLogin = requireLogin;
window.requireAnyUser = requireAnyUser;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireSuperadminStrict = requireSuperadminStrict;

window.logout = logout;
