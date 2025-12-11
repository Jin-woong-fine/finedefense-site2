// kr/admin/js/dashboard_core.js

console.log("%c[dashboard_core] 로드 완료", "color:#4caf50;font-weight:bold;");

/* -----------------------------------------------------
   공통 GET 요청
----------------------------------------------------- */
function apiGet(url) {
  return fetch(url, { headers: authHeaders() });
}

/* -----------------------------------------------------
   1) KPI / 기본 통계
----------------------------------------------------- */
async function loadBasicStats() {
  try {
    // 오늘 방문자
    const todayRes = await apiGet("/api/traffic/daily");
    const todayData = await todayRes.json();
    const todayVisits = todayData?.[0]?.visits || 0;
    document.getElementById("visitToday").textContent = todayVisits.toLocaleString();

    // 이번달 방문자
    const monthRes = await apiGet("/api/traffic/monthly");
    const monthData = await monthRes.json();
    const thisMonth = monthData?.[0]?.visits || 0;
    const lastMonth = monthData?.[1]?.visits || 0;

    document.getElementById("visitThisMonth").textContent = thisMonth.toLocaleString();

    // 증가율
    let growth = 0;
    if (lastMonth > 0) {
      growth = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1);
    }
    document.getElementById("visitGrowth").textContent = growth + "%";

    // 게시물 수
    const postRes = await apiGet("/api/admin/dashboard");
    const postData = await postRes.json();
    document.getElementById("totalPosts").textContent =
      (postData.postCount || 0).toLocaleString();

  } catch (err) {
    console.error("KPI Error:", err);
  }
}

/* -----------------------------------------------------
   2) 최근 30일 방문자 그래프
----------------------------------------------------- */
async function loadDailyChart() {
  try {
    const res = await apiGet("/api/traffic/daily");
    const data = await res.json();

    const labels = data.map((d) => d.day).reverse();
    const values = data.map((d) => d.visits).reverse();

    new Chart(document.getElementById("dailyChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "일별 방문자",
            data: values,
            borderColor: "#0f2679",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 2,
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  } catch (err) {
    console.error("loadDailyChart Error:", err);
  }
}

/* -----------------------------------------------------
   3) 디바이스 비율 차트
----------------------------------------------------- */
async function loadDeviceChart() {
  try {
    const res = await apiGet("/api/traffic/device");
    const data = await res.json();

    const labels = data.map((d) => d.device_type);
    const values = data.map((d) => d.cnt);

    new Chart(document.getElementById("deviceChart"), {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#0f2679", "#4a6bb0", "#93a9d1"],
          },
        ],
      },
      options: { responsive: true },
    });
  } catch (err) {
    console.error("loadDeviceChart Error:", err);
  }
}

