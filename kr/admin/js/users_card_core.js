console.log("%c[users_card] 로드 완료", "color:#4caf50;font-weight:bold;");

const API = "/api";
const token = localStorage.getItem("token");

function getAuthHeaders(isJSON = true) {
  const h = { Authorization: `Bearer ${token}` };
  if (isJSON) h["Content-Type"] = "application/json";
  return h;
}

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  initAddUser();
});

async function loadUsers() {
  const grid = document.getElementById("usersGrid");
  grid.innerHTML = "불러오는 중...";

  const res = await fetch(`${API}/users`, { headers: getAuthHeaders() });
  if (!res.ok) {
    grid.innerHTML = "로드 실패";
    return;
  }

  const users = await res.json();
  const myId = Number(localStorage.getItem("user_id"));
  const myRole = localStorage.getItem("role");

  grid.innerHTML = users.map(u => renderUserCard(u, myRole, myId)).join("");
}

function renderUserCard(u, myRole, myId) {
  const avatarUrl = u.avatar_url || "/img/admin/avatar-placeholder.png";
  const intro = (u.intro || "").trim();

  const profileBtn =
    u.id === myId
      ? `<button class="btn-primary" onclick="location.href='/kr/admin/user_profile.html'">내 프로필</button>`
      : `<button class="btn-primary" onclick="location.href='/kr/admin/user_view.html?id=${u.id}'">프로필 보기</button>`;

  const adminMenu =
    myRole === "superadmin"
      ? `
        <div class="card-menu">
          <button onclick="resetPassword(${u.id})">비번 초기화</button>
          <button class="danger" onclick="deleteUser(${u.id})">삭제</button>
        </div>
      `
      : "";

  return `
    <div class="user-card github-style">

        <div class="avatar-wrap"
            onclick="openAvatarModal('${avatarUrl}')"
            style="cursor:pointer">
        <img src="${avatarUrl}" alt="avatar">
        </div>

      <div class="user-name">${u.name || "-"}</div>

      <div class="user-meta">
        ${u.position || "직책 없음"} · ${u.department || "부서 없음"}
      </div>

      ${
        intro
          ? `<div class="user-intro">${intro}</div>`
          : `<div class="user-intro empty">소개글 없음</div>`
      }

      <div class="user-username">${u.username}</div>

      <div class="user-actions">
        ${profileBtn}
      </div>

      ${adminMenu}
    </div>
  `;
}

/* ===== superadmin 기능 ===== */

async function resetPassword(id) {
  if (localStorage.getItem("role") !== "superadmin") return;

  const pw = prompt("새 비밀번호:");
  if (!pw) return;

  await fetch(`${API}/users/${id}/reset-password`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword: pw })
  });

  alert("비밀번호 변경 완료");
}

async function deleteUser(id) {

    if (localStorage.getItem("role") !== "superadmin") {
    alert("권한 없음");
    return;
    }

  if (!confirm("삭제하시겠습니까?")) return;

  await fetch(`${API}/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false)
  });

  loadUsers();
}

function initAddUser() {
  if (localStorage.getItem("role") !== "superadmin") return;

  document.getElementById("addUserPanel").style.display = "block";

  document.getElementById("addUserBtn").onclick = async () => {
    const username = document.getElementById("new_username").value.trim();
    const name = document.getElementById("new_name").value.trim();
    const password = document.getElementById("new_password").value.trim();
    const role = document.getElementById("new_role").value;

    if (!username || !password) {
      alert("필수값 누락");
      return;
    }

    await fetch(`${API}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, name, password, role })
    });

    loadUsers();
  };
}



/* ===============================
   AVATAR MODAL CONTROL
=============================== */
function openAvatarModal(src) {
  const modal = document.getElementById("avatarModal");
  const img = document.getElementById("avatarModalImg");

  img.src = src;
  modal.classList.add("active");
}

function closeAvatarModal() {
  const modal = document.getElementById("avatarModal");
  modal.classList.remove("active");
}

/* 배경 클릭 닫기 */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("avatar-modal-backdrop")) {
    closeAvatarModal();
  }
});

/* ESC 키 닫기 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAvatarModal();
});
