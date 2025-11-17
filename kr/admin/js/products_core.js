/* ============================================================================
   🔐 토큰 읽기 (전역 변수 제거)
============================================================================ */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}


/* ============================================================================
   🖋 Quill 에디터 & 이미지 파일 상태
============================================================================ */
let quill;
let imageFiles = [];


/* ============================================================================
   🔧 DOM 준비 후 초기화
============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  try {
    initQuill();
    initImageInput();
    loadProductList();
  } catch (err) {
    console.error("초기화 오류:", err);
  }
});


/* ============================================================================
   🖋 Quill 초기화
============================================================================ */
function initQuill() {
  const editorEl = document.getElementById("editor");
  if (!editorEl) {
    console.warn("⚠️ Quill 에디터 없음");
    return;
  }

  quill = new Quill(editorEl, {
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });
}


/* ============================================================================
   🖼 이미지 선택 + 미리보기
============================================================================ */
function initImageInput() {
  const input = document.getElementById("images");
  const previewBox = document.getElementById("preview");
  if (!input || !previewBox) return;

  input.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    imageFiles = [...imageFiles, ...files];
    renderImagePreview();
  });
}

function renderImagePreview() {
  const previewBox = document.getElementById("preview");
  if (!previewBox) return;

  previewBox.innerHTML = "";

  imageFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;

      const wrap = document.createElement("div");
      wrap.style.position = "relative";

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.style.position = "absolute";
      removeBtn.style.top = "-6px";
      removeBtn.style.right = "-6px";
      removeBtn.style.width = "20px";
      removeBtn.style.height = "20px";
      removeBtn.style.borderRadius = "50%";
      removeBtn.style.border = "none";
      removeBtn.style.background = "crimson";
      removeBtn.style.color = "#fff";
      removeBtn.style.cursor = "pointer";

      removeBtn.onclick = () => {
        imageFiles = imageFiles.filter((_, i) => i !== idx);
        renderImagePreview();
      };

      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      previewBox.appendChild(wrap);
    };

    reader.readAsDataURL(file);
  });
}


/* ============================================================================
   📦 제품 등록
============================================================================ */
async function uploadProduct() {
  try {
    const title = document.getElementById("title")?.value.trim();
    const category = document.getElementById("category")?.value;
    const description = quill ? quill.root.innerHTML.trim() : "";

    if (!title) return alert("제품명을 입력하세요.");
    if (!category) return alert("카테고리를 선택하세요.");

    if (!description.replace(/<p><br><\/p>/g, "").trim()) {
      if (!confirm("설명이 비어 있습니다. 진행할까요?")) return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category);
    fd.append("description", description);

    // slug 사용 (선택)
    fd.append("slug", slugify(title));

    // 여러 이미지
    imageFiles.forEach((file) => fd.append("images", file));

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error(msg);
      alert("제품 등록 실패");
      return;
    }

    alert("등록 완료!");

    // 초기화
    document.getElementById("title").value = "";
    document.getElementById("category").value = "";
    if (quill) quill.root.innerHTML = "";
    imageFiles = [];
    renderImagePreview();

    loadProductList();

  } catch (err) {
    console.error("uploadProduct Error:", err);
    alert("오류 발생");
  }
}
window.uploadProduct = uploadProduct;


/* ============================================================================
   📥 목록 불러오기
============================================================================ */
async function loadProductList() {
  const box = document.getElementById("productList");
  if (!box) return;

  box.innerHTML = "불러오는 중...";

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("목록 조회 실패");

    const products = await res.json();

    if (!products.length) {
      box.innerHTML = "<p style='color:#666;'>등록된 제품이 없습니다.</p>";
      return;
    }

    box.innerHTML = products.map(renderProductCardHTML).join("");

  } catch (err) {
    console.error("loadProductList Error:", err);
    box.innerHTML = "<p style='color:#d00;'>목록 불러오기 실패</p>";
  }
}


/* ============================================================================
   🧱 제품 카드 HTML
============================================================================ */
function renderProductCardHTML(p) {
  const img =
    p.thumbImage ||
    (p.images?.[0] ?? "/img/products/Image-placeholder.png");

  return `
    <div class="product-card">
      <img src="${img}" alt="${p.title || ''}">
      <h3>${p.title}</h3>
      <div class="category">카테고리: ${getCategoryLabel(p.category)}</div>

      <div style="display:flex; gap:6px; margin-top:10px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `;
}


/* 카테고리 라벨 */
function getCategoryLabel(code) {
  return {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[code] || "미지정";
}


/* ============================================================================
   ✏ 수정 / 삭제
============================================================================ */
window.editProduct = (id) => {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("삭제 실패");

    alert("삭제되었습니다.");
    loadProductList();

  } catch (err) {
    console.error("deleteProduct Error:", err);
    alert("삭제 중 오류");
  }
};
