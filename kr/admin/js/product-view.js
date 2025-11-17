/* ============================================================================
   📌 제품 상세 페이지 로직 (product-view.js)
============================================================================ */

document.addEventListener("DOMContentLoaded", loadProductDetail);

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) return;

  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error("서버 오류");

    const data = await res.json();
    renderProduct(data);

  } catch (err) {
    console.error("loadProductDetail Error:", err);
  }
}

/* ============================================================================
   📌 페이지 렌더링
============================================================================ */
function renderProduct({ product, images }) {
  const titleEl = document.getElementById("productTitle");
  const categoryEl = document.getElementById("productCategory");
  const descEl = document.getElementById("productDesc");
  const mainImageEl = document.getElementById("mainImage");
  const thumbListEl = document.getElementById("thumbList");
  const crumbProduct = document.getElementById("crumbProduct");

  // 카테고리 표시
  const categoryLabel = getCategoryLabel(product.category);

  titleEl.textContent = product.title;
  categoryEl.textContent = `카테고리: ${categoryLabel}`;

  // breadcrumb 수정 (제품명 → 항상 카테고리)
  crumbProduct.textContent = categoryLabel;

  // 대표 이미지
  const mainImg = product.thumbnail
    ? product.thumbnail
    : "/img/products/Image-placeholder.png";

  mainImageEl.src = mainImg;

  /* ============================================================================
      📌 상세 이미지 중복 제거 (대표 이미지 제거)
  ============================================================================ */
  const thumbFile = product.thumbnail ? product.thumbnail.split("/").pop() : null;

  const detailImgs = images.filter(img => {
    if (!thumbFile) return true;
    const file = img.url.split("/").pop();
    return file !== thumbFile;
  });

  /* ============================================================================
      📌 썸네일 렌더링
  ============================================================================ */
  thumbListEl.innerHTML = "";

  const allThumbs = [
    { url: mainImg, isMain: true },
    ...detailImgs.map(img => ({ url: img.url }))
  ];

  allThumbs.forEach((img, idx) => {
    const t = document.createElement("img");
    t.src = img.url;

    if (idx === 0) t.classList.add("active");

    t.addEventListener("click", () => {
      document.querySelectorAll(".thumb-list img").forEach(el =>
        el.classList.remove("active")
      );
      t.classList.add("active");
      mainImageEl.src = img.url;
    });

    thumbListEl.appendChild(t);
  });

  // description_html
  descEl.innerHTML = product.description_html || "<p>설명이 없습니다.</p>";
}

/* ============================================================================
   📌 카테고리 라벨
============================================================================ */
function getCategoryLabel(code) {
  return {
    towed: "수중이동형케이블",
    fixed: "수중고정형케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[code] || "기타";
}
