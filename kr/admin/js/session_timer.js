document.addEventListener("DOMContentLoaded", () => {
  const userEl = document.getElementById("sessionUser");
  const timerEl = document.getElementById("sessionTimer");
  const refreshBtn = document.getElementById("sessionRefreshBtn");

  if (!userEl || !timerEl) return; // header 없는 페이지 예외 처리

  const name = localStorage.getItem("name") || "관리자";
  const tokenExp = localStorage.getItem("token_exp"); // 저장해둔 JWT 만료시간(ms)
  const token = localStorage.getItem("token");

  userEl.textContent = `${name}`;

  if (!tokenExp) {
    timerEl.textContent = "세션 없음";
    return;
  }

  function updateTimer() {
    const now = Date.now();
    const gap = tokenExp - now;

    if (gap <= 0) {
      timerEl.textContent = "만료됨";
      return;
    }

    const h = String(Math.floor(gap / 3600000)).padStart(2, "0");
    const m = String(Math.floor((gap % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((gap % 60000) / 1000)).padStart(2, "0");

    timerEl.textContent = `남은시간: ${h}:${m}:${s}`;
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  // 🔄 토큰 연장 버튼
  refreshBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });

      const out = await res.json();

      if (!res.ok) {
        alert("연장 실패: " + out.message);
        return;
      }

      localStorage.setItem("token", out.token);
      localStorage.setItem("token_exp", Date.now() + 2*60*60*1000); // 2시간 다시 설정

      alert("로그인 시간이 연장되었습니다.");
      updateTimer();

    } catch (e) {
      console.error(e);
      alert("연장 오류 발생");
    }
  });
});

<script src="/kr/js/session_timer.js"></script>


