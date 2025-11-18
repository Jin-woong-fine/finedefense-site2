console.log("%c[users_core] 로드 완료", "color:#4caf50;font-weight:bold;");

const API = "/api";
const token = localStorage.getItem("token");

// ============================================
// 공통 헤더
// ============================================
function getAuthHeaders(isJSON = true) {
  const headers = { Authorization: `Bearer ${token}` };
  if (isJSON) headers["Content-Type"] = "application/json";
  return headers;
}

// ============================================
// 초기 실행
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  initAddUser();
});

// ============================================
// 사용자 목록 로드 + 자기 자신 예외 처리 포함
// ============================================
async function loadUsers() {
  const table = document.getElementById("usersTable");
  table.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

  const res = await fetch(`${API}/users`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    table.innerHTML = "<tr><td colspan='6'>로드 실패</td></tr>";
    return;
  }

  const users = await res.json();
  const myId = Number(localStorage.getItem("user_id"));
  const myRole = localStorage.getItem("role");

  table.innerHTML = users
    .map((u) => {
      let actions = "";

      // ================================
      // 자기 자신인 경우
      // ================================
      if (u.id === myId) {
        actions = `
          <button class="btn-small btn-edit" onclick="resetPassword(${u.id})">
            비번초기화
          </button>
        `;
        return rowTemplate(u, "-", actions);
      }

      // ================================
      // superadmin (전체 관리 가능)
      // ================================
      if (myRole === "superadmin") {
        const roleSelect = `
          <select onchange="changeUserRole(${u.id}, this.value)">
            <option value="viewer" ${u.role === "viewer" ? "selected" : ""}>viewer</option>
            <option value="editor" ${u.role === "editor" ? "selected" : ""}>editor</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
            <option value="superadmin" ${u.role === "superadmin" ? "selected" : ""}>superadmin</option>
          </select>
        `;

        actions = `
          <button class="btn-small btn-edit" onclick="resetPassword(${u.id})">비번초기화</button>
          <button class="btn-small btn-delete" onclick="deleteUser(${u.id})">삭제</button>
        `;

        return rowTemplate(u, roleSelect, actions);
      }

      // ================================
      // admin (조회만 가능 + 자기 자신만 초기화)
      // ================================
      if (myRole === "admin") {
        // 자기 자신은 위에서 걸러짐
        return rowTemplate(u, u.role, "-");
      }

      // 기타 권한 접근 X
      return rowTemplate(u, u.role, "-");
    })
    .join("");
}

// ============================================
// 행 템플릿 함수
// ============================================
function rowTemplate(u, roleCell, actionCell) {
  return `
    <tr>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.name || "-"}</td>
      <td>${roleCell}</td>
      <td>${u.created_at}</td>
      <td>${actionCell}</td>
    </tr>
  `;
}

// ============================================
// 역할 변경 (superadmin)
// ============================================
async function changeUserRole(id, newRole) {
  if (!confirm("권한을 변경하시겠습니까?")) return;

  const res = await fetch(`${API}/users/${id}/role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role: newRole })
  });

  if (!res.ok) return alert("역할 변경 실패");
  alert("역할 변경 완료");
  loadUsers();
}

// ============================================
// 비밀번호 초기화
// ============================================
async function resetPassword(id) {
  const newPw = prompt("새 비밀번호를 입력하세요:");
  if (!newPw) return;

  const res = await fetch(`${API}/users/${id}/reset-password`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ newPassword: newPw })
  });

  if (!res.ok) return alert("비밀번호 초기화 실패");

  alert("비밀번호 변경 완료");
}

// ============================================
// 사용자 삭제
// ============================================
async function deleteUser(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  const res = await fetch(`${API}/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  if (!res.ok) return alert("삭제 실패");

  alert("삭제 완료");
  loadUsers();
}

// ============================================
// 사용자 추가 (superadmin)
// ============================================
function initAddUser() {
  const role = localStorage.getItem("role");
  const panel = document.getElementById("addUserPanel");

  if (role === "superadmin") {
    panel.style.display = "block";
  }

  const btn = document.getElementById("addUserBtn");
  btn.addEventListener("click", async () => {
    const username = document.getElementById("new_username").value.trim();
    const name = document.getElementById("new_name").value.trim();
    const password = document.getElementById("new_password").value.trim();
    const newRole = document.getElementById("new_role").value;

    if (!username || !password) {
      return alert("아이디와 비밀번호를 입력하세요.");
    }

    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, name, password, role: newRole })
    });

    if (!res.ok) return alert("추가 실패");

    alert("추가 완료");
    document.getElementById("new_username").value = "";
    document.getElementById("new_name").value = "";
    document.getElementById("new_password").value = "";

    loadUsers();
  });
}
