// /kr/js/session_timer.js
// 관리자 세션 타이머 & 연장 기능

(function () {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) return;

  const userEl = document.getElementById("adminUser");
  const timerEl = document.getElementById("adminTimer");
  const extendBtn = document.getElementById("adminExtendBtn");

  if (!userEl || !timerEl || !extendBtn) return;

  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  let expRaw = localStorage.getItem("token_exp");

  // 세션 없으면 숨김
  if (!name || !role || !token || !expRaw) {
    bar.style.display = "none";
    return;
  }

  // 관리자 / 슈퍼관리자만 표시
  const adminRoles = ["admin", "superadmin", "editor"];
  if (!adminRoles.includes(role)) {
    bar.style.display = "none";
    return;
  }

  // token_exp 파싱 (ms / ISO 둘 다 수용)
  let exp;
  if (/^\d+$/.test(expRaw)) {
    exp = Number(expRaw);
  } else {
    exp = Date.parse(expRaw);
  }
  if (!exp || isNaN(exp)) {
    bar.style.display = "none";
    return;
  }

  // 표시 시작
  bar.style.display = "flex";
  document.body.classList.add("admin-mode");

  userEl.textContent = `${name} (${role})`;

  function updateTimer() {
    const now = Date.now();
    const remain = exp - now;

    if (remain <= 0) {
      timerEl.textContent = "만료됨";
      bar.classList.add("admin-session-expired");
      return;
    }

    const h = String(Math.floor(remain / 3600000)).padStart(2, "0");
    const m = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");

    timerEl.textContent = `${h}:${m}:${s}`;
  }

  // 1초마다 갱신
  updateTimer();
  setInterval(updateTimer, 1000);

  // 연장 버튼 클릭
  extendBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      const out = await res.json();

      if (!res.ok) {
        alert("세션 연장 실패: " + (out.message || "알 수 없는 오류"));
        return;
      }

      // 새 토큰 / 만료시간 반영
      if (out.token) {
        localStorage.setItem("token", out.token);
      }

      let newExp;
      if (out.expiresIn) {
        // 서버가 seconds로 만료시간을 주는 경우
        newExp = Date.now() + out.expiresIn * 1000;
      } else if (out.exp) {
        // 서버가 exp(Unix time, seconds)를 주는 경우
        newExp = out.exp * 1000;
      } else {
        // 서버가 안 주면 기본 2시간 연장
        newExp = Date.now() + 2 * 60 * 60 * 1000;
      }

      exp = newExp;
      localStorage.setItem("token_exp", String(newExp));

      alert("세션이 연장되었습니다.");
      updateTimer();
    } catch (err) {
      console.error(err);
      alert("세션 연장 중 오류가 발생했습니다.");
    }
  });
})();
