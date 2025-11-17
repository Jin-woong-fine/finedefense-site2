/* ============================================================
   🔐 로그인 체크
============================================================ */
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("로그인이 필요합니다.");
  location.href = "/kr/admin/login.html";
}

/* 로그아웃 */
function logout() {
  localStorage.clear();
  location.href = "/kr/admin/login.html";
}

/* ============================================================
   📝 Quill 초기화
============================================================ */
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

  // 썸네일 미리보기
  const thumbInput = document.getElementById("thumbnail");
  const thumbPreview = document.getElementById("thumbPreview");
  thumbInput.addEventListener("change", e => {
    const f = e.target.files[0];
    if (f) {
      thumbPreview.src = URL.createObjectURL(f);
      thumbPreview.style.display = "block";
    } else {
      thumbPreview.src = "";
      thumbPreview.style.display = "none";
    }
  });

  // 상세 이미지 미리보기
  const imagesInput = document.getElementById("images");
  const detailPreview = document.getElementById("detailPreview");
  imagesInput.addEventListener("change", e => {
    const files = Array.from(e.target.files);
    detailPreview.innerHTML = "";
    files.forEach(f => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      detailPreview.appendChild(img);
    });
  });

  loadProductList();
});

/* ============================================================
   📦 제품 등록
============================================================ */
async function uploadProduct() {
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

  const res = await fetch(`/api/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  if (res.ok) {
    alert("제품 등록 완료!");

    // 입력 리셋
    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    document.getElementById("thumbnail").value = "";
    document.getElementById("images").value = "";

    document.getElementById("thumbPreview").src = "";
    document.getElementById("thumbPreview").style.display = "none";
    document.getElementById("detailPreview").innerHTML = "";
    quill.setContents([]);

    loadProductList();
  } else {
    alert("오류 발생!");
  }
}

/* ============================================================
   📦 제품 리스트 불러오기
============================================================ */
async function loadProductList() {
  const res = await fetch(`/api/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const list = await res.json();
  const box = document.getElementById("productList");

  box.innerHTML = list.map(p => `
    <div class="product-item" id="product-${p.id}">
      <div style="display:flex;gap:10px;align-items:center;">
        ${
          p.thumbnail
            ? `<img src="${p.thumbnail}" style="width:60px;height:45px;object-fit:cover;border-radius:6px;border:1px solid #ddd;">`
            : ""
        }
        <div>
          <strong>${p.title}</strong><br>
          <span style="font-size:13px; color:#666;">카테고리: ${p.category}</span>
        </div>
      </div>

      <div style="display:flex; gap:6px; align-items:center;">
        <button class="btn btn-secondary" onclick="openView(${p.id})">상세보기</button>
        <button class="btn btn-primary" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `).join("");
}

window.openView = (id) => {
  // 프론트 상세페이지
  window.open(`/kr/sub/products/product-view.html?id=${id}`, "_blank");
};

window.editProduct = (id) => {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("삭제하시겠습니까?")) return;

  await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const item = document.getElementById(`product-${id}`);
  if (item) {
    item.style.opacity = "0.3";
    setTimeout(() => item.remove(), 300);
  }
};
