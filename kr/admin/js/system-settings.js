function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadIpSettings();
  loadIpList();

  document
    .getElementById("ipToggle")
    .addEventListener("change", toggleIpLimit);
});

/* ===============================
   IP 제한 ON / OFF
================================ */
async function loadIpSettings() {
  const res = await fetch("/api/admin/ip-settings", {
    headers: authHeaders()
  });
  const data = await res.json();

  const toggle = document.getElementById("ipToggle");
  const status = document.getElementById("ipStatus");

  toggle.checked = data.enabled === 1;

  status.textContent = toggle.checked ? "ON" : "OFF";
  status.className = "badge " + (toggle.checked ? "on" : "off");
}

async function toggleIpLimit(e) {
  const enabled = e.target.checked;

  if (!confirm(`관리자 IP 제한을 ${enabled ? "활성화" : "비활성화"} 하시겠습니까?`)) {
    e.target.checked = !enabled;
    return;
  }

  await fetch("/api/admin/ip-settings", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ enabled })
  });

  loadIpSettings();
}

/* ===============================
   IP 화이트리스트
================================ */
async function loadIpList() {
  const res = await fetch("/api/admin/ip-whitelist", {
    headers: authHeaders()
  });
  const list = await res.json();

  const tbody = document.getElementById("ipTableBody");
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="3">등록된 IP 없음</td></tr>`;
    return;
  }

  list.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.ip}</td>
      <td>${row.label || ""}</td>
      <td>
        <button class="btn btn-danger" onclick="deleteIp(${row.id})">
          삭제
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function addIp() {
  const ip = document.getElementById("newIp").value.trim();
  const label = document.getElementById("newLabel").value.trim();

  if (!ip) {
    alert("IP 주소를 입력하세요.");
    return;
  }

  await fetch("/api/admin/ip-whitelist", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ip, label })
  });

  document.getElementById("newIp").value = "";
  document.getElementById("newLabel").value = "";

  loadIpList();
}

async function deleteIp(id) {
  if (!confirm("이 IP를 삭제하시겠습니까?")) return;

  const res = await fetch(`/api/admin/ip-whitelist/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  const data = await res.json();
  if (data.message) {
    alert(data.message);
  }

  loadIpList();
}
