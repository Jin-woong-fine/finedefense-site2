import { getToken, getExpireTime, extendSession, clearSession } from "/js/session_manager.js";

console.log("[session_timer] loaded");

function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startTimer() {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) return;

  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    bar.style.display = "none";
    return;
  }

  bar.style.display = "flex";

  const timerSpan = document.getElementById("adminTimer");
  const extendBtn = document.getElementById("adminExtendBtn");

  function tick() {
    const exp = getExpireTime();
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
    if (ok) alert("세션이 연장되었습니다.");
    else alert("연장 실패");
  });

  tick();
  setInterval(tick, 1000);
}

document.addEventListener("DOMContentLoaded", startTimer);
