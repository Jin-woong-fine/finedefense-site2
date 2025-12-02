document.addEventListener("DOMContentLoaded", loadProductDetail);

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const res = await fetch(`/api/products/${id}`);
  const out = await res.json();

  renderProduct(out);
}

/* 렌더링 */
function renderProduct({ product, images }) {
  document.getElementById("productTitle").textContent = product.title;
  document.getElementById("productCategory").textContent =
    "카테고리: " + getCategoryLabel(product.category);

  document.getElementById("crumbProduct").textContent =
    getCategoryLabel(product.category);

  /* 대표 이미지 */
  const mainImg = product.thumbnail || "/img/products/Image-placeholder.png";

  const mainImageEl = document.getElementById("mainImage");
  const mainImageLink = document.getElementById("mainImageLink");

  mainImageEl.src = mainImg;
  mainImageLink.href = mainImg;

  /* 썸네일 */
  const thumbList = document.getElementById("thumbList");
  thumbList.innerHTML = "";

  const thumbFile = product.thumbnail
    ? product.thumbnail.split("/").pop()
    : null;

  const detailImgs = images.filter(img => {
    const file = img.url.split("/").pop();
    return file !== thumbFile;
  });

  detailImgs.forEach((img, idx) => {
    const t = document.createElement("img");
    t.src = img.url;

    t.addEventListener("click", () => {
      document
        .querySelectorAll(".thumb-list img")
        .forEach(i => i.classList.remove("active"));

      t.classList.add("active");
      mainImageEl.src = img.url;
      mainImageLink.href = img.url;
    });

    if (idx === 0) t.classList.add("active");

    thumbList.appendChild(t);
  });

  /* Toast UI Viewer */
  new toastui.Editor.factory({
    el: document.querySelector("#productDesc"),
    viewer: true,
    initialValue: product.description_html || "설명이 없습니다."
  });
}

function getCategoryLabel(code) {
  return {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블"
  }[code] || "기타";
}
