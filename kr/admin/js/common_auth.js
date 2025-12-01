/****************************************************
 * 🔐 Fine Defense Admin — Common Auth (2025 완전체)
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
 * 2) 권한 체크
 ****************************************************/
function requireLogin() {
  if (!localStorage.getItem("token")) {
    alert("로그인이 필요합니다.");
    location.href = "/kr/admin/login.html";
  }
}
function requireAnyUser() { requireLogin(); }
function requireAdminOrEditor() {
  const role = localStorage.getItem("role");
  if (!["superadmin", "admin", "editor"].includes(role)) {
    alert("접근 권한이 없습니다.");
    location.href = "/kr/admin/login.html";
  }
}
const ADMIN_ONLY_PATHS = [
  "/kr/admin/users.html",
  "/kr/admin/login_logs.html",
];
function requireAdminOrSuperadmin() {
  const role = localStorage.getItem("role");
  const path = location.pathname;

  if (!ADMIN_ONLY_PATHS.includes(path)) return;
  if (!["superadmin", "admin"].includes(role)) {
    alert("관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}
function requireSuperadminStrict() {
  if (localStorage.getItem("role") !== "superadmin") {
    alert("슈퍼관리자만 접근 가능합니다.");
    location.href = "/kr/admin/login.html";
  }
}

/****************************************************
 * 3) 로그아웃
 ****************************************************/
function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}

/****************************************************
 * 4) 🔥 세션 연장 (refresh API)
 ****************************************************/
async function extendSession(silent = false) {
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

  if (!silent) showExtendFeedback();

  // 즉시 타이머 갱신
  startSessionCountdown(true);
}

/****************************************************
 * 5) 세션 만료 감시
 ****************************************************/
function startSessionWatcher() {
  let warned = false;

  setInterval(() => {
    const exp = parseInt(localStorage.getItem("exp"), 10);
    if (!exp) return;

    const remain = exp - Date.now();

    if (remain <= 0) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      logout();
      return;
    }

    // 5분 이하 → 경고창 띄우기
    if (remain <= 300000 && !warned) {
      warned = true;

      if (confirm("세션이 곧 만료됩니다. 연장하시겠습니까?")) {
        extendSession();
      }
    }

  }, 10000);
}

/****************************************************
 * 6) 세션 타이머 UI
 ****************************************************/
function startSessionCountdown(force = false) {
  const el = document.getElementById("session-timer");
  if (!el) return;

  if (force && window.__SESSION_TIMER_INT__) {
    clearInterval(window.__SESSION_TIMER_INT__);
  }

  window.__SESSION_TIMER_INT__ = setInterval(() => {
    const exp = parseInt(localStorage.getItem("exp"), 10);
    if (!exp) return;

    let remain = exp - Date.now();
    if (remain <= 0) {
      el.textContent = "세션 만료";
      return;
    }

    const h = Math.floor(remain / 1000 / 3600);
    const m = Math.floor((remain / 1000 / 60) % 60);
    const s = Math.floor((remain / 1000) % 60);

    el.textContent = `세션 ${h.toString().padStart(2,'0')}:${m
      .toString().padStart(2,'0')}:${s.toString().padStart(2,'0')} 남음`;

  }, 1000);
}

/****************************************************
 * 7) UI 피드백 — 연장 완료 표시
 ****************************************************/
function showExtendFeedback() {
  const el = document.getElementById("session-timer");
  if (!el) return;

  const oldText = el.textContent;
  el.style.background = "#198754";
  el.textContent = "세션 연장됨 ✔";

  setTimeout(() => {
    el.style.background = "#0f2679";
    el.textContent = oldText;
  }, 1000);
}

/****************************************************
 * 8) 타이머 클릭 → 즉시 연장 기능 추가
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const timer = document.getElementById("session-timer");

  if (timer) {
    timer.style.cursor = "pointer";
    timer.title = "클릭하면 세션을 즉시 연장합니다.";

    timer.addEventListener("click", () => {
      extendSession();
    });
  }

  startSessionWatcher();
  startSessionCountdown();
});

/****************************************************
 * 9) 전역 바인딩
 ****************************************************/
window.getUser = getUser;
window.logout = logout;
window.extendSession = extendSession;
window.startSessionWatcher = startSessionWatcher;
window.startSessionCountdown = startSessionCountdown;
window.requireAnyUser = requireAnyUser;
window.requireAdminOrEditor = requireAdminOrEditor;
window.requireAdminOrSuperadmin = requireAdminOrSuperadmin;
window.requireSuperadminStrict = requireSuperadminStrict;
