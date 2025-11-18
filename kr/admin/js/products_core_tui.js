// kr/admin/js/products_core_tui.js

/* ============================================================
   공통: 토큰 헤더
============================================================ */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/* ============================================================
   Toast UI Editor 인스턴스 + 이미지 파일 상태
============================================================ */
let editor;            // Toast UI Editor 인스턴스
let imageFiles = [];   // input[type=file]에서 선택한 파일 목록

document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  initImageInput();
  loadProductList();
});

/* ============================================================
   📝 Toast UI Editor 초기화
============================================================ */
function initEditor() {
  const el = document.querySelector("#editor");
  if (!el || !window.toastui) {
    console.error("Toast UI Editor 초기화 실패: 요소 또는 라이브러리 없음");
    return;
  }

  editor = new toastui.Editor({
    el,
    height: "300px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    language: "ko",
    hooks: {
      // 에디터에서 이미지 추가할 때 호출됨
      async addImageBlobHook(blob, callback) {
        try {
          const fd = new FormData();
          fd.append("image", blob, blob.name || "editor-image.png");

          const res = await fetch("/api/uploads/editor-image", {
            method: "POST",
            headers: getAuthHeaders(), // Authorization만
            body: fd,
          });

          if (!res.ok) {
            console.error("에디터 이미지 업로드 실패:", await res.text());
            alert("에디터 이미지 업로드 실패");
            return;
          }

          const data = await res.json();
          // data.url 이 이미지 경로
          callback(data.url, "image");
        } catch (err) {
          console.error("에디터 이미지 업로드 에러:", err);
          alert("에디터 이미지 업로드 중 오류");
        }
      },
    },
  });
}

/* ============================================================
   🖼 제품 이미지 input + 미리보기
============================================================ */
function initImageInput() {
  const input = document.getElementById("images");
  const previewBox = document.getElementById("preview");

  if (!input) {
    console.error("#images 요소 없음");
    return;
  }
  if (!previewBox) {
    console.error("#preview 요소 없음");
    return;
  }

  input.addEventListener("change", (e) => {
    // 매번 새로 선택한 걸로 덮어쓰기 (과거 것 누적 X)
    imageFiles = Array.from(e.target.files || []);
    renderImagePreview();
  });
}

function renderImagePreview() {
  const previewBox = document.getElementById("preview");
  if (!previewBox) return;

  previewBox.innerHTML = "";

  if (imageFiles.length === 0) return;

  imageFiles.forEach((file, idx) => {
    const item = document.createElement("div");
    item.className = "thumb-preview-item";

    const img = document.createElement("img");
    img.alt = file.name;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";

    btn.addEventListener("click", () => {
      imageFiles.splice(idx, 1);
      renderImagePreview();
    });

    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);

    item.appendChild(img);
    item.appendChild(btn);
    previewBox.appendChild(item);
  });
}

/* ============================================================
   📦 제품 등록
============================================================ */
async function uploadProduct() {
  try {
    const titleEl = document.getElementById("title");
    const categoryEl = document.getElementById("category");

    const title = titleEl ? titleEl.value.trim() : "";
    const category = categoryEl ? categoryEl.value : "";
    const description = editor ? editor.getHTML().trim() : "";

    if (!title) return alert("제품명을 입력하세요.");
    if (!category) return alert("카테고리를 선택하세요.");

    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category);
    fd.append("description_html", description);

    // 이미지 여러개 추가
    imageFiles.forEach((file) => {
      fd.append("images", file);
    });

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(), // Authorization만
      body: fd,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("제품 등록 실패:", txt);
      alert("제품 등록 실패:\n" + txt);
      return;
    }

    alert("등록 완료!");

    // 폼 초기화
    if (titleEl) titleEl.value = "";
    if (categoryEl) categoryEl.value = "";
    if (editor) editor.setHTML("");
    imageFiles = [];

    const input = document.getElementById("images");
    if (input) input.value = "";
    renderImagePreview();

    // 목록 새로고침
    loadProductList();
  } catch (err) {
    console.error("uploadProduct 오류:", err);
    alert("업로드 중 오류 발생");
  }
}

// HTML 버튼에서 쓰기 위해 글로벌로
window.uploadProduct = uploadProduct;

/* ============================================================
   📥 제품 목록 불러오기
============================================================ */
async function loadProductList() {
  const box = document.getElementById("productList");
  if (!box) return;

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("목록 조회 실패:", await res.text());
      box.innerHTML = "<p style='color:red;'>목록 조회 실패</p>";
      return;
    }

    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      box.innerHTML = "<p>등록된 제품이 없습니다.</p>";
      return;
    }

    box.innerHTML = products.map(renderProductCardHTML).join("");
  } catch (err) {
    console.error("loadProductList 오류:", err);
    box.innerHTML = "<p style='color:red;'>목록 조회 중 오류</p>";
  }
}

function renderProductCardHTML(p) {
  const img = p.thumbnail || "/img/products/Image-placeholder.png";

  const categoryLabel = {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[p.category] || "미지정";

  return `
    <div class="product-card">
      <img src="${img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="category">${categoryLabel}</div>
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `;
}

/* ============================================================
   수정 / 삭제 (수정은 기존 edit_product.html 활용 가정)
============================================================ */
window.editProduct = (id) => {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("삭제 실패:", await res.text());
      alert("삭제 실패");
      return;
    }

    alert("삭제 완료");
    loadProductList();
  } catch (err) {
    console.error("deleteProduct 오류:", err);
    alert("삭제 중 오류");
  }
};
