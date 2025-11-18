console.log("%c[user_profile] load", "color:#4caf50;font-weight:bold;");

const API = "/api";

async function loadProfile() {
  const username = localStorage.getItem("username") || "";
  const name = localStorage.getItem("name") || "";
  const role = localStorage.getItem("role") || "";

  document.getElementById("pf_username").value = username;
  document.getElementById("pf_name").value = name;
  document.getElementById("pf_role").value = role;
}

async function saveProfile() {
  const id = localStorage.getItem("id");
  const newName = document.getElementById("pf_name").value.trim();
  const newPw = document.getElementById("pf_newpw").value.trim();

  if (!id) return alert("로그인 정보 오류");

  // 이름 변경 API
  if (newName.length > 0) {
    await fetch(`${API}/users/${id}/update-name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ name: newName })
    });

    localStorage.setItem("name", newName);
  }

  // 비밀번호 변경 API
  if (newPw.length > 0) {
    await fetch(`${API}/users/${id}/reset-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ newPassword: newPw })
    });
  }

  alert("프로필이 저장되었습니다.");
  document.getElementById("pf_newpw").value = "";
}

document.addEventListener("DOMContentLoaded", loadProfile);
