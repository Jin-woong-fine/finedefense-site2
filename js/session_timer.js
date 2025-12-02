// /js/session_timer.js
console.log("[session_timer] loaded");

// ==================================
//  공통 유틸
// ==================================

// localStorage에 저장된 만료시각 가져오기 (초/밀리초 둘 다 대응)
function getExpireMs() {
  const raw = Number(localStorage.getItem("token_expire"));
  if (!raw || Number.isNaN(raw)) return null;

  // 예전 코드에서 "초" 단위로만 저장했을 가능성도 있으니 둘 다 처리
  if (raw < 1e12) {
    // 10^12 보다 작으면 초(sec)로 판단 → ms로 변환
    return raw * 1000;
  }
  // 그 이상이면 이미 ms
  return raw;
}

// 서버에서 내려준 exp(UNIX 초)를 ms로 저장
function setExpireUnix(expSec) {
  localStorage.setItem("token_expire", String(expSec * 1000));
}

// 세션 정보 전체 삭제
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("token_expire");
}

// 남은시간 ms → "HH:MM:SS" 문자열
function formatTime(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ==================================
//  메인 타이머 로직
// ==================================
async function initSessionTimer() {
  const bar = document.getElementById("adminSessionBar");
  if (!bar) {
    console.warn("[session_timer] adminSessionBar 없음");
    return;
  }

  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name") || "";

  // 관리자 아니면 바 숨김
  if (role !== "admin" && role !== "superadmin") {
    bar.style.display = "none";
    document.body.classList.remove("has-admin-bar");
    return;
  }

  // 관리자일 때만 표시
  bar.style.display = "flex";
  document.body.classList.add("has-admin-bar");

  const timerSpan = document.getElementById("adminTimer");
  const extendBtn = document.getElementById("adminExtendBtn");
  const userSpan  = document.getElementById("adminUser");
  const token     = localStorage.getItem("token");

  if (userSpan && name) {
    userSpan.textContent = `${name} 님`;
  }

  // 남은시간 갱신 함수
  function tick() {
    const expMs = getExpireMs();

    if (!expMs) {
      // 만료 정보가 없으면 바로 만료 처리
      timerSpan.textContent = "00:00:00";
      clearSession();
      return;
    }

    const diff = expMs - Date.now();

    if (diff <= 0) {
      timerSpan.textContent = "00:00:00";
      clearSession();
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      location.href = "/kr/admin/login.html";
      return;
    }

    timerSpan.textContent = formatTime(diff);
  }

  // 연장 버튼
  if (extendBtn) {
    extendBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/auth/extend", {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });

        const out = await res.json();

        if (res.ok && out.ok) {
          // 새 토큰 & 만료시간 갱신
          if (out.token) {
            localStorage.setItem("token", out.token);
          }
          if (out.exp) {
            setExpireUnix(out.exp);
          } else if (out.extendMs) {
            // 혹시 exp가 없고 extendMs만 온다면
            const newMs = Date.now() + out.extendMs;
            localStorage.setItem("token_expire", String(newMs));
          }

          alert("세션이 연장되었습니다.");
          tick(); // 바로 화면 반영
        } else {
          alert("연장 실패: " + (out.message || "알 수 없는 오류"));
        }
      } catch (err) {
        console.error("[session_timer] extend error", err);
        alert("연장 중 오류가 발생했습니다.");
      }
    });
  }

  // 타이머 시작
  tick();
  setInterval(tick, 1000);
}

// ==================================
//  adminSessionBar가 로드될 때까지 대기
// ==================================
function waitForAdminBar(maxWaitMs = 5000) {
  const start = Date.now();

  function check() {
    const bar = document.getElementById("adminSessionBar");
    if (bar) {
      initSessionTimer();
      return;
    }
    if (Date.now() - start > maxWaitMs) {
      console.warn("[session_timer] adminSessionBar를 찾지 못함 (timeout)");
      return;
    }
    setTimeout(check, 100); // 0.1초 간격으로 재시도
  }

  check();
}

// DOMContentLoaded 이후에 실행 (include.js보다 나중에 실행되는 경우도 커버)
document.addEventListener("DOMContentLoaded", () => {
  waitForAdminBar();
});
