/* ============================================================
    기본 설정
============================================================ */
let quill;
let images = [];

/* 🔐 토큰 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

/* ============================================================
    Quill 초기화
============================================================ */
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

  initImageInput();
  loadProductList();
});

/* ============================================================
    이미지 선택 + 미리보기
============================================================ */
function initImageInput() {
  const input = document.getElementById("images");
  const preview = document.getElementById("preview");

  input.addEventListener("change", (e) => {
    const selected = Array.from(e.target.files);
    images = [...images, ...selected];
    renderPreview();
  });

  function renderPreview() {
    preview.innerHTML = "";

    images.forEach((file, idx) => {
      const wrap = document.createElement("div");

      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.readAsDataURL(file);

      const btn = document.createElement("button");
      btn.textContent = "×";
      btn.onclick = () => {
        images.splice(idx, 1);
        renderPreview();
      };

      wrap.appendChild(img);
      wrap.appendChild(btn);
      preview.appendChild(wrap);
    });
  }
}

/* ============================================================
    제품 등록
============================================================ */
async function uploadProduct() {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description = quill.root.innerHTML.trim();

  if (!title) return alert("제품명을 입력하세요.");
  if (!category) return alert("카테고리를 선택하세요.");

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description_html", description);

  images.forEach((img) => fd.append("images", img));

  const res = await fetch("/api/products", {
    method: "POST",
    headers: getAuthHeaders(),
    body: fd
  });

  if (!res.ok) return alert("등록 실패");

  alert("등록 완료");

  // 초기화
  images = [];
  document.getElementById("preview").innerHTML = "";
  quill.root.innerHTML = "";
  loadProductList();
}

/* ============================================================
    목록 불러오기
============================================================ */
async function loadProductList() {
  const box = document.getElementById("productList");

  const res = await fetch("/api/products", {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    box.innerHTML = "<p style='color:red;'>조회 실패</p>";
    return;
  }

  const list = await res.json();

  box.innerHTML = list
    .map((p) => {
      const img = p.thumbnail || "/img/products/Image-placeholder.png";
      return `
        <div class="product-card">
          <img src="${img}">
          <h3>${p.title}</h3>
          <div class="category">${getCategoryLabel(p.category)}</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
            <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
          </div>
        </div>
      `;
    })
    .join("");
}

/* 카테고리 라벨 */
function getCategoryLabel(c) {
  return {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[c] || "미지정";
}

/* ============================================================
    삭제
============================================================ */
async function deleteProduct(id) {
  if (!confirm("삭제하시겠습니까?")) return;

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) return alert("삭제 실패");

  alert("삭제 완료");
  loadProductList();
}

/* 수정 페이지 이동 */
function editProduct(id) {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
}
