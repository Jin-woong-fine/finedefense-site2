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
// 국가 코드 → 플래그
// ===============================
function countryFlag(code) {
  if (!code || code.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

// ===============================
// UA 간단화
// ===============================
function shortUA(ua = "") {
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Other";
}

// ===============================
// 로그인 로그 로드 (확장판)
// ===============================
async function loadLoginLogs() {
  const search = document.getElementById("searchInput").value.trim();
  const table = document.getElementById("logTable");

  try {
    const res = await fetch("/api/login-logs", {
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
          <td colspan="9" style="text-align:center; padding:20px;">
            로그인 기록이 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    table.innerHTML = filtered.map(l => `
      <tr class="${
        l.country_code && l.country_code !== "KR" && l.country_code !== "LOCAL"
          ? "foreign-login"
          : ""
      }">
        <td>${l.id}</td>
        <td>${l.username || "-"}</td>
        <td class="${l.is_admin ? "role-admin" : ""}">
          ${l.is_admin ? "ADMIN" : "USER"}
        </td>
        <td>${l.ip || "-"}</td>
        <td>
          <span class="flag">${countryFlag(l.country_code)}</span>
          ${l.country_code || "-"}
        </td>
        <td title="${l.ua || ""}">
          ${shortUA(l.ua)}
        </td>
        <td class="status-${l.status}">
          ${l.status.toUpperCase()}
        </td>
        <td class="fail-reason">
          ${l.fail_reason || "-"}
        </td>
        <td>${formatKST(l.created_at)}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
    table.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; color:red;">
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
