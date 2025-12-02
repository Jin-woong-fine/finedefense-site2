// /js/session_timer.js
console.log("[session_timer] 로드됨");

// ================================
// 1) admin bar DOM이 생길 때까지 대기
// ================================
function waitForAdminBar(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const bar = document.getElementById("adminSessionBar");
      if (bar) {
        resolve(bar);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("adminSessionBar not found within timeout"));
        return;
      }
      requestAnimationFrame(check);
    };

    check();
  });
}

// ================================
// 2) 메인 세션 타이머 로직
// ================================
(async () => {
  try {
    const bar = await waitForAdminBar();
    console.log("[session_timer] adminSessionBar 발견");

    const timerSpan  = document.getElementById("adminTimer");
    const extendBtn  = document.getElementById("adminExtendBtn");
    const userSpan   = document.getElementById("adminUser");

    if (!timerSpan || !extendBtn || !userSpan) {
      console.warn("[session_timer] 필수 요소 없음", { timerSpan, extendBtn, userSpan });
      return;
    }

    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    const name  = localStorage.getItem("name");
    let expire  = Number(localStorage.getItem("token_expire"));

    console.log("[session_timer] localStorage →", { token, role, name, expire });

    // =======================================
    // 🚫 관리자 권한 없으면 bar 숨기고 종료
    // =======================================
    if (!token || (role !== "admin" && role !== "superadmin")) {
      bar.style.display = "none";
      document.body.classList.remove("has-admin-bar");
      console.log("[session_timer] 관리자 아님 → admin bar 숨김");
      return;
    }

    // =======================================
    // ✅ 관리자라면 bar 표시 + 헤더/페이지 밀기
    // =======================================
    bar.style.display = "flex";
    document.body.classList.add("has-admin-bar");

    if (name) userSpan.textContent = `${name} 님`;

    // expire 값이 없으면 기본 1시간 세팅
    if (!expire || Number.isNaN(expire)) {
      expire = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("token_expire", String(expire));
      console.warn("[session_timer] expire 없음 → 기본 1시간 부여");
    }

    // ================================
    // 타이머 업데이트 함수
    // ================================
    function updateTimer() {
      const now = Date.now();
      let diff = expire - now;

      if (diff <= 0) {
        timerSpan.textContent = "00:00:00";

        // 세션 만료 처리
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        localStorage.removeItem("token_expire");

        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
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

    // ================================
    // 🔁 연장 버튼 기능
    // ================================
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
          alert("연장 실패: " + (out.message || "알 수 없는 오류"));
        }

      } catch (err) {
        console.error("[session_timer] 연장 에러", err);
        alert("연장 중 오류 발생");
      }
    });

  } catch (e) {
    console.error("[session_timer] admin bar 로딩 오류:", e);
  }
})();
