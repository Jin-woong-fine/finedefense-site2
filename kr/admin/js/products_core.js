console.log("%c[products_core] 로드됨", "color:#4caf50;font-weight:bold;");

/* =========================================================
 🔐 인증 헤더
========================================================= */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================================================
 🧩 초기화
========================================================= */
window.initProductsPage = function () {
  console.log("%c[products_core] initProductsPage()", "color:#2196f3;font-weight:bold;");

  initEditor();
  initImagePreview();
  initFormSubmit();
  loadProductList();
};

let editor = null;

/* =========================================================
 📝 Toast Editor 초기화
========================================================= */
function initEditor() {
  const Editor = toastui.Editor;

  editor = new Editor({
    el: document.getElementById("editor"),
    height: "320px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
  });

  console.log("[Editor] 초기화 완료");
}

/* =========================================================
 🖼 이미지 프리뷰 + 파일 로그
========================================================= */
function initImagePreview() {
  const input = document.getElementById("images");
  const preview = document.getElementById("preview");

  if (!input || !preview) {
    console.error("[Image] #images 또는 #preview 없음");
    return;
  }

  input.addEventListener("change", () => {
    console.log("=== [Image change] 선택됨 ===");
    console.log("파일 개수:", input.files.length);
    Array.from(input.files).forEach((file, idx) => {
      console.log(`  #${idx} 이름=${file.name}, 크기=${file.size} bytes`);
    });

    preview.innerHTML = "";

    Array.from(input.files).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      img.style.border = "1px solid #ddd";
      img.style.marginRight = "6px";

      preview.appendChild(img);
    });
  });
}

/* =========================================================
 📤 제품 업로드 (FormData manual append)
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

    const titleEl = document.getElementById("title");
    const categoryEl = document.getElementById("category");
    const fileInput = document.getElementById("images");

    const title = titleEl.value.trim();
    const category = categoryEl.value;
    const files = fileInput.files;

    if (!title || !category) {
      alert("제품명과 카테고리는 필수입니다.");
      return;
    }

    console.log("[Form] title =", title);
    console.log("[Form] category =", category);
    console.log("[Form] 파일 개수 =", files.length);

    const fd = new FormData();

    fd.append("title", title);
    fd.append("category", category);
    fd.append("description_html", editor ? editor.getHTML() : "");

    for (let i = 0; i < files.length; i++) {
      fd.append("images", files[i]);
    }

    console.log("[FormData] 구성 완료");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });

      console.log("[Upload] 응답 코드:", res.status);

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("[Upload Error]", err || res.statusText);
        alert("등록 실패: " + (err?.detail || res.statusText));
        return;
      }

      alert("등록 완료!");

      // 초기화
      form.reset();
      if (editor) editor.setHTML("");
      const preview = document.getElementById("preview");
      if (preview) preview.innerHTML = "";

      loadProductList();
    } catch (err) {
      console.error("[Exception] 업로드 중 오류:", err);
      alert("업로드 중 오류 발생");
    }
  });
}

/* =========================================================
 📥 목록 로드
========================================================= */
async function loadProductList() {
  const list = document.getElementById("productList");
  if (!list) return;

  list.innerHTML = "불러오는 중...";

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      list.innerHTML = "<p style='color:red;'>목록 조회 실패</p>";
      return;
    }

    const data = await res.json();

    list.innerHTML = data
      .map(
        (p) => `
      <div class="product-card">
        <img src="${p.thumbnail || "/img/products/Image-placeholder.png"}">
        <h3>${p.title}</h3>
        <div class="category">${p.category}</div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error("목록 오류:", err);
    list.innerHTML = "<p style='color:red;'>목록을 불러올 수 없습니다</p>";
  }
}
