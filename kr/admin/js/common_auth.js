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
// 🔥 관리자(admin 이상)
// ------------------------------
function requireAdmin() {
  const { role } = getUser();
  if (!role || (role !== "admin" && role !== "superadmin")) {
    alert("관리자만 접근할 수 있습니다.");
    location.href = "/kr/admin/login.html";
  }
}

// ------------------------------
// 🔥 admin + superadmin
// ------------------------------
function requireAdminOrSuperadmin() {
  const { role } = getUser();
  if (!role || (role !== "admin" && role !== "superadmin")) {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

// ------------------------------
// 🔥 editor + admin + superadmin
// ------------------------------
function requireAdminOrEditor() {
  const { role } = getUser();
  if (!role || (role !== "editor" && role !== "admin" && role !== "superadmin")) {
    alert("접근 권한 없음");
    location.href = "/kr/admin/login.html";
  }
}

// 🔥 모든 로그인 사용자 허용 (superadmin, admin, editor, viewer)
function requireAnyUser() {
  const { role } = getUser();
  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}
window.requireAnyUser = requireAnyUser;




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
// 🔥 로그아웃
// ------------------------------
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  location.href = "/kr/admin/login.html";
}

// ------------------------------
// ⭐ 상단 프로필 드롭다운 초기화
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const nameEl = document.getElementById("topbarUserName");
  const box = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");

  if (nameEl && user.name) nameEl.textContent = user.name;

  // admin 이상만 "사용자 관리" 표시
  const menuUserManage = document.getElementById("menuUserManage");
  if (menuUserManage) {
    if (user.role === "admin" || user.role === "superadmin") {
      menuUserManage.style.display = "block";
    } else {
      menuUserManage.style.display = "none";
    }
  }

  // 드롭다운 토글
  if (box) {
    box.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });
  }

  // 화면 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (!box || !dropdown) return;
    if (!box.contains(e.target)) dropdown.style.display = "none";
  });
});

// 전역 노출
window.getUser = getUser;
window.logout = logout;
window.authHeaders = authHeaders;
window.requireLogin = requireLogin;
window.requireAdmin = requireAdmin;
window.requireSuperadmin = requireSuperadmin;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireAdminOrEditor = requireAdminOrEditor;
