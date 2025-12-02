// /js/session_timer.js
console.log("[session_timer] loaded");

function getExpire() {
  return Number(localStorage.getItem("token_expire"));
}

function setExpireUnix(exp) {
  // exp는 UNIX → ms 로 변환해 저장
  localStorage.setItem("token_expire", exp * 1000);
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("token_expire");
}

function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function initSessionTimer() {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) return;

  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    bar.style.display = "none";
    document.body.classList.remove("has-admin-bar");
    return;
  }

  // 관리자일 때
  bar.style.display = "flex";
  document.body.classList.add("has-admin-bar");

  const timerSpan = document.getElementById("adminTimer");
  const extendBtn = document.getElementById("adminExtendBtn");
  const token = localStorage.getItem("token");

  function tick() {
    const expMs = getExpire();
    const diff = expMs - Date.now();

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
    const res = await fetch("/api/auth/extend", {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });

    const out = await res.json();

    if (res.ok && out.ok) {
      localStorage.setItem("token", out.token);
      setExpireUnix(out.exp);
      alert("세션이 연장되었습니다.");
    } else {
      alert("연장 실패");
    }
  });

  tick();
  setInterval(tick, 1000);
}

document.addEventListener("DOMContentLoaded", initSessionTimer);
