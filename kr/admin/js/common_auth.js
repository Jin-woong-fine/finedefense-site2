/****************************************************
 * 🔐 Fine Defense Admin — Common Auth
 * 2025 안정화 버전 (세션관리 + 권한검사 통합)
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
    id: localStorage.getItem("user_id"),
    exp: localStorage.getItem("exp")
  };
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/****************************************************
 * 2) 권한 체크 함수
 ****************************************************/

// 로그인 여부만 검사
function requireLogin() {
  const { token } = getUser();
  console.log("[auth] requireLogin 실행됨:", !!token);

  if (!token) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// 로그인 사용자(viewer 이상) 모두 허용
function requireAnyUser() {
  const { role } = getUser();
  console.log("[auth] requireAnyUser 실행됨:", role);

  if (!role) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}

// editor 이상 허용
function requireAdminOrEditor() {
  const { role } = getUser();
  console.log("[auth] requireAdminOrEditor 실행됨:", role);

  if (["superadmin", "admin", "editor"].includes(role)) return;

  alert("접근 권한이 없습니다.");
  location.href = "/kr/admin/login.html";
}

// admin 이상 페이지 목록
const ADMIN_ONLY_PATHS = [
  "/kr/admin/users.html",
  "/kr/admin/login-logs.html",
];

// admin 이상
function requireAdminOrSuperadmin() {
  const { role } = getUser();
  const path = location.pathname;

  console.log("[auth] requireAdminOrSuperadmin 실행됨:", role, " path:", path);

  if (!ADMIN_ONLY_PATHS.includes(path)) {
    console.log("[auth] → 이 페이지는 관리자 전용 페이지가 아님 (검사 건너뜀)");
    return;
  }

  if (["superadmin", "admin"].includes(role)) return;

  alert("관리자만 접근 가능합니다.");
  location.href = "/kr/admin/login.html";
}

// superadmin 전용
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
 * 4) 세션 만료 감시 + 세션 연장 + 남은 시간 표시
 ****************************************************/

// 🔥 세션 연장 요청
async function extendSession() {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: authHeaders()
  });

  if (!res.ok) {
    alert("세션 연장 실패. 다시 로그인해주세요.");
    logout();
    return;
  }

  const out = await res.json();
  localStorage.setItem("token", out.token);
  localStorage.setItem("exp", out.exp * 1000);

  alert("세션이 연장되었습니다!");
  window.sessionAlertShown = false;
}

// ⏰ 세션 만료 감시
function startSessionWatcher() {
  const exp = parseInt(localStorage.getItem("exp"), 10);
  if (!exp) return;

  let warned = false;

  setInterval(() => {
    const now = Date.now();
    const remain = exp - now;

    if (remain <= 0) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      logout();
      return;
    }

    if (remain <= 300000 && !warned) { // 5분
      warned = true;

      if (confirm("세션이 곧 만료됩니다. 연장할까요?")) {
        extendSession();
      }
    }
  }, 10000); // 10초마다 확인
}

// 🕒 세션 타이머 표시
function startSessionCountdown() {
  const exp = parseInt(localStorage.getItem("exp"), 10);
  if (!exp) return;

  const el = document.getElementById("session-timer");
  if (!el) return;

  setInterval(() => {
    const now = Date.now();
    let remain = exp - now;

    if (remain <= 0) {
      el.textContent = "세션 만료됨";
      return;
    }

    const h = Math.floor(remain / 1000 / 60 / 60);
    const m = Math.floor((remain / 1000 / 60) % 60);
    const s = Math.floor((remain / 1000) % 60);

    el.textContent =
      `세션 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} 남음`;
  }, 1000);
}

/****************************************************
 * 5) UI 초기화
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  const nameEl = document.getElementById("topbarUserName");

  console.log("[auth] DOMContentLoaded → 인증 UI 초기화");

  if (nameEl && user.name) {
    nameEl.textContent = user.name;
  }

  // 🟦 세션 감시 시작
  startSessionWatcher();
  startSessionCountdown();
});

/****************************************************
 * 6) 전역 바인딩
 ****************************************************/
window.getUser = getUser;
window.authHeaders = authHeaders;

window.requireLogin = requireLogin;
window.requireAnyUser = requireAnyUser;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireSuperadminStrict = requireSuperadminStrict;

window.logout = logout;

window.startSessionWatcher = startSessionWatcher;
window.startSessionCountdown = startSessionCountdown;
window.extendSession = extendSession;

