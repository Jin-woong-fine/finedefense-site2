console.log("%c[user_view] 로드됨", "color:#4caf50;font-weight:bold;");

const API = "/api";
const defaultAvatar = "/img/admin/avatar-placeholder.png";

document.addEventListener("DOMContentLoaded", () => {
  initTopbarName();
  loadUserProfileFromQuery();
});

function initTopbarName() {
  const u = getUser();
  const topName = document.getElementById("topbarUserName");
  if (topName) topName.textContent = u.name || "사용자";
}

function getQueryId() {
  const params = new URLSearchParams(location.search);
  return params.get("id");
}

async function loadUserProfileFromQuery() {
  const id = getQueryId();
  if (!id) {
    alert("사용자 ID가 없습니다.");
    return;
  }

  try {
    const res = await fetch(`${API}/users/${id}/profile`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      alert("사용자 정보를 불러올 수 없습니다.");
      return;
    }

    const data = await res.json();

    document.getElementById("uvName").textContent =
      data.name || data.username || "이름 없음";
    document.getElementById("uvRole").textContent = data.role || "-";
    document.getElementById("uvUsername").textContent = data.username || "";
    document.getElementById("uvDept").textContent = data.department || "-";
    document.getElementById("uvPosition").textContent = data.position || "-";
    document.getElementById("uvCreated").textContent =
      data.created_at || "";

    document.getElementById("uvIntro").textContent =
      data.intro || "소개가 없습니다.";

    document.getElementById("uvAvatar").src =
      data.avatar_url || defaultAvatar;
  } catch (err) {
    console.error("user_view 로드 오류:", err);
    alert("사용자 정보를 불러오는 중 오류가 발생했습니다.");
  }
}
