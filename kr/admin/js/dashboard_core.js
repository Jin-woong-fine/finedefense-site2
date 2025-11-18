// kr/admin/js/dashboard_core.js

console.log("%c[dashboard_core] 로드 완료", "color:#4caf50;font-weight:bold;");

/**
 * 공통 GET 헬퍼
 */
function apiGet(url) {
  return fetch(url, { headers: authHeaders() });
}

/* ============================================================
   📊 관리자 통계 불러오기
============================================================ */
async function loadDashboardStats() {
  try {
    const res = await apiGet("/api/admin/dashboard");
    if (!res.ok) throw new Error("dashboard API error");

    const data = await res.json();

    const thisMonth = data.thisMonthViews ?? 0;
    const lastMonth = data.lastMonthViews ?? 0;
    const postCount = data.postCount ?? 0;
    const topPosts = data.topPosts ?? [];
    const recentProducts = data.recentProducts ?? [];

    // 숫자 카드
    document.getElementById("thisMonthViews").textContent =
      thisMonth.toLocaleString();

    document.getElementById("lastMonthViews").textContent =
      lastMonth.toLocaleString();

    document.getElementById("totalPosts").textContent =
      postCount.toLocaleString();

    // 증가율 계산
    let growth = 0;
    if (lastMonth > 0) {
      growth = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);
    }
    document.getElementById("growthRate").textContent = growth + "%";

    // TOP 5 게시물
    const topList = document.getElementById("topPostsList");
    if (topList) {
      if (topPosts.length === 0) {
        topList.innerHTML = `<li style="color:#777;">조회수 집계된 게시물이 없습니다.</li>`;
      } else {
        topList.innerHTML = topPosts
          .map(
            (p) => `
          <li>
            ${p.title} — 
            <strong>${(p.total_views || 0).toLocaleString()}</strong> 회
          </li>
        `
          )
          .join("");
      }
    }

    // 최근 등록 제품
    const recentBox = document.getElementById("recentProducts");
    if (recentBox) {
      if (!recentProducts.length) {
        recentBox.innerHTML = `<p style="color:#777;">최근 등록된 제품이 없습니다.</p>`;
      } else {
        recentBox.innerHTML = recentProducts
          .map(
            (p) => `
          <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #eee;">
            <img src="${p.image || p.thumbnail || '/img/products/Image-placeholder.png'}"
                 style="width:60px; height:45px; object-fit:cover; border-radius:6px; border:1px solid #ddd;">
            <div style="flex:1;">
              <div style="font-size:15px; font-weight:600;">${p.title}</div>
              <div style="font-size:13px; color:#666;">
                카테고리: ${p.category || '-'} / 언어: ${(p.lang || '').toUpperCase()}
              </div>
            </div>
          </div>
        `
          )
          .join("");
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
    const res = await apiGet("/api/admin/monthly-views");
    if (!res.ok) throw new Error("monthly-views API error");

    const data = await res.json();

    // API가 최신달부터 온다면 reverse 해서 오래된 달 → 최근달 순으로 맞춤
    const ordered = [...data].reverse();

    const labels = ordered.map(
      (d) => `${d.year}-${String(d.month).padStart(2, "0")}`
    );
    const values = ordered.map((d) => d.total_views || 0);

    const ctx = document.getElementById("monthlyChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "월별 조회수",
            data: values,
            borderWidth: 2,
            borderColor: "#0f2679",
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  } catch (e) {
    console.error("loadMonthlyChart Error:", e);
  }
}

/* ============================================================
   ⚙ 초기 실행
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
  loadMonthlyChart();
});