/* -----------------------------------------------------
   4) 국가별 통계
----------------------------------------------------- */
async function loadCountryChart() {
  try {
    const res = await apiGet("/api/traffic/country");
    const data = await res.json();

    const labels = data.map((d) => d.country);
    const values = data.map((d) => d.cnt);

    new Chart(document.getElementById("countryChart"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "국가별 트래픽",
            data: values,
            backgroundColor: "#0f2679",
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  } catch (err) {
    console.error("loadCountryChart Error:", err);
  }
}

/* -----------------------------------------------------
   5) 유입경로 TOP5
----------------------------------------------------- */
async function loadReferrerList() {
  try {
    const res = await apiGet("/api/traffic/referrer");
    const data = await res.json();

    const ul = document.getElementById("referrerList");
    if (!ul) return;

    if (!data.length) {
      ul.innerHTML = `<li style="color:#777;">유입경로가 없습니다.</li>`;
      return;
    }

    ul.innerHTML = data
      .slice(0, 5)
      .map((r) => `<li>${r.referrer} — <strong>${r.cnt}</strong>회</li>`)
      .join("");
  } catch (err) {
    console.error("loadReferrerList Error:", err);
  }
}

/* -----------------------------------------------------
   6) 페이지뷰 TOP5
----------------------------------------------------- */
async function loadPageViewList() {
  try {
    const res = await apiGet("/api/traffic/page-view");
    const data = await res.json();

    const ul = document.getElementById("pageViewList");
    if (!ul) return;

    if (!data.length) {
      ul.innerHTML = `<li style="color:#777;">페이지뷰 데이터 없음</li>`;
      return;
    }

    ul.innerHTML = data
      .slice(0, 5)
      .map((p) => `<li>${p.page} — <strong>${p.views}</strong>회</li>`)
      .join("");

  } catch (err) {
    console.error("loadPageViewList Error:", err);
  }
}

/* -----------------------------------------------------
   7) 기존 게시물 조회수 / 다운로드 / 제품 목록
----------------------------------------------------- */
async function loadContentStats() {
  try {
    const res = await apiGet("/api/admin/dashboard");
    const data = await res.json();

    /* 조회수 TOP 5 */
    const topList = document.getElementById("topPostsList");
    const topPosts = data.topPosts || [];

    topList.innerHTML =
      topPosts.length === 0
        ? `<li style="color:#777;">조회수 집계 없음</li>`
        : topPosts
            .map(
              (p) => `<li>${p.title} — <strong>${p.total_views || 0}</strong>회</li>`
            )
            .join("");

    /* 자료실 다운로드 TOP 5 */
    const dlList = document.getElementById("downloadTopList");
    const downloadTop = data.downloadTop || [];

    dlList.innerHTML =
      downloadTop.length === 0
        ? `<li style="color:#777;">다운로드 기록 없음</li>`
        : downloadTop
            .map(
              (d) => `<li>${d.title} — <strong>${d.total_downloads || 0}</strong>회</li>`
            )
            .join("");

    /* 최근 제품 */
    const recentBox = document.getElementById("recentProducts");
    const recent = data.recentProducts || [];

    recentBox.innerHTML =
      recent.length === 0
        ? `<p style="color:#777;">최근 등록된 제품이 없습니다.</p>`
        : recent
            .map(
              (p) => `
        <div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #eee;">
          <img src="${p.image || p.thumbnail || '/img/products/Image-placeholder.png'}"
               style="width:60px; height:45px; object-fit:cover; border-radius:6px;">
          <div style="flex:1;">
            <div style="font-size:15px; font-weight:600;">${p.title}</div>
            <div style="font-size:13px; color:#666;">카테고리: ${p.category || '-'} | ${(p.lang || '').toUpperCase()}</div>
          </div>
        </div>
      `
            )
            .join("");

  } catch (err) {
    console.error("loadContentStats Error:", err);
  }
}

/* -----------------------------------------------------
   8) 카탈로그 조회수 TOP 5
----------------------------------------------------- */
async function loadCatalogViewTop() {
  try {
    const res = await apiGet("/api/catalog/top-views");
    const data = await res.json();

    const ul = document.getElementById("catalogViewTopList");
    if (!ul) return;

    ul.innerHTML =
      data.length === 0
        ? `<li style="color:#777;">데이터 없음</li>`
        : data
            .map(
              (c) =>
                `<li>${c.title} — <strong>${c.views}</strong>회</li>`
            )
            .join("");

  } catch (err) {
    console.error("loadCatalogViewTop Error:", err);
  }
}

/* -----------------------------------------------------
   9) 카탈로그 다운로드 TOP 5
----------------------------------------------------- */
async function loadCatalogDownloadTop() {
  try {
    const res = await apiGet("/api/catalog/top-downloads");
    const data = await res.json();

    const ul = document.getElementById("catalogDownloadTopList");
    if (!ul) return;

    ul.innerHTML =
      data.length === 0
        ? `<li style="color:#777;">데이터 없음</li>`
        : data
            .map(
              (c) =>
                `<li>${c.title} — <strong>${c.downloads}</strong>회</li>`
            )
            .join("");

  } catch (err) {
    console.error("loadCatalogDownloadTop Error:", err);
  }
}



/* -----------------------------------------------------
   초기 실행
----------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadBasicStats();
  loadDailyChart();
  loadDeviceChart();
  loadCountryChart();
  loadReferrerList();
  loadPageViewList();
  loadContentStats();
  loadCatalogViewTop();
  loadCatalogDownloadTop();
});
