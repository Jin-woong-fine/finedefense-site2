// /kr/admin/js/dashboard_session_timer.js
import { getExpireTime, extendSession, clearSession } from "/js/session_manager.js";

console.log("[dashboard_session_timer] loaded");

function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startDashboardTimer() {
  const el = document.getElementById("session-timer");
  if (!el) return;

  function tick() {
    const exp = getExpireTime();
    if (!exp) return;

    const diff = exp - Date.now(); // exp는 이미 ms

    if (diff <= 0) {
      el.textContent = "00:00:00";
      clearSession();
      alert("세션이 만료되었습니다.");
      location.href = "/kr/admin/login.html";
      return;
    }

    el.textContent = formatTime(diff);
  }

  tick();
  setInterval(tick, 1000);
}

document.addEventListener("DOMContentLoaded", startDashboardTimer);
