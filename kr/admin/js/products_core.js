console.log("%c[products_core] 로드됨", "color:#4caf50;font-weight:bold;");

function getAuthHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

window.initProductsPage = function () {
  initEditor();
  initImageDragPreview();
  initFormSubmit();
  loadProductList();
};

let editor = null;
let newImageFiles = [];  // 🔥 새 이미지 배열(드래그 정렬 반영)

/* ============================================
   Editor 초기화
============================================ */
function initEditor() {
  const Editor = toastui.Editor;
  editor = new Editor({
    el: document.getElementById("editor"),
    height: "320px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
  });
}

/* ============================================
   🔥 이미지 드래그 정렬 + 미리보기
============================================ */
function initImageDragPreview() {
  const input = document.getElementById("images");
  const preview = document.getElementById("preview");

  input.addEventListener("change", () => {
    const newFiles = Array.from(input.files);
    newImageFiles = [...newImageFiles, ...newFiles];
    renderPreview();
  });

  function renderPreview() {
    preview.innerHTML = "";

    newImageFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wrap = document.createElement("div");
        wrap.className = "img-item";
        wrap.style.position = "relative";

        const img = document.createElement("img");
        img.src = ev.target.result;
        img.style.width = "80px";
        img.style.height = "80px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "8px";
        img.style.border = "1px solid #ddd";

        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.style.position = "absolute";
        btn.style.top = "-6px";
        btn.style.right = "-6px";
        btn.style.width = "22px";
        btn.style.height = "22px";
        btn.style.borderRadius = "50%";
        btn.style.border = "none";
        btn.style.background = "crimson";
        btn.style.color = "#fff";
        btn.style.cursor = "pointer";

        btn.onclick = () => {
          newImageFiles.splice(idx, 1);
          renderPreview();
        };

        wrap.appendChild(img);
        wrap.appendChild(btn);
        preview.appendChild(wrap);
      };

      reader.readAsDataURL(file);
    });

    enablePreviewSort();
  }

  function enablePreviewSort() {
    Sortable.create(preview, {
      animation: 150,
      onSort: () => {
        const items = preview.querySelectorAll(".img-item");
        const reordered = [];

        items.forEach((item) => {
          const index = Array.from(items).indexOf(item);
          reordered.push(newImageFiles[index]);
        });

        newImageFiles = reordered;
      },
    });
  }
}

/* ============================================
   등록 처리
============================================ */
function initFormSubmit() {
  const form = document.getElementById("productForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const role = localStorage.getItem("role");
    if (role === "viewer") return alert("권한 없음");

    const title = document.getElementById("title").value.trim();
    const summary = document.getElementById("summary").value.trim() || "";
    const category = document.getElementById("category").value;
    const sort_order = document.getElementById("sort_order").value.trim() || "999";
    const lang = document.getElementById("lang").value;

    if (!title || !category) {
      return alert("제품명과 카테고리는 필수입니다.");
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("summary", summary);
    fd.append("category", category);
    fd.append("sort_order", sort_order);
    fd.append("lang", lang);
    fd.append("description_html", editor.getHTML());

    // 🔥 드래그로 정렬된 순서대로 파일 추가
    newImageFiles.forEach((f) => fd.append("images", f));

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });

    if (!res.ok) {
      alert("등록 실패");
      return;
    }

    alert("등록 완료");

    form.reset();
    editor.setHTML("");
    newImageFiles = [];
    document.getElementById("preview").innerHTML = "";

    loadProductList();
  });
}

/* ============================================
   목록 로딩
============================================ */
async function loadProductList() {
  const list = document.getElementById("productList");

  const res = await fetch("/api/products?lang=kr", {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  list.innerHTML = data
    .map(
      (p) => `
      <div class="product-card">
        <img src="${p.thumbnail || "/img/products/Image-placeholder.png"}">

        <div class="card-body">
          <h3 class="title">${p.title}</h3>
          <div class="category">
            ${p.category} | ${p.lang.toUpperCase()} | 순번: ${p.sort_order}
          </div>

          <div class="card-buttons">
            <button class="btn btn-primary btn-edit" onclick="editProduct('${p.id}')">수정</button>
            <button class="btn btn-danger btn-delete" onclick="deleteProduct('${p.id}')">삭제</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  applyRoleUI();
}

/* ============================================
   역할 기반 UI 제한
============================================ */
function applyRoleUI() {
  const role = localStorage.getItem("role");

  if (role === "viewer") {
    alert("권한 없음");
    location.href = "/kr/admin/login.html";
    return;
  }

  if (role === "editor") {
    document.querySelectorAll(".btn-delete").forEach((b) => (b.style.display = "none"));
  }
}

function editProduct(id) {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
}

async function deleteProduct(id) {
  const role = localStorage.getItem("role");
  if (role !== "admin" && role !== "superadmin") {
    return alert("삭제 권한 없음");
  }

  if (!confirm("정말 삭제하시겠습니까?")) return;

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) return alert("삭제 실패");

  alert("삭제 완료");
  loadProductList();
}
