// /kr/admin/js/topbar.js
console.log("%c[topbar] load", "color:#2196f3;font-weight:bold;");

document.addEventListener("DOMContentLoaded", () => {
  initTopbar().catch((err) => {
    console.error("[topbar] init error:", err);
  });
});

async function initTopbar() {
  const wrap = document.getElementById("topbar");
  if (!wrap) {
    console.warn("[topbar] #topbar 없음");
    return;
  }

  // 1) HTML 로드
  try {
    const res = await fetch("/kr/admin/components/topbar.html", { cache: "no-store" });
    if (!res.ok) throw new Error(`topbar.html fetch failed: ${res.status}`);
    wrap.innerHTML = await res.text();
  } catch (e) {
    console.error("[topbar] topbar.html 로드 실패:", e);
    wrap.innerHTML = `<div class="topbar"><div class="title">관리자</div></div>`;
    return; // HTML이 없으면 아래 바인딩 불가
  }

  // 2) 페이지 타이틀
  const page = document.body?.dataset?.adminPage || "";
  const titleMap = {
    dashboard: "관리자 대시보드",
    notice: "공지사항 관리",
    notice_edit: "공지사항 수정",
    notice_write: "공지사항 작성",
    products: "제품 관리",
    downloads: "자료실 관리",
    inquiry: "고객 문의",
  };

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = titleMap[page] || "관리자";

  // 3) 사용자 이름
  const name = localStorage.getItem("name") || "관리자";
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl) nameEl.textContent = name;

  // 4) 드롭다운 (요소 존재 체크 + 안전 바인딩)
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");

  if (userBtn && dropdown) {
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
    });
  } else {
    console.warn("[topbar] 드롭다운 요소 누락:", { userBtn: !!userBtn, dropdown: !!dropdown });
  }

  // 5) 액션 (logout / home)
  wrap.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;

      if (action === "logout") {
        localStorage.clear();
        location.href = "/kr/admin/login.html";
        return;
      }

      if (action === "home") {
        location.href = "/kr/index.html";
        return;
      }
    });
  });

  // 6) 세션 타이머: "topbar가 DOM에 붙은 뒤"에 호출되도록 보장
  //    (module 로딩/전역 등록 타이밍 이슈 방어)
  requestAnimationFrame(() => {
    const timerEl = document.getElementById("session-timer");
    if (!timerEl) {
      console.warn("[topbar] #session-timer 요소가 없음 (topbar.html 확인 필요)");
      return;
    }

    if (typeof window.initSessionCountdown === "function") {
      console.log("[topbar] initSessionCountdown() 호출");
      window.initSessionCountdown();
    } else {
      console.warn("[topbar] window.initSessionCountdown 가 없음 (dashboard_session_timer.js 확인 필요)");
      // 디버깅용 힌트
      console.log("[topbar] window keys hint:", Object.keys(window).filter(k => k.toLowerCase().includes("session")));
    }
  });
}
