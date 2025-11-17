/* ======================================================================
    🌟 디버그 모드 ON
====================================================================== */
console.log("%c[DEBUG] products_core_debug.js 로드됨", "color:#4caf50;font-weight:bold;");

/* ======================================================================
    🔧 slugify
====================================================================== */
function slugify(text) {
  const out = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[ㄱ-ㅎ가-힣]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);

  console.log("[slugify]", text, "=>", out);
  return out;
}

/* ======================================================================
    🔐 토큰
====================================================================== */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  console.log("[Auth] token=", token);
  return { Authorization: `Bearer ${token}` };
}

/* ======================================================================
    📌 상태 변수
====================================================================== */
let quill;
let imageFiles = [];

console.log("[STATE] 초기 imageFiles =", imageFiles);

/* ======================================================================
    🔧 초기화
====================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  console.log("%c[DEBUG] DOMContentLoaded 실행", "color:#2196f3;font-weight:bold;");

  initQuill();
  initImageInput();
  loadProductList();
});

/* ======================================================================
    🖋 Quill
====================================================================== */
function initQuill() {
  const editorEl = document.getElementById("editor");
  if (!editorEl) {
    console.error("[Quill] 에디터 요소 없음 (#editor)");
    return;
  }

  console.log("[Quill] 초기화 시작");

  try {
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

    console.log("[Quill] 초기화 완료:", quill);
  } catch (err) {
    console.error("[Quill] 초기화 실패:", err);
  }
}

/* ======================================================================
    🖼 이미지 미리보기
====================================================================== */
function initImageInput() {
  const input = document.getElementById("images");
  const previewBox = document.getElementById("preview");

  if (!input) return console.error("[ImageInput] Input 요소 없음 (#images)");
  if (!previewBox) return console.error("[ImageInput] Preview 요소 없음 (#preview)");

  console.log("[ImageInput] 초기화 완료");

  input.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);

    console.log("[ImageInput] 선택한 파일:", files);

    imageFiles = [...imageFiles, ...files];
    console.log("[ImageInput] imageFiles 업데이트:", imageFiles);

    renderImagePreview();
  });
}

function renderImagePreview() {
  const previewBox = document.getElementById("preview");
  if (!previewBox) return console.error("[Preview] preview 요소 없음");

  previewBox.innerHTML = "";

  console.log("[Preview] 렌더링 시작. 총", imageFiles.length, "개");

  imageFiles.forEach((file, idx) => {
    console.log(`[Preview] 파일[${idx}]`, file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      console.log(`[Preview] FileReader 완료 idx=${idx}`);

      const wrap = document.createElement("div");
      wrap.style.position = "relative";

      const img = document.createElement("img");
      img.src = ev.target.result;

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

      removeBtn.onclick = () => {
        console.log(`[Preview] 삭제 클릭 idx=${idx}`);
        imageFiles.splice(idx, 1);
        console.log("[Preview] 삭제 후 imageFiles:", imageFiles);
        renderImagePreview();
      };

      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      previewBox.appendChild(wrap);
    };

    reader.onerror = () => console.error("[Preview] FileReader 오류:", reader.error);

    reader.readAsDataURL(file);
  });
}

/* ======================================================================
    📦 제품 등록
====================================================================== */
async function uploadProduct() {
  console.log("%c[Upload] 제품 등록 시작", "color:#e91e63;font-weight:bold;");

  try {
    const title = document.getElementById("title")?.value.trim();
    const category = document.getElementById("category")?.value;
    const description = quill ? quill.root.innerHTML.trim() : "";

    console.log("[Upload] title:", title);
    console.log("[Upload] category:", category);
    console.log("[Upload] description 길이:", description.length);
    console.log("[Upload] imageFiles:", imageFiles);

    if (!title) return alert("제품명을 입력하세요.");
    if (!category) return alert("카테고리를 선택하세요.");

    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", category);
    fd.append("description_html", description);

    imageFiles.forEach((f) => {
      console.log("[Upload] 이미지 추가:", f.name);
      fd.append("images", f);
    });

    console.log("[Upload] 서버로 전송 시작");

    const res = await fetch("/api/products", {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });

    console.log("[Upload] 응답 상태:", res.status);

    if (!res.ok) {
      const txt = await res.text();
      console.error("[Upload] 서버 오류:", txt);
      alert("❌ 서버 오류 발생\n" + txt);
      return;
    }

    console.log("[Upload] 등록 성공");

    alert("등록 완료!");

    // 초기화
    imageFiles = [];
    renderImagePreview();
    if (quill) quill.root.innerHTML = "";

    loadProductList();
  } catch (err) {
    console.error("[Upload] 예외 발생:", err);
    alert("업로드 오류");
  }
}

window.uploadProduct = uploadProduct;

/* ======================================================================
    📥 목록 불러오기
====================================================================== */
async function loadProductList() {
  console.log("%c[LOAD] 목록 불러오기 시작", "color:#009688;font-weight:bold;");

  const box = document.getElementById("productList");
  if (!box) return console.error("[LOAD] productList 요소 없음");

  try {
    const res = await fetch("/api/products", {
      headers: getAuthHeaders(),
    });

    console.log("[LOAD] HTTP", res.status);

    if (!res.ok) throw new Error("목록 조회 실패");

    const products = await res.json();

    console.log("[LOAD] 조회된 제품 수:", products.length);
    console.table(products);

    box.innerHTML = products.map(renderProductCardHTML).join("");
  } catch (err) {
    console.error("[LOAD] 오류:", err);
    box.innerHTML = "<p style='color:red;'>불러오기 실패</p>";
  }
}

/* ======================================================================
    카드 렌더링
====================================================================== */
function renderProductCardHTML(p) {
  console.log("[CARD] 렌더링:", p);

  const img = p.thumbnail || "/img/products/Image-placeholder.png";

  return `
    <div class="product-card">
      <img src="${img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="category">${getCategoryLabel(p.category)}</div>
      <div style="display:flex;gap:6px;margin-top:10px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
      </div>
    </div>
  `;
}

function getCategoryLabel(code) {
  return {
    towed: "수중이동형 케이블",
    fixed: "수중고정형 케이블",
    connector: "수중 커넥터",
    custom: "커스텀 케이블",
  }[code] || "미지정";
}

/* ======================================================================
    수정 / 삭제
====================================================================== */
window.editProduct = (id) => {
  console.log("[EDIT] 이동:", id);
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  console.warn("[DELETE] 요청:", id);
  if (!confirm("삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    console.log("[DELETE] 응답:", res.status);

    if (!res.ok) throw new Error("삭제 실패");

    alert("삭제 완료");
    loadProductList();
  } catch (err) {
    console.error("[DELETE] 오류:", err);
  }
};
