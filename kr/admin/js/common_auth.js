/****************************************************
 * 🔐 공통 인증 및 권한 관리 스크립트 (최종 안정 버전)
 ****************************************************/

console.log("%c[auth] common_auth.js 로드됨", "color:#4caf50;font-weight:bold;");

/****************************************************
 * 1) 로컬스토리지 기반 유저 정보
 ****************************************************/
function getUser() {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name"),
    id: localStorage.getItem("user_id")
  };
}

/****************************************************
 * 2) Authorization 헤더 생성
 ****************************************************/
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/****************************************************
 * 3) 권한 체크 함수들 (직접 호출한 경우만 작동)
 ****************************************************/
function requireLogin() {
  const { token } = getUser();
  console.log("requireLogin 실행됨, token=", token);

  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

function requireAnyUser() {
  const { role } = getUser();
  console.log("requireAnyUser 실행됨, role=", role);

  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

function requireAdmin() {
  const { role } = getUser();
  console.log("requireAdmin 실행됨, role=", role);

  if (role !== "admin" && role !== "superadmin") {
    alert("관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}

function requireAdminOrSuperadmin() {
  const { role } = getUser();
  console.log("requireAdminOrSuperadmin 실행됨, role=", role);

  if (role !== "admin" && role !== "superadmin") {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

function requireAdminOrEditor() {
  const { role } = getUser();
  console.log("requireAdminOrEditor 실행됨, role=", role);

  if (role !== "editor" && role !== "admin" && role !== "superadmin") {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

function requireSuperadmin() {
  const { role } = getUser();
  console.log("requireSuperadmin 실행됨, role=", role);

  if (role !== "superadmin") {
    alert("슈퍼관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}

/****************************************************
 * 4) 로그아웃
 ****************************************************/
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("user_id");
  location.href = "/kr/admin/login.html";
}

/****************************************************
 * 5) 관리자 메뉴 처리 (완전 삭제)
 *    👉 기존: menuUserManage 자동 제어 → editor 튕기는 원인
 *    👉 이제 sidebar.js에서만 메뉴 생성 관리
 ****************************************************/

// ⚠️ 자동으로 DOM을 건드리는 코드는 전부 제거함.
// ⚠️ dropdown UI는 dashboard.html/jsp 등 개별 페이지에서 처리함.

/****************************************************
 * 6) 전역 함수 노출
 ****************************************************/
window.getUser = getUser;
window.logout = logout;
window.authHeaders = authHeaders;

window.requireLogin = requireLogin;
window.requireAnyUser = requireAnyUser;

window.requireAdmin = requireAdmin;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireSuperadmin = requireSuperadmin;

console.log("%c[auth] 공통 인증 시스템 초기화 완료", "color:#2196f3;font-weight:bold;");
