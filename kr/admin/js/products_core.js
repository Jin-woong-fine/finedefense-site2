console.log("%c[products_core] 로드됨", "color:#4caf50;font-weight:bold;");

function getAuthHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

let editor = null;
let newImageFiles = [];          // 🔥 새 이미지들 (드래그 정렬 포함)
let currentLangFilter = "kr";    // 🔥 기본: 한국어

window.initProductsPage = function () {
  initEditor();
  initImageDragPreview();
  initLangFilterUI();
  initFormSubmit();
  loadProductList(currentLangFilter);
};

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
    const files = Array.from(input.files);
    newImageFiles = [...newImageFiles, ...files];
    renderPreview();
  });

  function renderPreview() {
    preview.innerHTML = "";

    newImageFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wrap = document.createElement("div");
        wrap.className = "img-item";

        const img = document.createElement("img");
        img.src = ev.target.result;

        const btn = document.createElement("button");
        btn.className = "remove-btn";
        btn.textContent = "×";

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
    if (!preview) return;

    Sortable.create(preview, {
      animation: 150,
      onSort: () => {
        const items = preview.querySelectorAll(".img-item");
        const reordered = [];

        items.forEach((item, indexInDom) => {
          reordered.push(newImageFiles[indexInDom]);
        });

        newImageFiles = reordered;
      },
    });
  }
}

/* ============================================
   🔵 언어 필터 UI
============================================ */
function initLangFilterUI() {
  const buttons = document.querySelectorAll(".lang-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang; // "kr", "en", "all"
      currentLangFilter = lang;

      // 버튼 active 토글
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 목록 다시 로드
      loadProductList(currentLangFilter);
    });
  });
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

    // 🔥 드래그로 정렬된 순서대로 업로드
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

    // 현재 선택된 언어 필터 기준 재로딩
    loadProductList(currentLangFilter);
  });
}

/* ============================================
   목록 로딩 (언어필터 반영)
============================================ */
async function loadProductList(langFilter) {
  const list = document.getElementById("productList");
  list.innerHTML = "Loading...";

  let products = [];

  try {
    if (langFilter === "all") {
      // KR + EN 둘 다 가져오기
      const [krRes, enRes] = await Promise.all([
        fetch("/api/products?lang=kr", { headers: getAuthHeaders() }),
        fetch("/api/products?lang=en", { headers: getAuthHeaders() }),
      ]);

      const kr = krRes.ok ? await krRes.json() : [];
      const en = enRes.ok ? await enRes.json() : [];

      products = [...kr, ...en];

      // sort_order ASC, created_at DESC 기준으로 대략 정렬
      products.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return (a.sort_order || 999) - (b.sort_order || 999);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

    } else {
      const res = await fetch(`/api/products?lang=${langFilter}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        list.innerHTML = "<p>목록을 불러오는 중 오류가 발생했습니다.</p>";
        return;
      }
      products = await res.json();
    }

    if (!products.length) {
      list.innerHTML = "<p>등록된 제품이 없습니다.</p>";
      return;
    }

    list.innerHTML = products
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
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>목록을 불러오는 중 오류가 발생했습니다.</p>";
  }
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

/* ============================================
   수정 / 삭제
============================================ */
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
  loadProductList(currentLangFilter);
}
