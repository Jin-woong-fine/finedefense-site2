// kr/admin/js/products_core.js

console.log("%c[products_core] 로드됨", "color:#4caf50;font-weight:bold;");

/* =========================================================
  🔐 토큰 헤더 (Authorization)
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
let editor = null;   // Toast UI Editor 인스턴스

/* =========================================================
  🧩 초기화 진입점
========================================================= */
window.initProductsPage = function () {
  console.log("%c[products_core] initProductsPage()", "color:#2196f3;font-weight:bold;");

  initEditor();
  initImagePreview();
  initFormSubmit();
  loadProductList();
};

/* =========================================================
  🖋 Toast UI Editor 초기화
========================================================= */
function initEditor() {
  const editorEl = document.getElementById("editor");
  if (!editorEl) {
    console.error("[Editor] #editor 요소 없음");
    return;
  }

  const Editor = toastui.Editor;

  editor = new Editor({
    el: editorEl,
    height: "320px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    toolbarItems: [
      ["heading", "bold", "italic", "strike"],
      ["hr", "quote"],
      ["ul", "ol", "task"],
      ["table", "link"],
      ["code", "codeblock"]
    ],
  });

  console.log("[Editor] 초기화 완료:", editor);
}

/* =========================================================
  🖼 이미지 선택 시 단순 프리뷰 렌더링
========================================================= */
function initImagePreview() {
  const inputEl = document.getElementById("images");
  const previewEl = document.getElementById("preview");

  if (!inputEl || !previewEl) {
    console.error("[Image] #images 또는 #preview 요소 없음");
    return;
  }

  inputEl.addEventListener("change", () => {
    previewEl.innerHTML = "";
    const files = inputEl.files;

    console.log("[Image] 파일 선택:", files);

    Array.from(files).forEach((file) => {
      const wrapper = document.createElement("div");
      wrapper.className = "thumb-preview-item";

      const img = document.createElement("img");
      const reader = new FileReader();

      reader.onload = (ev) => {
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);

      wrapper.appendChild(img);
      previewEl.appendChild(wrapper);
    });
  });
}

/* =========================================================
  📦 Form 방식 제품 등록
========================================================= */
function initFormSubmit() {
  const form = document.getElementById("productForm");
  if (!form) {
    console.error("[Form] #productForm 없음");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("[Form] 제출 시작");

    // 1) Toast 내용 hidden textarea로 복사
    const hiddenDesc = document.getElementById("description_html");
    if (editor && hiddenDesc) {
      hiddenDesc.value = editor.getHTML();
    }

    // 2) FormData 자동 생성
    const fd = new FormData(form);

    console.log("[FormData] 전송 준비됨");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,   // Content-Type 자동 설정됨
      });

      console.log("[Upload] 응답 코드:", res.status);

      if (!res.ok) {
        const txt = await res.text();
        console.error("[Upload] 서버 오류:", txt);
        alert("❌ 등록 실패: " + txt);
        return;
      }

      alert("등록 완료!");

      // 폼 초기화 (브라우저가 자동으로 초기화함)
      form.reset();

      // 프리뷰 초기화
      const previewEl = document.getElementById("preview");
      if (previewEl) previewEl.innerHTML = "";

      // Toast Editor 초기화
      if (editor) editor.setHTML("");

      // 목록 갱신
      loadProductList();

    } catch (err) {
      console.error("[Upload] 예외 발생:", err);
      alert("등록 중 오류가 발생했습니다.");
    }
  });
}

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

    console.log("[List] 응답 코드:", res.status);

    if (!res.ok) {
      listEl.innerHTML = "<p style='color:red;'>목록 조회 실패</p>";
      return;
    }

    const products = await res.json();
    console.log("[List] 조회된 제품:", products);

    if (!products.length) {
      listEl.innerHTML = "<p>등록된 제품이 없습니다.</p>";
      return;
    }

    listEl.innerHTML = products.map(renderProductCardHTML).join("");

  } catch (err) {
    console.error("[List] 오류:", err);
    listEl.innerHTML = "<p style='color:red;'>조회 오류 발생</p>";
  }
}

/* =========================================================
  📇 카드 렌더링
========================================================= */
function renderProductCardHTML(p) {
  const img = p.thumbnail || "/img/products/Image-placeholder.png";

  const categoryMap = {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  };

  const categoryText = categoryMap[p.category] || "미지정";

  return `
    <div class="product-card">
      <img src="${img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="category">${categoryText}</div>
      <div style="font-size:0.8rem;color:#999;margin-bottom:8px;">
        ${new Date(p.created_at).toLocaleString("ko-KR")}
      </div>
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
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async function (id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const txt = await res.text();
      alert("삭제 실패: " + txt);
      return;
    }

    alert("삭제 완료");
    loadProductList();

  } catch (err) {
    console.error("[DELETE] 예외:", err);
    alert("삭제 중 오류 발생");
  }
};
