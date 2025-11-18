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
}

/* =========================================================
 🖼 이미지 프리뷰
========================================================= */
function initImagePreview() {
  const input = document.getElementById("images");
  const preview = document.getElementById("preview");

  input.addEventListener("change", () => {
    preview.innerHTML = "";

    Array.from(input.files).forEach((file) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.style.width = "80px";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";

      preview.appendChild(img);
    });
  });
}

/* =========================================================
 📤 제품 업로드 (FormData manual append)
========================================================= */
function initFormSubmit() {
  const form = document.getElementById("productForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("[Form] 제출 시작");

    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const files = document.getElementById("images").files;

    if (!title || !category) {
      alert("제품명과 카테고리는 필수입니다.");
      return;
    }

    // ⭐ FormData(form) 절대 사용하지 않는다 (Chrome Drop 문제)
    const fd = new FormData();

    fd.append("title", title);
    fd.append("category", category);
    fd.append("description_html", editor.getHTML());

    // ⭐ 파일 append — Chrome drop 문제 해결
    for (let i = 0; i < files.length; i++) {
      fd.append("images", files[i]);
    }

    console.log("[FormData] 구성 완료");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd, // Content-Type 자동 설정됨
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("[Upload Error]", err || res.statusText);
        alert("등록 실패: " + (err?.detail || res.statusText));
        return;
      }

      alert("등록 완료!");

      // 초기화
      form.reset();
      editor.setHTML("");
      document.getElementById("preview").innerHTML = "";

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
  list.innerHTML = "불러오는 중...";

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

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
