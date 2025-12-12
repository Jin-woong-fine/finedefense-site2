// /kr/admin/js/topbar.js
console.log("%c[topbar] load", "color:#2196f3;font-weight:bold;");

document.addEventListener("DOMContentLoaded", async () => {
  const wrap = document.getElementById("topbar");
  if (!wrap) {
    console.warn("[topbar] #topbar 없음");
    return;
  }

  /* 1️⃣ HTML 로드 */
  const res = await fetch("/kr/admin/components/topbar.html");
  wrap.innerHTML = await res.text();

  /* 2️⃣ 페이지 타이틀 */
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
  if (titleEl) titleEl.textContent = titleMap[page] || "관리자";

  /* 3️⃣ 사용자 이름 */
  const name = localStorage.getItem("name") || "관리자";
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl) nameEl.textContent = name;

  /* 4️⃣ 드롭다운 */
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  /* 5️⃣ 액션 */
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;

      if (action === "logout") {
        localStorage.clear();
        location.href = "/kr/admin/login.html";
      }

      if (action === "home") {
        location.href = "/kr/index.html";
      }
    });
  });

  /* 6️⃣ 세션 타이머 (건드리지 않음) */
  if (typeof window.initSessionCountdown === "function") {
    window.initSessionCountdown();
  }
});
