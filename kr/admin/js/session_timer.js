/**
 * session_timer.js - 관리자 로그인 세션 타이머
 * 대기업 스타일: DOM 검사 → 세션 검사 → 타이머 → 연장 기능
 */

(function () {

  // DOM 요소 검사
  const userEl = document.getElementById("adminUser");
  const timerEl = document.getElementById("adminTimer");
  const btn = document.getElementById("adminRefresh");

  if (!userEl || !timerEl || !btn) return;

  // 세션 데이터
  const name = localStorage.getItem("name") || "관리자";
  const role = localStorage.getItem("role") || "-";
  const exp = Number(localStorage.getItem("token_exp"));

  userEl.textContent = `${name} (${role})`;

  if (!exp) {
    timerEl.textContent = "세션 없음";
    return;
  }

  // 타이머 업데이트
  function update() {
    const now = Date.now();
    const remain = exp - now;

    if (remain <= 0) {
      timerEl.textContent = "만료됨";
      return;
    }

    const h = String(Math.floor(remain / 3600000)).padStart(2, "0");
    const m = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");

    timerEl.textContent = `남은시간: ${h}:${m}:${s}`;
  }

  setInterval(update, 1000);
  update();

  // 연장 기능
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      const out = await res.json();

      if (!res.ok) {
        alert("연장 실패: " + out.message);
        return;
      }

      localStorage.setItem("token", out.token);
      localStorage.setItem("token_exp", Date.now() + 2 * 60 * 60 * 1000);

      alert("연장되었습니다.");
      update();

    } catch (err) {
      alert("연장 중 오류");
      console.error(err);
    }
  });
})();
