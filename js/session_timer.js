// /js/session_timer.js
console.log("[session_timer] loaded");

// localStorage에서 토큰 만료시간 가져오기
function getExpireTime() {
  return Number(localStorage.getItem("token_expire") || 0);
}

// 만료 → 로그아웃 처리
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("token_expire");
}

function format(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function extendSession() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const res = await fetch("/api/auth/extend", {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });

    const out = await res.json();

    if (res.ok && out.extendMs) {
      const newExpire = Date.now() + out.extendMs;
      localStorage.setItem("token_expire", String(newExpire));
      return true;
    }
    return false;

  } catch (e) {
    console.error("extend error:", e);
    return false;
  }
}

// include.js 완료 후 실행
window.addEventListener("load", () => {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) return;

  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    bar.style.display = "none";
    return;
  }

  bar.style.display = "flex";

  const span = document.getElementById("adminTimer");
  const btn  = document.getElementById("adminExtendBtn");

  function tick() {
    const expire = getExpireTime();
    const diff = expire - Date.now();

    if (diff <= 0) {
      span.textContent = "00:00:00";
      clearSession();
      alert("세션이 만료되었습니다.");
      location.href = "/kr/admin/login.html";
      return;
    }

    span.textContent = format(diff);
  }

  btn.addEventListener("click", async () => {
    if (await extendSession()) alert("세션 연장됨");
    else alert("연장 실패");
  });

  tick();
  setInterval(tick, 1000);
});
