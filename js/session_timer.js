// /kr/js/session_timer.js

document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) return;

  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  let exp = Number(localStorage.getItem("token_exp"));

  if (!name || !role || !exp) return;

  const adminRoles = ["admin", "superadmin", "editor"];
  if (!adminRoles.includes(role)) return;

  // 관리자바 표시
  bar.style.display = "flex";
  document.getElementById("adminUser").textContent = `${name} (${role})`;

  const timerEl = document.getElementById("adminTimer");

  function tick() {
    const remain = exp - Date.now();
    if (remain <= 0) {
      timerEl.textContent = "만료됨";
      return;
    }
    const h = String(Math.floor(remain / 3600000)).padStart(2, "0");
    const m = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
    timerEl.textContent = `${h}:${m}:${s}`;
  }

  tick();
  setInterval(tick, 1000);

  // 연장 버튼
  document.getElementById("adminExtendBtn").onclick = async () => {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    const out = await res.json();
    if (res.ok && out.exp) {
      exp = out.exp * 1000;
      localStorage.setItem("token_exp", String(exp));
      alert("연장 완료");
    }
  };
});
