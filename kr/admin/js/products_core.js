/* ============================================================
   🌟 Fine Defense - 제품 관리 (Toast UI + 다중 이미지 업로드)
   파일 위치: /kr/admin/js/products_core.js
============================================================ */

// 🔐 토큰 헤더
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 전역 상태
let toastEditor = null;
let imageFiles = [];

// DOM 로드 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  initImageInput();
  loadProductList();
});

/* ============================================================
   📝 Toast UI Editor 초기화
============================================================ */
function initEditor() {
  const editorEl = document.querySelector("#editor");
  if (!editorEl) {
    console.error("[Editor] #editor 요소를 찾을 수 없습니다.");
    return;
  }

  toastEditor = new toastui.Editor({
    el: editorEl,
    height: "400px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    language: "ko"
  });

  console.log("[Editor] Toast UI Editor 초기화 완료");
}

/* ============================================================
   🖼 이미지 선택 + 미리보기
============================================================ */
function initImageInput() {
  const inputEl = document.getElementById("images");
  const previewEl = document.getElementById("preview");

  if (!inputEl) {
    console.error("[Image] #images 요소 없음");
    return;
  }
  if (!previewEl) {
    console.error("[Image] #preview 요소 없음");
    return;
  }

  inputEl.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);

    // 새로 선택한 걸로 교체 (누적 X, 필요하면 [...imageFiles, ...files]로 변경)
    imageFiles = files;
    renderImagePreview();
  });
}

function renderImagePreview() {
  const previewEl = document.getElementById("preview");
  if (!previewEl) return;

  previewEl.innerHTML = "";

  if (!imageFiles || imageFiles.length === 0) {
    return;
  }

  imageFiles.forEach((file, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumb-preview-item";

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (ev) => {
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      imageFiles.splice(idx, 1);
      renderImagePreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(btn);
    previewEl.appendChild(wrapper);
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
    const description = toastEditor ? toastEditor.getHTML().trim() : "";

    if (!title) {
      alert("제품명을 입력하세요.");
      return;
    }
    if (!category) {
      alert("카테고리를 선택하세요.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category);
    fd.append("description_html", description);

    // 이미지 여러 개 추가
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        fd.append("images", file);
      });
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("[Upload] 서버 오류:", txt);
      alert("서버 오류 발생\n" + txt);
      return;
    }

    alert("제품이 등록되었습니다.");

    // 폼 초기화
    if (titleEl) titleEl.value = "";
    if (categoryEl) categoryEl.value = "";
    if (toastEditor) toastEditor.setHTML("");
    imageFiles = [];
    renderImagePreview();

    // 목록 새로고침
    loadProductList();
  } catch (err) {
    console.error("[Upload] 예외 발생:", err);
    alert("업로드 중 오류가 발생했습니다.");
  }
}

// 버튼에서 쓸 수 있게 전역에 공개
window.uploadProduct = uploadProduct;

/* ============================================================
   📥 제품 목록 불러오기
============================================================ */
async function loadProductList() {
  const box = document.getElementById("productList");
  if (!box) {
    console.error("[List] #productList 요소 없음");
    return;
  }

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("목록 조회 실패: " + res.status);
    }

    const products = await res.json();

    if (!Array.isArray(products)) {
      console.error("[List] 응답이 배열이 아님:", products);
      box.innerHTML = "<p>목록 데이터를 불러오지 못했습니다.</p>";
      return;
    }

    if (products.length === 0) {
      box.innerHTML = "<p>등록된 제품이 없습니다.</p>";
      return;
    }

    box.innerHTML = products.map(renderProductCardHTML).join("");
  } catch (err) {
    console.error("[List] 오류:", err);
    const box = document.getElementById("productList");
    if (box) box.innerHTML = "<p style='color:red;'>목록 불러오기 실패</p>";
  }
}

/* ============================================================
   🧩 카드 렌더링
============================================================ */
function renderProductCardHTML(p) {
  const img = p.thumbnail || "/img/products/Image-placeholder.png";

  const created = p.created_at
    ? new Date(p.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    : "";

  return `
    <div class="product-card">
      <img src="${img}" alt="${escapeHtml(p.title || "")}">
      <h3>${escapeHtml(p.title || "")}</h3>
      <div class="category">${getCategoryLabel(p.category)}</div>
      <div class="date">${created}</div>
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `;
}

function getCategoryLabel(code) {
  const map = {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  };
  return map[code] || "미지정";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ============================================================
   ✏ 수정 / 삭제
============================================================ */
function editProduct(id) {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
}

async function deleteProduct(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("[Delete] 서버 오류:", txt);
      alert("삭제 실패\n" + txt);
      return;
    }

    alert("삭제되었습니다.");
    loadProductList();
  } catch (err) {
    console.error("[Delete] 예외 발생:", err);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
