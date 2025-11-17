/* ============================================================
   📌 인증 토큰 (매 fetch 시마다 직접 localStorage에서 읽음)
============================================================ */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


/* ============================================================
   📌 게시물 리스트 불러오기
============================================================ */
async function loadPosts() {
  try {
    const res = await fetch(`/api/posts/list/news?withViews=1&lang=kr`, {
      headers: getAuthHeaders()
    });

    const posts = await res.json();
    const list = document.getElementById("posts");
    if (!list) return;

    list.innerHTML = posts.map(p => `
      <div class="post-item">
        <div style="flex:1;">
          <strong style="font-size:16px;">${p.title}</strong>

          <div style="color:#666; font-size:13px; margin-top:4px;">
            카테고리: <b>${p.category}</b> | 언어: <b>${p.lang}</b>
          </div>

          <div style="margin-top:6px; color:#0f2679; font-weight:600;">
            조회수: ${(p.total_views || 0).toLocaleString()} 회
          </div>

          <div style="display:flex; gap:6px; margin-top:10px;">
            ${
              p.images?.length
                ? p.images.map(img => `
                    <img src="${img}"
                         style="width:55px;height:55px;border:1px solid #ddd;border-radius:6px;object-fit:cover;">
                  `).join("")
                : "<span style='color:#aaa;'>이미지 없음</span>"
            }
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <button class="edit-btn" onclick="editPost(${p.id})">수정</button>
          <button class="delete-btn" onclick="deletePost(${p.id})">삭제</button>
        </div>
      </div>
    `).join("");

  } catch (e) {
    console.error("loadPosts Error:", e);
  }
}

window.deletePost = async (id) => {
  if (!confirm("삭제하시겠습니까?")) return;

  await fetch(`/api/posts/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  loadPosts();
};

window.editPost = (id) => {
  location.href = `/kr/admin/edit_post.html?id=${id}`;
};


/* ============================================================
   📊 관리자 통계 불러오기
============================================================ */
async function loadDashboardStats() {
  try {
    const res = await fetch(`/api/admin/dashboard`, {
      headers: getAuthHeaders()
    });

    const data = await res.json();

    document.getElementById("thisMonthViews").textContent =
      data.thisMonthViews.toLocaleString();

    document.getElementById("lastMonthViews").textContent =
      data.lastMonthViews.toLocaleString();

    document.getElementById("totalPosts").textContent =
      data.postCount.toLocaleString();

    let growth = 0;
    if (data.lastMonthViews > 0) {
      growth = ((data.thisMonthViews - data.lastMonthViews) /
        data.lastMonthViews * 100).toFixed(1);
    }
    document.getElementById("growthRate").textContent = growth + "%";

    /* TOP 5 게시물 */
    document.getElementById("topPostsList").innerHTML = data.topPosts.map(
      p => `<li>${p.title} — <strong>${(p.total_views || 0).toLocaleString()}</strong> 회</li>`
    ).join("");

    /* 최신 제품 */
    if (document.getElementById("recentProducts")) {
      const box = document.getElementById("recentProducts");

      if (data.recentProducts.length === 0) {
        box.innerHTML = `<p style="color:#777;">등록된 제품이 없습니다.</p>`;
      } else {
        box.innerHTML = data.recentProducts.map(p => `
          <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #eee;">
            <img src="${p.image || '/img/no-image.png'}"
                 style="width:60px; height:45px; object-fit:cover; border-radius:6px; border:1px solid #ddd;">
            <div style="flex:1;">
              <div style="font-size:15px; font-weight:600;">${p.title}</div>
              <div style="font-size:13px; color:#666;">
                카테고리: ${p.category} / 언어: ${p.lang}
              </div>
            </div>
          </div>
        `).join("");
      }
    }
  } catch (e) {
    console.error("loadDashboardStats Error:", e);
  }
}


/* ============================================================
   📈 월별 조회수 그래프
============================================================ */
async function loadMonthlyChart() {
  try {
    const res = await fetch("/api/admin/monthly-views", {
      headers: getAuthHeaders()
    });

    const data = await res.json();
    const ordered = [...data].reverse();

    const labels = ordered.map(d => `${d.year}-${String(d.month).padStart(2, "0")}`);
    const values = ordered.map(d => d.total_views);

    const ctx = document.getElementById("monthlyChart");

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "월별 조회수",
          data: values,
          borderWidth: 2,
          borderColor: "#0f2679",
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

  } catch (e) {
    console.error("loadMonthlyChart Error:", e);
  }
}


/* ============================================================
   ⚙ 초기 실행 (DOM 준비 후 실행)
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
  loadDashboardStats();
  loadMonthlyChart();
});
