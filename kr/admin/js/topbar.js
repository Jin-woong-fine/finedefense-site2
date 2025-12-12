// /kr/admin/js/topbar.js

document.addEventListener("DOMContentLoaded", () => {
  const userBtn = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");

  if (!userBtn || !dropdown) return;

  /* =========================
     관리자 버튼 → 드롭다운
  ========================= */
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  /* =========================
     외부 클릭 시 닫기
  ========================= */
  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  /* =========================
     ESC 키로 닫기 (UX +1)
  ========================= */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("open");
    }
  });

  /* =========================
     로그아웃 (dropdown 내부)
  ========================= */
  dropdown.addEventListener("click", (e) => {
    const target = e.target;

    if (target.matches("[data-action='logout']")) {
      e.preventDefault();

      localStorage.clear();
      location.href = "/kr/login.html";
    }
  });
});
