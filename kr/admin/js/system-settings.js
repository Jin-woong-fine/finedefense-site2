// 🔐 전역 상태 (필수)
let ipLimitEnabled = false;
let myIpCache = null;

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadIpSettings();
  await loadIpList();

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

  if (!res.ok) {
    alert("IP 설정을 불러오지 못했습니다.");
    return;
  }

  const data = await res.json();

  const toggle = document.getElementById("ipToggle");
  const status = document.getElementById("ipStatus");

  toggle.checked = data.enabled === 1;
  ipLimitEnabled = toggle.checked; // 🔥 핵심

  status.textContent = toggle.checked ? "ON" : "OFF";
  status.className = "badge " + (toggle.checked ? "on" : "off");
}


async function toggleIpLimit(e) {
  const enabled = e.target.checked;

  // 🔒 ON인데 IP가 0개면 차단
  if (enabled) {
    const res = await fetch("/api/admin/ip-whitelist", {
      headers: authHeaders()
    });

    if (!res.ok) {
        alert("IP 목록을 불러올 수 없습니다.");
        e.target.checked = false;
        return;
    }

    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
    alert("IP 제한을 활성화하려면 최소 1개의 IP가 필요합니다.");
    e.target.checked = false;
    return;
    }

  }

  if (!confirm(`관리자 IP 제한을 ${enabled ? "활성화" : "비활성화"} 하시겠습니까?`)) {
    e.target.checked = !enabled;
    return;
  }

  await fetch("/api/admin/ip-settings", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ enabled })
  });

  ipLimitEnabled = enabled;
  loadIpSettings();
}


/* ===============================
   IP 화이트리스트
================================ */
async function loadIpList() {
  const tbody = document.getElementById("ipTableBody");
  tbody.innerHTML = "";

  // 🔹 내 IP 캐시
  if (!myIpCache) {
    const my = await fetch("/api/admin/ip-my", {
      headers: authHeaders()
    });
    if (my.ok) {
      const out = await my.json();
      myIpCache = out.ip;
    }
  }

  const res = await fetch("/api/admin/ip-whitelist", {
    headers: authHeaders()
  });

  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="3">불러오기 실패</td></tr>`;
    return;
  }

  const list = await res.json();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="3">등록된 IP 없음</td></tr>`;
    return;
  }

  list.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input type="text" value="${row.ip}"
          data-field="ip" style="width:160px">
      </td>

      <td>
        <input type="text" value="${row.label || ""}"
          data-field="label" placeholder="설명" style="width:180px">
      </td>

      <td style="display:flex; gap:6px;">
        <button class="btn btn-primary"
          onclick="updateIp(${row.id}, this)">저장</button>

        <button class="btn btn-danger"
          ${row.ip === myIpCache ? "disabled title='현재 접속 IP는 삭제할 수 없습니다'" : ""}
          onclick="deleteIp(${row.id})">삭제</button>
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

    const res = await fetch("/api/admin/ip-whitelist", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ip, label })
    });

    if (!res.ok) {
    const err = await res.json();
    alert(err.message || "IP 추가 실패");
    return;
    }


  document.getElementById("newIp").value = "";
  document.getElementById("newLabel").value = "";

  loadIpList();
}

async function deleteIp(id) {
  const resList = await fetch("/api/admin/ip-whitelist", {
    headers: authHeaders()
  });

    if (!resList.ok) {
        alert("IP 목록을 확인할 수 없습니다.");
        return;
    }

  const list = await resList.json();

  if (ipLimitEnabled && list.length <= 1) {
    alert("IP 제한이 활성화된 상태에서는 최소 1개의 IP가 필요합니다.");
    return;
  }

  if (!confirm("이 IP를 삭제하시겠습니까?")) return;

  await fetch(`/api/admin/ip-whitelist/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  loadIpList();
}




async function updateIp(id, btn) {
  const tr = btn.closest("tr");

  const ip = tr.querySelector('input[data-field="ip"]').value.trim();
  const label = tr.querySelector('input[data-field="label"]').value.trim();

  if (!ip) {
    alert("IP 주소는 필수입니다.");
    return;
  }

  const res = await fetch(`/api/admin/ip-whitelist/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ ip, label })
  });

  if (!res.ok) {
    alert("저장 실패");
    return;
  }

  showToast("저장 완료");
  loadIpList();
}


async function addMyIp() {
  const res = await fetch("/api/admin/ip-my", {
    headers: authHeaders()
  });

  if (!res.ok) {
    alert("IP 확인 실패");
    return;
  }

  const { ip } = await res.json();

  const listRes = await fetch("/api/admin/ip-whitelist", {
    headers: authHeaders()
  });
  const list = await listRes.json();

  if (list.some(row => row.ip === ip)) {
    alert("이미 등록된 IP입니다.");
    return;
  }

    const addRes = await fetch("/api/admin/ip-whitelist", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
        ip,
        label: "현재 접속 IP"
    })
    });

    if (!addRes.ok) {
    const err = await addRes.json();
    alert(err.message || "IP 추가 실패");
    return;
    }

    showToast("내 IP가 추가되었습니다");
    loadIpList();
}

