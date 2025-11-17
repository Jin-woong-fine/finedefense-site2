/* ============================================================================
   📌 제품 상세 페이지 로직 (product-view.js)
============================================================================ */

document.addEventListener("DOMContentLoaded", loadProductDetail);

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    console.error("❌ productId 없음");
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error("서버에서 제품 데이터를 불러올 수 없음");

    const data = await res.json();
    renderProduct(data);

  } catch (err) {
    console.error("❌ loadProductDetail Error:", err);
  }
}

/* ============================================================================
   📌 페이지에 실제로 렌더링
============================================================================ */
function renderProduct({ product, images }) {
  // 요소들
  const titleEl = document.getElementById("productTitle");
  const categoryEl = document.getElementById("productCategory");
  const descEl = document.getElementById("productDesc");
  const mainImageEl = document.getElementById("mainImage");
  const thumbListEl = document.getElementById("thumbList");
  const crumbProduct = document.getElementById("crumbProduct");

  // 카테고리 표시용
  const categoryLabel = getCategoryLabel(product.category);

  // 제목, 카테고리
  titleEl.textContent = product.title;
  categoryEl.textContent = `카테고리: ${categoryLabel}`;
  crumbProduct.textContent = product.title;

  // 대표 이미지 설정
  const mainImg = product.thumbnail
    ? product.thumbnail
    : "/img/products/Image-placeholder.png";

  mainImageEl.src = mainImg;

  // 상세 이미지 목록에서 대표 이미지 제거
  const detailImgs = images.filter(img => img.url !== product.thumbnail);

  /* 🔥 썸네일 렌더링 */
  thumbListEl.innerHTML = "";

  // 1) 대표 이미지 → 썸네일 첫 번째로 표시
  const allThumbs = [
    { url: mainImg, isMain: true },
    ...detailImgs.map(img => ({ url: img.url, isMain: false }))
  ];

  allThumbs.forEach((img, idx) => {
    const t = document.createElement("img");
    t.src = img.url;
    if (idx === 0) t.classList.add("active");

    // 클릭 시 메인 이미지 변경
    t.addEventListener("click", () => {
      document.querySelectorAll(".thumb-list img").forEach(el =>
        el.classList.remove("active")
      );
      t.classList.add("active");
      mainImageEl.src = img.url;
    });

    thumbListEl.appendChild(t);
  });

  // 설명 HTML 삽입
  descEl.innerHTML = product.description_html || "<p>설명 없음</p>";
}

/* ============================================================================
   📌 카테고리 라벨 변환
============================================================================ */
function getCategoryLabel(code) {
  switch (code) {
    case "towed": return "수중이동형 케이블";
    case "fixed": return "수중고정형 케이블";
    case "connector": return "수중 커넥터";
    case "custom": return "커스텀 케이블";
    default: return "기타";
  }
}
