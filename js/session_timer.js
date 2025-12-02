// /js/session_timer.js
console.log("[session_timer] loaded");

// ========================================
// 1) admin bar & header가 로드될 때까지 기다림
// ========================================
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeout) return reject(null);
      requestAnimationFrame(check);
    }
    check();
  });
}

// ========================================
// 2) 서버에서 exp를 강제로 받아 통일
// ========================================
async function fetchServerExp() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const res = await fetch("/api/auth/check", {
      headers: { Authorization: "Bearer " + token }
    });

    const out = await res.json();
    if (res.ok && out.ok && out.exp) {
      localStorage.setItem("token_expire", out.exp * 1000);
      return out.exp * 1000;
    }
  } catch (err) {
    console.warn("server exp check error:", err);
  }

  return Number(localStorage.getItem("token_expire"));
}

// ========================================
// 3) ms → HH:MM:SS
// ========================================
function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ========================================
// 4) 메인 init
// ========================================
async function initSessionTimer() {
  try {
    // include 로드 기다림
    const bar = await waitForElement("#adminSessionBar");
    const header = await waitForElement("header.header-inner");

    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");

    if (role !== "admin" && role !== "superadmin") {
      bar.style.display = "none";
      document.body.classList.remove("has-admin-bar");
      return;
    }

    // 관리자일 때만 표시
    bar.style.display = "flex";

    // 헤더 자동 밀기
    header.style.marginTop = "38px";

    // DOM 연결
    const timerSpan = document.getElementById("adminTimer");
    const extendBtn = document.getElementById("adminExtendBtn");
    const userSpan = document.getElementById("adminUser");

    if (userSpan) userSpan.textContent = `${name} 님`;

    // 서버에서 exp 받아 통일
    let expMs = await fetchServerExp();

    function tick() {
      expMs = Number(localStorage.getItem("token_expire"));
      const diff = expMs - Date.now();

      if (diff <= 0) {
        clearSession();
        alert("세션이 만료되었습니다.");
        location.href = "/kr/admin/login.html";
        return;
      }

      timerSpan.textContent = formatTime(diff);
    }

    tick();
    setInterval(tick, 1000);

    extendBtn.addEventListener("click", async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/auth/extend", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });
        const out = await res.json();

        if (res.ok && out.ok) {
          localStorage.setItem("token", out.token);
          localStorage.setItem("token_expire", out.exp * 1000);
          alert("세션이 연장되었습니다.");
        } else {
          alert("연장 실패");
        }
      } catch (err) {
        alert("연장 중 오류");
      }
    });

  } catch (e) {
    console.warn("[session_timer] admin bar or header load 실패");
  }
}

// 시작
document.addEventListener("DOMContentLoaded", initSessionTimer);
