/****************************************************
 * 🔐 공통 인증 및 권한 관리 (페이지 기반 버전)
 ****************************************************/
console.log("%c[auth] common_auth.js 로드됨", "color:#ff9800;font-weight:bold;");

/****************************************************
 * 1) 유저 정보 & 헤더
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
 * 2) 공통 권한 체크 함수들
 ****************************************************/

// 🔹 단순 로그인 여부
function requireLogin() {
  const { token } = getUser();
  console.log("[auth] requireLogin 실행됨, token:", !!token);
  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 🔹 모든 로그인 사용자 허용 (viewer 포함)
function requireAnyUser() {
  const { role } = getUser();
  console.log("[auth] requireAnyUser 실행됨, role:", role);
  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 🔹 editor 이상 (products, posts 같은 곳에서 사용)
function requireAdminOrEditor() {
  const { role } = getUser();
  const path = window.location.pathname;
  console.log("[auth] requireAdminOrEditor 실행됨, role:", role, "path:", path);

  // editor, admin, superadmin 허용
  if (role === "editor" || role === "admin" || role === "superadmin") return;

  alert("접근 권한 없음");
  location.href = "/kr/admin/login.html";
}

// 🔹 admin/superadmin 전용 페이지 (⚠ 페이지별로 제한)
const ADMIN_ONLY_PATHS = [
  "/kr/admin/users.html",      // 전체 사용자 목록
  // "/kr/admin/some_other.html"  // 나중에 다른 관리자전용 페이지 생기면 여기 추가
];

function requireAdminOrSuperadmin() {
  const { role } = getUser();
  const path = window.location.pathname;
  console.log("[auth] requireAdminOrSuperadmin 실행됨, role:", role, "path:", path);

  // ✅ 대시보드 같은 페이지에서 실수로 호출되어도 그냥 무시
  if (!ADMIN_ONLY_PATHS.includes(path)) {
    console.log("[auth] 이 페이지는 admin 전용 검사 대상 아님 → 패스");
    return;
  }

  // 실제로는 admin / superadmin일 때만 통과
  if (role === "admin" || role === "superadmin") return;

  alert("관리자만 접근 가능합니다.");
  location.href = "/kr/admin/login.html";
}

// 🔹 superadmin 전용이 정말 필요하면 별도 정의 (지금은 안 씀)
function requireSuperadminStrict() {
  const { role } = getUser();
  const path = window.location.pathname;
  console.log("[auth] requireSuperadminStrict 실행됨, role:", role, "path:", path);

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
 * 4) 공통 초기화 (UI 정도만, 권한 체크 없음)
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("[auth] 공통 인증 시스템 초기화 완료");
  const user = getUser();
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl && user.name) nameEl.textContent = user.name;
});

/****************************************************
 * 5) 전역 노출
 ****************************************************/
window.getUser = getUser;
window.authHeaders = authHeaders;

window.requireLogin = requireLogin;
window.requireAnyUser = requireAnyUser;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireSuperadminStrict = requireSuperadminStrict;

window.logout = logout;
