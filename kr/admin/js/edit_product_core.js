/* ============================================================
   🔐 공통 설정
============================================================ */
const token = localStorage.getItem("token");
const API = "/api";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

let editor;             // Toast UI Editor
let existingImages = []; // 기존 이미지 URL 배열
let removedImages = [];  // 삭제할 URL 배열
let newImageFiles = [];  // 새로 추가한 이미지 파일들

/* ============================================================
   🧩 초기화
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  loadProduct();
  initAddImagePreview();
});

/* ============================================================
   ✏ Toast UI Editor 초기화
============================================================ */
function initEditor() {
  const Editor = toastui.Editor;

  editor = new Editor({
    el: document.querySelector('#editor'),
    height: '320px',
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical'
  });
}

/* ============================================================
   📥 제품 상세 불러오기
============================================================ */
async function loadProduct() {
  const res = await fetch(`${API}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const p = data.product;

  document.getElementById("title").value = p.title;
  document.getElementById("category").value = p.category;
  editor.setHTML(p.description_html || "");

  existingImages = data.images.map(i => i.url);

  renderExistingImages();
}

/* ============================================================
   🖼 기존 이미지 렌더링
============================================================ */
function renderExistingImages() {
  const box = document.getElementById("existingImages");
  box.innerHTML = "";

  existingImages.forEach((url, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "img-item";

    const img = document.createElement("img");
    img.src = url;

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "×";

    btn.onclick = () => {
      removedImages.push(url);
      existingImages.splice(idx, 1);
      renderExistingImages();
    };

    wrap.appendChild(img);
    wrap.appendChild(btn);
    box.appendChild(wrap);
  });
}

/* ============================================================
   🖼 새 이미지 추가 미리보기
============================================================ */
function initAddImagePreview() {
  const input = document.getElementById("newImages");
  const box = document.getElementById("newPreview");

  input.addEventListener("change", (e) => {
    newImageFiles = [...newImageFiles, ...Array.from(e.target.files)];
    renderNewPreview();
  });

  function renderNewPreview() {
    box.innerHTML = "";

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
          renderNewPreview();
        };

        wrap.appendChild(img);
        wrap.appendChild(btn);
        box.appendChild(wrap);
      };

      reader.readAsDataURL(file);
    });
  }
}

/* ============================================================
   💾 저장 (PUT)
============================================================ */
document.getElementById("saveBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description_html = editor.getHTML();

  if (!title) return alert("제품명을 입력하세요.");

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description_html", description_html);

  fd.append("removedImages", JSON.stringify(removedImages));

  newImageFiles.forEach((f) => fd.append("images", f));

  const res = await fetch(`${API}/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  if (!res.ok) {
    console.error(await res.text());
    return alert("수정 실패");
  }

  alert("수정 완료!");
  location.href = "/kr/admin/products.html";
});
