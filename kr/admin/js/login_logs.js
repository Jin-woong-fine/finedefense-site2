async function loadLoginLogs() {
  const search = document.getElementById("searchInput").value.trim();
  const table = document.getElementById("logTable");

  const res = await fetch("/api/logs/login", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  const logs = await res.json();

  const filtered = search
    ? logs.filter(l => l.username && l.username.includes(search))
    : logs;

  table.innerHTML = filtered.map(l => `
    <tr>
      <td>${l.id}</td>
      <td>${l.user_id || "-"}</td>
      <td>${l.username}</td>
      <td>${l.ip}</td>
      <td>${l.ua}</td>
      <td>
        <span class="${l.status === 'success' ? 'status-success' : 'status-fail'}">
          ${l.status}
        </span>
      </td>
      <td>${l.created_at}</td>
    </tr>
  `).join("");
}

loadLoginLogs();
