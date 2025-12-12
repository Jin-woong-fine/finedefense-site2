// /kr/admin/js/topbar.js
document.addEventListener("DOMContentLoaded", () => {
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");
  const nameEl = document.getElementById("topbarUserName");

  if (nameEl) {
    nameEl.textContent = localStorage.getItem("name") || "관리자";
  }

  if (!userBtn || !dropdown) return;

  const close = () => dropdown.classList.remove("open");
  const toggle = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  };

  userBtn.addEventListener("click", toggle);

  document.addEventListener("click", close);
  window.addEventListener("blur", close);
  window.addEventListener("scroll", close, { passive: true });

  // 드롭다운 내부 클릭은 밖 클릭으로 안 닫히게
  dropdown.addEventListener("click", (e) => e.stopPropagation());

  // data-action 처리
  dropdown.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.dataset.action;
      if (action === "logout") {
        if (typeof logout === "function") logout();
        else {
          localStorage.clear();
          location.href = "/kr/login.html";
        }
      }
    });
  });
});
