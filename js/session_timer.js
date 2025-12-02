// /js/session_timer.js
console.log("[session_timer] loaded");

function waitForAdminBar() {
  return new Promise(resolve => {
    const check = () => {
      const el = document.getElementById("adminSessionBar");
      if (el) return resolve(el);
      requestAnimationFrame(check);
    };
    check();
  });
}

function getExpire() {
  return Number(localStorage.getItem("token_expire") || 0);
}
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("token_expire");
}

function fmt(ms) {
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
  } catch (err) {
    console.error("extend error", err);
    return false;
  }
}

// 🔥 include.js가 먼저 끝난 뒤 실행되도록 보장
window.addEventListener("load", async () => {
  console.log("[session_timer] load event fired");

  const bar = await waitForAdminBar(); // ★ 여기서 100% 로드될 때까지 기다림
  console.log("[session_timer] admin bar found");

  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    bar.style.display = "none";
    return;
  }

  bar.style.display = "flex";

  const span = document.getElementById("adminTimer");
  const btn = document.getElementById("adminExtendBtn");

  function tick() {
    const exp = getExpire();
    const diff = exp - Date.now();

    if (diff <= 0) {
      span.textContent = "00:00:00";
      clearSession();
      alert("세션이 만료되었습니다.");
      location.href = "/kr/admin/login.html";
      return;
    }

    span.textContent = fmt(diff);
  }

  btn.addEventListener("click", async () => {
    if (await extendSession()) alert("세션 연장됨");
    else alert("연장 실패");
  });

  tick();
  setInterval(tick, 1000);
});
