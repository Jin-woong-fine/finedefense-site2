/* ============================================================
   ADMIN SESSION TIMER — FINAL STABLE VERSION (2025)
   홈페이지 / 관리자 대시보드 모두 동일하게 동작
   홈에서 강제 로그아웃되는 문제 완전 해결
============================================================ */

console.log("[session_timer] 로드됨");

// ============================================================
// 1) admin bar DOM이 생길 때까지 대기
// ============================================================
function waitForAdminBar(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const bar = document.getElementById("adminSessionBar");
      if (bar) return resolve(bar);

      if (Date.now() - start > timeoutMs) {
        return reject(new Error("adminSessionBar not found within timeout"));
      }
      requestAnimationFrame(check);
    };

    check();
  });
}

// ============================================================
// 2) 메인 세션 타이머
// ============================================================
(async () => {
  try {
    const bar = await waitForAdminBar();
    console.log("[session_timer] adminSessionBar 발견");

    const timerSpan  = document.getElementById("adminTimer");
    const extendBtn  = document.getElementById("adminExtendBtn");
    const userSpan   = document.getElementById("adminUser");

    if (!timerSpan || !extendBtn || !userSpan) {
      console.warn("[session_timer] 필수 요소 없음");
      return;
    }

    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    const name  = localStorage.getItem("name");
    let expire  = Number(localStorage.getItem("token_expire"));

    console.log("[session_timer] localStorage ", { token, role, name, expire });

    // ============================================================
    //  관리자 아니면 숨김
    // ============================================================
    if (!token || (role !== "admin" && role !== "superadmin")) {
      bar.style.display = "none";
      document.body.classList.remove("has-admin-bar");
      return;
    }

    // ============================================================
    //  관리자라면 표시
    // ============================================================
    bar.style.display = "flex";
    document.body.classList.add("has-admin-bar");

    if (name) userSpan.textContent = `${name} 님`;

    // ============================================================
    // 🔥 expire 값이 없거나 잘못되었을 때 → 서버 refresh로 복구
    // ============================================================
    if (!expire || Number.isNaN(expire)) {
      console.warn("[session_timer] expire 없음 → 서버 refresh 시도");

      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });

        const out = await res.json();
        if (res.ok) {
          console.log("[session_timer] refresh 성공 → expire 갱신");
          localStorage.setItem("token", out.token);
          localStorage.setItem("token_expire", out.exp * 1000);
          expire = out.exp * 1000;
        } else {
          console.error("[session_timer] refresh 실패 → 로그아웃");
          localStorage.clear();
          location.href = "/kr/admin/login.html";
          return;
        }
      } catch (err) {
        console.error("[session_timer] refresh 에러", err);
        localStorage.clear();
        location.href = "/kr/admin/login.html";
        return;
      }
    }

    // ============================================================
    // 타이머 UI 업데이트
    // ============================================================
    function updateTimer() {
      const now = Date.now();
      const diff = expire - now;

      if (diff <= 0) {
        timerSpan.textContent = "00:00:00";

        localStorage.clear();
        alert("세션이 만료되었습니다. 다시 로그인 해주세요.");
        location.href = "/kr/admin/login.html";
        return;
      }

      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

      timerSpan.textContent = `${h}:${m}:${s}`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);

    // ============================================================
    // 연장 버튼
    // ============================================================
    extendBtn.addEventListener("click", async () => {
      try {
        console.log("[session_timer] 연장 클릭");

        const res = await fetch("/api/auth/extend", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });

        const out = await res.json();

        if (res.ok) {
          const extendMs = out.extendMs || 60 * 60 * 1000; // 기본 1시간
          expire = Date.now() + extendMs;
          localStorage.setItem("token_expire", String(expire));

          alert("세션이 1시간 연장되었습니다.");
        } else {
          alert("연장 실패: " + (out.message || "오류"));
        }
      } catch (err) {
        console.error("[session_timer] 연장 에러", err);
        alert("연장 중 오류 발생");
      }
    });
  } catch (err) {
    console.error("[session_timer] admin bar 로딩 실패", err);
  }
})();
