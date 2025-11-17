/* ============================================================
   🟦 제품 상세 페이지 JS (중복 이미지 제거 + 갤러리 기능 포함)
============================================================ */

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) return alert("잘못된 접근입니다.");

  // API 요청
  const res = await fetch(`/api/products/${productId}`);
  if (!res.ok) {
    document.getElementById("productDesc").innerHTML = "<p>제품을 불러올 수 없습니다.</p>";
    return;
  }

  const { product, images } = await res.json();

  // HTML 적용
  document.getElementById("productTitle").textContent = product.title;
  document.getElementById("crumbProduct").textContent = product.title;

  /* 카테고리 텍스트 매핑 */
  const categoryMap = {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블"
  };
  document.getElementById("productCategory").textContent =
    categoryMap[product.category] || product.category;

  /* 메인 이미지 설정 */
  const mainImage = document.getElementById("mainImage");
  mainImage.src = product.thumbnail || "/img/products/Image-placeholder.png";

  /* 🔥 상세 이미지에서 대표 이미지 제거 */
  const detailedImages = images.filter(img => img.url !== product.thumbnail);

  /* 상세 이미지 썸네일 렌더링 */
  const thumbList = document.getElementById("thumbList");
  thumbList.innerHTML = detailedImages
    .map(
      (img, idx) => `
      <img 
        src="${img.url}" 
        class="thumb" 
        data-url="${img.url}"
      >
    `
    )
    .join("");

  // 첫 번째 상세 이미지 활성화 표시
  const thumbs = thumbList.querySelectorAll("img");
  if (thumbs.length > 0) {
    thumbs[0].classList.add("active");
  }

  /* 🔄 썸네일 클릭 → 메인 이미지 교체 */
  thumbs.forEach(t => {
    t.addEventListener("click", () => {
      mainImage.src = t.dataset.url;

      thumbs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
    });
  });

  /* 제품 설명 적용 */
  document.getElementById("productDesc").innerHTML =
    product.description_html || "<p>제품 설명이 없습니다.</p>";
}

document.addEventListener("DOMContentLoaded", loadProductDetail);
