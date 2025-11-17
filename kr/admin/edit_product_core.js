/* 로그인 체크 */
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || role !== "admin") {
  alert("로그인이 필요합니다.");
  location.href = "/kr/admin/login.html";
}

function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");
if (!productId) {
  alert("잘못된 접근입니다.");
  location.href = "/kr/admin/products.html";
}

let quill;

document.addEventListener("DOMContentLoaded", () => {
  quill = new Quill("#editor", {
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"]
      ]
    }
  });

  // 새 썸네일 프리뷰
  document.getElementById("thumbnail").addEventListener("change", e => {
    const f = e.target.files[0];
    const preview = document.getElementById("thumbPreview");
    if (f) {
      preview.src = URL.createObjectURL(f);
      preview.style.display = "block";
    } else {
      preview.src = "";
      preview.style.display = "none";
    }
  });

  // 새 상세이미지 프리뷰
  document.getElementById("images").addEventListener("change", e => {
    const files = Array.from(e.target.files);
    const box = document.getElementById("detailPreview");
    box.innerHTML = "";
    files.forEach(f => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      img.style.width = "90px";
      img.style.height = "90px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "6px";
      img.style.border = "1px solid #ddd";
      box.appendChild(img);
    });
  });

  loadProduct();
});

/* 제품 정보 + 이미지 로드 */
async function loadProduct() {
  const res = await fetch(`/api/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    alert("제품 정보를 불러오지 못했습니다.");
    location.href = "/kr/admin/products.html";
    return;
  }

  const { product, images } = await res.json();

  document.getElementById("title").value = product.title;
  document.getElementById("category").value = product.category;

  const thumbCurrent = document.getElementById("thumbCurrent");
  thumbCurrent.src = product.thumbnail || "/img/products/Image-placeholder.png";

  quill.root.innerHTML = product.description_html || "";

  const list = document.getElementById("detailList");
  list.innerHTML = images.map(img => `
    <div class="detail-item" id="img-${img.id}">
      <img src="${img.url}">
      <button class="btn btn-danger" style="margin-bottom:2px;" onclick="deleteImage(${img.id})">삭제</button>
    </div>
  `).join("");
}

/* 개별 상세이미지 삭제 */
async function deleteImage(imageId) {
  if (!confirm("이미지를 삭제하시겠습니까?")) return;

  const res = await fetch(`/api/product-images/${imageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.ok) {
    const item = document.getElementById(`img-${imageId}`);
    if (item) item.remove();
  } else {
    alert("삭제 실패");
  }
}

/* 제품 수정 저장 */
async function updateProduct() {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value.trim();
  const thumbFile = document.getElementById("thumbnail").files[0];
  const detailFiles = Array.from(document.getElementById("images").files);
  const description_html = quill.root.innerHTML.trim();

  if (!title || !category) {
    return alert("제품명과 카테고리를 입력하세요.");
  }

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description_html", description_html || "");

  if (thumbFile) fd.append("thumbnail", thumbFile);
  detailFiles.forEach(f => fd.append("images", f));

  const res = await fetch(`/api/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  if (res.ok) {
    alert("저장되었습니다.");
    location.href = "/kr/admin/products.html";
  } else {
    alert("저장 실패");
  }
}
