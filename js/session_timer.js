// /js/session_timer.js
import { getToken, getExpireTime, extendSession, clearSession } from "/js/session_manager.js";

console.log("[session_timer] loaded");

// include.js 로 admin bar가 로드될 때까지 기다리는 유틸리티
function waitForAdminBar(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const bar = document.getElementById("adminSessionBar");
      if (bar) return resolve(bar);

      if (Date.now() - start > timeout) {
        return reject("adminSessionBar not found");
      }
      requestAnimationFrame(check);
    }
    check();
  });
}

function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function startTimer() {
  try {
    const bar = await waitForAdminBar();
    console.log("[session_timer] admin bar detected");

    const role = localStorage.getItem("role");
    if (role !== "admin" && role !== "superadmin") {
      bar.style.display = "none";
      return;
    }

    bar.style.display = "flex";

    const timerSpan = document.getElementById("adminTimer");
    const extendBtn = document.getElementById("adminExtendBtn");

    function tick() {
      const exp = getExpireTime(); // 초 단위
      const now = Date.now();
      const diff = exp * 1000 - now;

      if (diff <= 0) {
        timerSpan.textContent = "00:00:00";
        clearSession();
        alert("세션이 만료되었습니다.");
        location.href = "/kr/admin/login.html";
        return;
      }

      timerSpan.textContent = formatTime(diff);
    }

    extendBtn.addEventListener("click", async () => {
      const ok = await extendSession();
      alert(ok ? "세션이 연장되었습니다." : "연장 실패");
    });

    tick();
    setInterval(tick, 1000);

  } catch (err) {
    console.warn("[session_timer] admin bar not found:", err);
  }
}

document.addEventListener("DOMContentLoaded", startTimer);
