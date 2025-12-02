// /kr/js/session_timer.js

console.log("[session_timer] 로드됨");

// 1) admin bar DOM이 생길 때까지 대기
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

// 2) 메인 로직
(async () => {
  try {
    const bar = await waitForAdminBar();
    console.log("[session_timer] adminSessionBar 발견:", bar);

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

    console.log("[session_timer] localStorage", { token, role, name, expire });

    // 📌 관리자 권한 없으면 bar 숨기고 종료
    if (!token || (role !== "admin" && role !== "superadmin")) {
      console.log("[session_timer] 관리자 아님 → 바 숨김");
      bar.style.display = "none";
      return;
    }

    // 📌 관리자 맞으면 표시
    bar.style.display = "flex";
    if (name) {
      userSpan.textContent = `${name} 님`;
    }

    // expire 값이 없으면 1시간짜리 임시 세팅 (디버깅용)
    if (!expire || Number.isNaN(expire)) {
      expire = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("token_expire", String(expire));
      console.warn("[session_timer] expire가 없어서 임시 1시간 세팅");
    }

    function updateTimer() {
      const now = Date.now();
      let diff = expire - now;

      if (diff <= 0) {
        timerSpan.textContent = "00:00:00";
        console.warn("[session_timer] 세션 만료 → 토큰 삭제 & 로그인 페이지로 이동");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("name");
        localStorage.removeItem("token_expire");
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

    // 📌 연장 버튼
    extendBtn.addEventListener("click", async () => {
      try {
        console.log("[session_timer] 연장 버튼 클릭");
        const res = await fetch("/api/auth/extend", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });
        const out = await res.json();

        if (res.ok) {
          const extendMs = out.extendMs || (60 * 60 * 1000);
          expire = Date.now() + extendMs;
          localStorage.setItem("token_expire", String(expire));
          alert("세션이 연장되었습니다.");
        } else {
          alert("연장 실패: " + out.message);
        }
      } catch (e) {
        console.error("[session_timer] 연장 요청 오류", e);
        alert("연장 중 오류가 발생했습니다.");
      }
    });

  } catch (e) {
    console.error("[session_timer] admin bar 대기 중 오류:", e);
  }
})();
