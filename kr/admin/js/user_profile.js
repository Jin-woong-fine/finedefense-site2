console.log("%c[user_profile] loaded", "color:#4caf50");

const API = "/api/user-profile";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// ==============================
// 🔥 프로필 불러오기
// ==============================
(async function loadProfile() {
  const res = await fetch(API, { headers: authHeader() });
  const data = await res.json();

  document.getElementById("name").value = data.name || "";
  document.getElementById("avatarImg").src = data.avatar || "/img/profile/default_avatar.png";
})();

// ==============================
// 🔥 이름 변경
// ==============================
async function updateName() {
  const name = document.getElementById("name").value.trim();

  const res = await fetch(`${API}/name`, {
    method: "PUT",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) return alert("이름 변경 실패");
  alert("이름 수정 완료!");
}

// ==============================
// 🔥 비밀번호 변경
// ==============================
async function changePassword() {
  const oldPassword = document.getElementById("oldPw").value;
  const newPassword = document.getElementById("newPw").value;

  const res = await fetch(`${API}/password`, {
    method: "PUT",
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const data = await res.json();

  if (!res.ok) return alert(data.message);
  alert("비밀번호 변경 완료!");
}

// ==============================
// 🔥 아바타 업로드
// ==============================
async function uploadAvatar() {
  const file = document.getElementById("avatarInput").files[0];
  if (!file) return alert("이미지를 선택하세요.");

  const fd = new FormData();
  fd.append("avatar", file);

  const res = await fetch(`${API}/avatar`, {
    method: "POST",
    headers: authHeader(),
    body: fd,
  });

  const data = await res.json();
  document.getElementById("avatarImg").src = data.avatar;

  alert("아바타 업로드 완료!");
}
