/****************************************************
 * 👤 Fine Defense Admin — Topbar User Menu
 * - common_auth.js 연동
 ****************************************************/

document.addEventListener("DOMContentLoaded", () => {
  const topbarUser = document.getElementById("topbarUser");
  const dropdown = document.getElementById("userDropdown");
  const nameEl = document.getElementById("topbarUserName");

  // 페이지에 topbar가 없는 경우도 있으니 안전 처리
  if (!topbarUser || !dropdown || !nameEl) return;

  /* ===============================
   * 1) 관리자 이름 표시
   * =============================== */
  const user = window.getUser ? getUser() : {};
  nameEl.textContent = user.name || "관리자";

  /* ===============================
   * 2) 드롭다운 메뉴 구성
   * =============================== */
  dropdown.innerHTML = `
    <a href="/kr/admin/user_profile.html" class="dropdown-item">내 정보</a>
    <button type="button" class="dropdown-item danger" id="logoutBtn">
      로그아웃
    </button>
  `;

  /* ===============================
   * 3) 열고 / 닫기
   * =============================== */
  function close() { dropdown.classList.remove("open"); }
  function toggle() { dropdown.classList.toggle("open"); }

  topbarUser.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener("click", close);
  dropdown.addEventListener("click", (e) => e.stopPropagation());

  /* ===============================
   * 4) 로그아웃
   * =============================== */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window.logout) {
        logout(); // common_auth.js
      } else {
        alert("로그아웃 함수가 없습니다.");
      }
    });
  }
});
