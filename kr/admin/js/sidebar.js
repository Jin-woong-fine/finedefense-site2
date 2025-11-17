/* ===============================
   📌 관리자 사이드바 자동 불러오기
================================ */
export async function loadSidebar() {
  const box = document.getElementById("sidebar");
  if (!box) return;

  const res = await fetch("/kr/admin/components/sidebar.html");
  const html = await res.text();
  box.innerHTML = html;
}
