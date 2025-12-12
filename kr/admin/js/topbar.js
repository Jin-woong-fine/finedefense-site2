// /kr/admin/js/topbar.js
console.log("%c[topbar] load", "color:#2196f3;font-weight:bold;");

document.addEventListener("DOMContentLoaded", async () => {
  const wrap = document.getElementById("topbar");
  if (!wrap) return;

  /* ============================
     1️⃣ TOPBAR HTML 로드
  ============================ */
  try {
    const res = await fetch("/kr/admin/components/topbar.html");
    wrap.innerHTML = await res.text();
  } catch (e) {
    console.error("[topbar] html load failed", e);
    return;
  }

  /* ============================
     2️⃣ 페이지 타이틀 설정
  ============================ */
  const page = document.body.dataset.adminPage || "";
  const titleMap = {
    dashboard: "관리자 대시보드",
    notice: "공지사항 관리",
    notice_edit: "공지사항 수정",
    notice_write: "공지사항 작성",
    products: "제품 관리",
    downloads: "자료실 관리",
    inquiry: "고객 문의"
  };

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    titleEl.textContent = titleMap[page] || "관리자";
  }

  /* ============================
     3️⃣ 사용자 이름 표시
  ============================ */
  const name = localStorage.getItem("name") || "관리자";
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl) nameEl.textContent = name;

  /* ============================
     4️⃣ 드롭다운 토글
  ============================ */
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
  }

  /* ============================
     5️⃣ 액션 처리
  ============================ */
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;

      if (action === "logout") {
        localStorage.clear();
        location.href = "/kr/login.html";
      }

      if (action === "home") {
        location.href = "/kr/index.html";
      }
    });
  });

  /* ============================
     ⭐ 6️⃣ 세션 타이머 트리거
     (로직 절대 수정 ❌)
  ============================ */
  if (typeof window.initSessionCountdown === "function") {
    window.initSessionCountdown();
  }
});
