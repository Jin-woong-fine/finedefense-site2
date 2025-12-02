/* ============================================================================
   📌 제품 상세 페이지 로직 (product-view.js)
============================================================================ */

document.addEventListener("DOMContentLoaded", loadProductDetail);

let allImages = [];   // 라이트박스에서 사용할 전체 이미지 배열
let currentIndex = 0; // 현재 보고 있는 이미지 인덱스

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
  crumbProduct.textContent = categoryLabel;

  // 대표 이미지
  const mainImg = product.thumbnail
    ? product.thumbnail
    : "/img/products/Image-placeholder.png";

  mainImageEl.src = mainImg;

  /* ===============================
      이미지 배열 구성
     =============================== */
  const thumbFile = product.thumbnail ? product.thumbnail.split("/").pop() : null;

  const detailImgs = images.filter(img => {
    if (!thumbFile) return true;
    return img.url.split("/").pop() !== thumbFile;
  });

  allImages = [mainImg, ...detailImgs.map(img => img.url)];

  /* ===============================
      썸네일 렌더링
     =============================== */
  thumbListEl.innerHTML = "";
  allImages.forEach((url, idx) => {
    const t = document.createElement("img");
    t.src = url;

    if (idx === 0) t.classList.add("active");

    t.addEventListener("click", () => {
      document.querySelectorAll(".thumb-list img")
        .forEach(el => el.classList.remove("active"));

      t.classList.add("active");
      mainImageEl.src = url;
      currentIndex = idx;
    });

    thumbListEl.appendChild(t);
  });

  /* ===============================
      Toast UI Viewer 렌더링
     =============================== */
  new toastui.Editor({
    el: document.getElementById("productDesc"),
    viewer: true,
    initialValue: product.description_html || "<p>설명이 없습니다.</p>"
  });

  /* ===============================
      확대 기능 활성화 (대표 이미지만)
     =============================== */
  enableLightbox(mainImageEl);
}

/* ============================================================================
   📌 라이트박스 + 좌/우 슬라이드 기능
============================================================================ */
function enableLightbox(mainImageEl) {
  mainImageEl.style.cursor = "zoom-in";

  mainImageEl.addEventListener("click", () => {
    openLightbox();
  });
}

function openLightbox() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.backdropFilter = "blur(3px)";
  overlay.style.zIndex = "9999";

  const img = document.createElement("img");
  img.src = allImages[currentIndex];
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";
  img.style.borderRadius = "12px";
  img.style.boxShadow = "0 0 25px rgba(0,0,0,0.45)";
  overlay.appendChild(img);

  // 닫기
  overlay.addEventListener("click", e => {
    if (!e.target.classList.contains("lightbox-nav")) {
      overlay.remove();
    }
  });

  // 좌측 버튼
  const prevBtn = document.createElement("div");
  prevBtn.className = "lightbox-nav lightbox-prev";
  prevBtn.textContent = "◀";
  prevBtn.onclick = e => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    img.src = allImages[currentIndex];
    highlightThumb();
  };

  // 우측 버튼
  const nextBtn = document.createElement("div");
  nextBtn.className = "lightbox-nav lightbox-next";
  nextBtn.textContent = "▶";
  nextBtn.onclick = e => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % allImages.length;
    img.src = allImages[currentIndex];
    highlightThumb();
  };

  overlay.appendChild(prevBtn);
  overlay.appendChild(nextBtn);

  document.body.appendChild(overlay);
}

/* 썸네일 active 표시 */
function highlightThumb() {
  const thumbs = document.querySelectorAll(".thumb-list img");
  thumbs.forEach((t, idx) => {
    t.classList.toggle("active", idx === currentIndex);
  });
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
