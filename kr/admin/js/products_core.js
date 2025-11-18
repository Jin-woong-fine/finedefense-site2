// kr/admin/js/products_core.js

console.log("%c[products_core] 로드됨", "color:#4caf50;font-weight:bold;");

/* =========================================================
  🔐 토큰 헤더
========================================================= */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[Auth] 토큰 없음");
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

/* =========================================================
  📌 상태
========================================================= */
let editor = null;          // Toast UI Editor 인스턴스
let selectedFiles = [];     // 사용자가 선택한 이미지 파일들 (File 객체 배열)

/* =========================================================
  🧩 초기화 진입점
  - products.html 에서 window.initProductsPage() 호출
========================================================= */
window.initProductsPage = function () {
  console.log("%c[products_core] initProductsPage()", "color:#2196f3;font-weight:bold;");

  initEditor();
  initImageInput();
  loadProductList();
};

/* =========================================================
  🖋 Toast UI Editor 초기화
========================================================= */
function initEditor() {
  const editorEl = document.getElementById("editor");
  if (!editorEl) {
    console.error("[Editor] #editor 요소를 찾을 수 없습니다.");
    return;
  }

  const Editor = toastui.Editor;

  editor = new Editor({
    el: editorEl,
    height: "320px",
    initialEditType: "wysiwyg",   // 마크다운 말고 워드처럼
    previewStyle: "vertical",
    // language: "ko",  // 필요하면 언어팩 추가
    toolbarItems: [
      ["heading", "bold", "italic", "strike"],
      ["hr", "quote"],
      ["ul", "ol", "task"],
      ["table", "link"],
      ["code", "codeblock"]
    ],
  });

  console.log("[Editor] Toast UI Editor 초기화 완료:", editor);
}

/* =========================================================
  🖼 이미지 선택 + 미리보기
========================================================= */
function initImageInput() {
  const inputEl = document.getElementById("images");
  const previewEl = document.getElementById("preview");

  if (!inputEl || !previewEl) {
    console.error("[Image] #images 또는 #preview 요소 없음");
    return;
  }

  inputEl.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    console.log("[Image] 선택된 파일:", files);

    // 이번에 선택한 걸로 교체 (누를 때마다 다시 선택하는 구조)
    selectedFiles = files;
    renderImagePreview();
  });
}

function renderImagePreview() {
  const previewEl = document.getElementById("preview");
  if (!previewEl) return;

  previewEl.innerHTML = "";

  if (!selectedFiles.length) {
    console.log("[Preview] 선택된 파일 없음");
    return;
  }

  console.log("[Preview] 렌더링 시작, 개수:", selectedFiles.length);

  selectedFiles.forEach((file, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thumb-preview-item";

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (ev) => {
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);

    const removeBtn = document.createElement("button");
    removeBtn.className = "thumb-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.type = "button";

    removeBtn.addEventListener("click", () => {
      console.log("[Preview] 삭제 클릭 idx=", idx);
      selectedFiles.splice(idx, 1);
      renderImagePreview();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    previewEl.appendChild(wrapper);
  });
}

/* =========================================================
  📦 제품 등록 (POST /api/products)
========================================================= */
window.uploadProduct = async function () {
  try {
    const titleEl = document.getElementById("title");
    const categoryEl = document.getElementById("category");

    const title = titleEl?.value.trim();
    const category = categoryEl?.value;
    const descriptionHtml = editor ? editor.getHTML().trim() : "";

    console.log("[Upload] title=", title);
    console.log("[Upload] category=", category);
    console.log("[Upload] desc length=", descriptionHtml.length);
    console.log("[Upload] selectedFiles=", selectedFiles);

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
    fd.append("description_html", descriptionHtml);

    selectedFiles.forEach((file) => {
      fd.append("images", file); // 백엔드에서 upload.array("images", 20)
    });

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),  // Authorization만 추가 (Content-Type은 FormData가 자동 지정)
      body: fd,
    });

    console.log("[Upload] 응답 상태:", res.status);

    if (!res.ok) {
      const txt = await res.text();
      console.error("[Upload] 서버 오류:", txt);
      alert("❌ 등록 실패\n" + txt);
      return;
    }

    const data = await res.json();
    console.log("[Upload] 등록 성공:", data);

    alert("등록 완료!");

    // 폼 초기화
    if (titleEl) titleEl.value = "";
    if (categoryEl) categoryEl.value = "";
    if (editor) editor.setHTML("");
    selectedFiles = [];
    renderImagePreview();

    // 목록 새로고침
    loadProductList();
  } catch (err) {
    console.error("[Upload] 예외 발생:", err);
    alert("등록 중 오류가 발생했습니다.");
  }
};

/* =========================================================
  📥 제품 목록 로드
========================================================= */
async function loadProductList() {
  const listEl = document.getElementById("productList");
  if (!listEl) {
    console.error("[List] #productList 요소 없음");
    return;
  }

  try {
    listEl.innerHTML = "<p>불러오는 중...</p>";

    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    console.log("[List] 응답 상태:", res.status);

    if (!res.ok) {
      listEl.innerHTML = "<p style='color:red;'>목록 조회 실패</p>";
      return;
    }

    const products = await res.json();
    console.log("[List] 조회 개수:", products.length, products);

    if (!products.length) {
      listEl.innerHTML = "<p>등록된 제품이 없습니다.</p>";
      return;
    }

    listEl.innerHTML = products.map(renderProductCardHTML).join("");
  } catch (err) {
    console.error("[List] 예외:", err);
    listEl.innerHTML = "<p style='color:red;'>목록 조회 중 오류 발생</p>";
  }
}

/* =========================================================
  📇 카드 렌더링
========================================================= */
function renderProductCardHTML(p) {
  const img = p.thumbnail || "/img/products/Image-placeholder.png";

  const categoryLabel = {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[p.category] || "미지정";

  const dateText = p.created_at
    ? new Date(p.created_at).toLocaleString("ko-KR")
    : "";

  return `
    <div class="product-card">
      <img src="${img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="category">${categoryLabel}</div>
      <div style="font-size:0.8rem;color:#999;margin-bottom:8px;">${dateText}</div>
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `;
}

/* =========================================================
  ✏ 수정 / 삭제
========================================================= */
window.editProduct = function (id) {
  console.log("[EDIT] 이동:", id);
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async function (id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    console.log("[DELETE] 응답 상태:", res.status);

    if (!res.ok) {
      const txt = await res.text();
      console.error("[DELETE] 서버 오류:", txt);
      alert("삭제 실패\n" + txt);
      return;
    }

    alert("삭제 완료");
    loadProductList();
  } catch (err) {
    console.error("[DELETE] 예외:", err);
    alert("삭제 중 오류가 발생했습니다.");
  }
};
