(async () => {
  const id = new URLSearchParams(location.search).get("id");
  const res = await fetch(`/api/products/${id}`);
  const data = await res.json();
  
  const p = data.product;
  const images = data.images; // 대표 이미지는 없음!

  // 제목, 카테고리
  document.getElementById("productTitle").textContent = p.title;
  document.getElementById("productCategory").textContent = "카테고리: " + p.category;

  // 메인 이미지 = thumbnail
  const mainImage = document.getElementById("mainImage");
  mainImage.src = p.thumbnail;

  // 상세 이미지들 렌더링
  const thumbBox = document.getElementById("thumbList");
  thumbBox.innerHTML = images.map(img => `
    <img src="${img.url}" onclick="changeMain('${img.url}')">
  `).join("");

  // 설명
  document.getElementById("productDesc").innerHTML = p.description_html;

  // 클릭 시 메인 교체
  window.changeMain = (url) => {
    mainImage.src = url;
  };
})();
