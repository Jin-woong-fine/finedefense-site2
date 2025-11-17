document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    alert("잘못된 접근입니다.");
    return;
  }

  loadProductDetail(id);
});

async function loadProductDetail(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
      alert("제품 정보를 불러오지 못했습니다.");
      return;
    }

    const { product, images } = await res.json();

    document.getElementById("productTitle").textContent = product.title;
    document.getElementById("productCategory").textContent = product.category;
    document.getElementById("crumbProduct").textContent = product.title;

    const mainImage = document.getElementById("mainImage");
    const allImages = [];

    if (product.thumbnail) allImages.push(product.thumbnail);
    if (images?.length) {
      images.forEach(img => allImages.push(img.url));
    }

    if (allImages.length === 0) {
      mainImage.src = "/img/products/Image-placeholder.png";
    } else {
      mainImage.src = allImages[0];
    }

    const thumbList = document.getElementById("thumbList");
    thumbList.innerHTML = allImages
      .map(
        (src, idx) => `
        <img src="${src}" class="${idx === 0 ? "active" : ""}" data-index="${idx}">
      `
      )
      .join("");

    thumbList.querySelectorAll("img").forEach(img => {
      img.addEventListener("click", () => {
        thumbList.querySelectorAll("img").forEach(t => t.classList.remove("active"));
        img.classList.add("active");
        mainImage.src = img.src;
      });
    });

    const descBox = document.getElementById("productDesc");
    descBox.innerHTML = product.description_html || "<p>제품 설명이 준비중입니다.</p>";
  } catch (err) {
    console.error(err);
    alert("에러가 발생했습니다.");
  }
}
