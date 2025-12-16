// ===============================
// 시간 포맷 (KST)
// ===============================
function formatKST(dateString) {
  if (!dateString) return "-";

  const d = new Date(dateString);

  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ===============================
// 로그인 로그 로드
// ===============================
async function loadLoginLogs() {
  const search = document.getElementById("searchInput").value.trim();
  const table = document.getElementById("logTable");

  try {
    const res = await fetch("/api/logs/login", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) throw new Error("로그 조회 실패");

    const logs = await res.json();

    const filtered = search
      ? logs.filter(l => l.username && l.username.includes(search))
      : logs;

    if (filtered.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:20px;">
            로그인 기록이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    table.innerHTML = filtered.map(l => `
      <tr>
        <td>${l.id}</td>
        <td>${l.user_id || "-"}</td>
        <td>${l.username || "-"}</td>
        <td>${l.ip || "-"}</td>
        <td title="${l.ua || ""}">
          ${(l.ua || "").slice(0, 40)}
        </td>
        <td>
          <span class="${l.status === "success" ? "status-success" : "status-fail"}">
            ${l.status}
          </span>
        </td>
        <td>${formatKST(l.created_at)}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
    table.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:red;">
          로그를 불러오지 못했습니다.
        </td>
      </tr>
    `;
  }
}

// ===============================
// 초기 로드
// ===============================
loadLoginLogs();
