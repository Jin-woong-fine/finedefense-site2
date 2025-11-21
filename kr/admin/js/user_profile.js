console.log("%c[user_profile] 로드됨", "color:#4caf50;font-weight:bold;");

const API_BASE = "/api";
const defaultAvatar = "/img/admin/avatar-placeholder.png"; // 없으면 나중에 만들어도 됨

document.addEventListener("DOMContentLoaded", () => {
  loadMyProfile();
  initProfileSave();
  initAvatarUpload();
});

// =======================================
// 🔵 내 프로필 로드
// =======================================
async function loadMyProfile() {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      console.error("내 프로필 로드 실패");
      return;
    }

    const data = await res.json();

    document.getElementById("profileUsername").value = data.username || "";
    document.getElementById("profileName").value = data.name || "";
    document.getElementById("profileDept").value = data.department || "";
    document.getElementById("profilePosition").value = data.position || "";
    document.getElementById("profileIntro").value = data.intro || "";

    document.getElementById("profileNameLabel").textContent =
      data.name || data.username || "이름 없음";
    document.getElementById("profileRoleLabel").textContent = data.role || "-";

    // 🔥 avatar_url → avatar 로 수정
    const avatarImg = document.getElementById("avatarPreview");
    avatarImg.src = data.avatar || defaultAvatar;

    const topName = document.getElementById("topbarUserName");
    if (topName) topName.textContent = data.name || data.username || "사용자";
  } catch (err) {
    console.error("loadMyProfile 오류:", err);
  }
}

// =======================================
// 🔵 프로필 저장 (이름/부서/직급/소개)
// =======================================
function initProfileSave() {
  const btn = document.getElementById("profileSaveBtn");
  btn.addEventListener("click", async () => {
    const body = {
      name: document.getElementById("profileName").value.trim(),
      department: document.getElementById("profileDept").value.trim(),
      position: document.getElementById("profilePosition").value.trim(),
      intro: document.getElementById("profileIntro").value.trim(),
    };

    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PUT",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      alert("프로필 저장 실패");
      return;
    }

    alert("프로필이 저장되었습니다.");
    loadMyProfile(); // 저장 후 자동 리로드
  });
}

// =======================================
// 🔵 아바타 업로드
// =======================================
function initAvatarUpload() {
  const fileInput = document.getElementById("avatarFile");
  const btn = document.getElementById("avatarUploadBtn");
  const preview = document.getElementById("avatarPreview");

  // 선택한 파일 미리보기 표시
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    preview.src = url;
  });

  // 파일 업로드
  btn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("업로드할 이미지를 선택하세요.");
      return;
    }

    const fd = new FormData();
    fd.append("avatar", file);

    const res = await fetch(`${API_BASE}/users/me/avatar`, {
      method: "POST",
      headers: authHeaders(), // FormData는 Content-Type 자동 설정됨
      body: fd,
    });

    if (!res.ok) {
      alert("아바타 업로드 실패");
      return;
    }

    const data = await res.json();

    // 🔥 avatar_url → avatar 로 변경
    preview.src = data.avatar || defaultAvatar;

    alert("아바타가 업데이트되었습니다.");
  });
}
