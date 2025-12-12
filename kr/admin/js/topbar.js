// /kr/admin/js/topbar.js
document.addEventListener("DOMContentLoaded", async () => {
  const wrap = document.getElementById("topbar");
  if (!wrap) return;

  // 🔹 HTML 로드
  const res = await fetch("/kr/admin/components/topbar.html");
  wrap.innerHTML = await res.text();

  // 🔹 페이지 타이틀 매핑
  const page = document.body.dataset.adminPage;
  const titleMap = {
    dashboard: "관리자 대시보드",
    notice: "공지사항 관리",
    notice_edit: "공지사항 수정",
    notice_write: "공지사항 작성",
    products: "제품 관리"
  };

  const titleEl = document.getElementById("pageTitle");
  if (titleEl) {
    titleEl.textContent = titleMap[page] || "관리자";
  }

  // 🔹 사용자 이름
  const name = localStorage.getItem("name") || "관리자";
  const nameEl = document.getElementById("topbarUserName");
  if (nameEl) nameEl.textContent = name;

  // 🔹 드롭다운
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");

  userBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    dropdown?.classList.remove("open");
  });

  // 🔹 액션
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
});
