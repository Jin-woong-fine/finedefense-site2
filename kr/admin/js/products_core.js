/* ============================================================================
   🔐 관리자 토큰
   - requireAdmin()은 common_auth.js에서 이미 실행됨
============================================================================ */
const token = localStorage.getItem("token");
const API_BASE = "/api";

/* ============================================================================
   🖋 Quill 에디터 & 이미지 파일 상태
============================================================================ */
let quill;
let imageFiles = [];

/* DOM 준비되면 에디터 및 이벤트 세팅 */
document.addEventListener("DOMContentLoaded", () => {
  initQuill();
  initImageInput();
  loadProductList();
});

/* Quill 초기화 */
function initQuill() {
  const editorEl = document.getElementById("editor");
  if (!editorEl) return;

  quill = new Quill("#editor", {
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
}

/* ============================================================================
   🖼 이미지 여러 개 선택 + 미리보기
============================================================================ */
function initImageInput() {
  const input = document.getElementById("images");
  const previewBox = document.getElementById("preview");

  if (!input || !previewBox) return;

  input.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    imageFiles = [...imageFiles, ...files];
    renderImagePreview();
  });
}

/* 이미지 썸네일 미리보기 렌더링 */
function renderImagePreview() {
  const previewBox = document.getElementById("preview");
  if (!previewBox) return;

  previewBox.innerHTML = "";

  imageFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;

      const wrap = document.createElement("div");
      wrap.style.position = "relative";

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
      removeBtn.style.cursor = "pointer";

      removeBtn.onclick = () => {
        imageFiles = imageFiles.filter((_, i) => i !== idx);
        renderImagePreview();
      };

      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      previewBox.appendChild(wrap);
    };

    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   🧩 slug 유틸 (자동 파일명 / URL 생성용 - 선택적 사용)
============================================================================ */
function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[ㄱ-ㅎ가-힣]/g, "")       // 한글 제거 (원하면 유지해도 됨)
    .replace(/[^a-z0-9]+/g, "-")        // 영문/숫자 제외 모두 -
    .replace(/^-+|-+$/g, "")            // 앞뒤 - 제거
    .substring(0, 60);                  // 너무 길면 자르기
}

/* ============================================================================
   📦 제품 등록
============================================================================ */
async function uploadProduct() {
  const titleEl = document.getElementById("title");
  const categoryEl = document.getElementById("category");

  const title = (titleEl?.value || "").trim();
  const category = categoryEl?.value || "";
  const description = quill ? quill.root.innerHTML.trim() : "";

  if (!title) {
    alert("제품명을 입력하세요.");
    return;
  }
  if (!category) {
    alert("카테고리를 선택하세요.");
    return;
  }
  if (!description.replace(/<p><br><\/p>/g, "").trim()) {
    if (!confirm("제품 설명이 비어 있습니다. 계속 진행할까요?")) return;
  }

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description", description);

  // 선택: 서버에서 상세페이지 자동 생성 시 사용할 slug
  const slug = slugify(title);
  fd.append("slug", slug);

  // 여러 이미지
  imageFiles.forEach((file) => fd.append("images", file));

  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("등록 실패 응답:", text);
      alert("제품 등록 실패 (서버 확인 필요)");
      return;
    }

    alert("제품 등록 완료!");

    // 폼 리셋
    titleEl.value = "";
    categoryEl.value = "";
    if (quill) quill.root.innerHTML = "";
    imageFiles = [];
    renderImagePreview();

    loadProductList();
  } catch (err) {
    console.error(err);
    alert("통신 오류로 등록에 실패했습니다.");
  }
}

/* 전역에서 호출 가능하도록 window에 붙이기 */
window.uploadProduct = uploadProduct;

/* ============================================================================
   📥 제품 목록 불러오기
============================================================================ */
async function loadProductList() {
  const listBox = document.getElementById("productList");
  if (!listBox) return;

  listBox.innerHTML = "불러오는 중...";

  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("목록 조회 실패");

    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      listBox.innerHTML = "<p style='color:#666;'>등록된 제품이 없습니다.</p>";
      return;
    }

    listBox.innerHTML = products
      .map((p) => renderProductCardHTML(p))
      .join("");
  } catch (err) {
    console.error(err);
    listBox.innerHTML = "<p style='color:#d00;'>제품 목록을 불러오는 중 오류가 발생했습니다.</p>";
  }
}

/* 제품 카드 HTML */
function renderProductCardHTML(p) {
  const thumb =
    p.thumbImage ||
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "/img/products/Image-placeholder.png");

  const categoryLabel = getCategoryLabel(p.category);

  const detailPath = p.detailPath || ""; // 서버에서 만들어주면 표시
  const hasDetail = !!detailPath;

  return `
    <div class="product-card">
      <img src="${thumb}" alt="${p.title || "제품 이미지"}">
      <h3>${p.title || ""}</h3>
      <div class="category">카테고리: ${categoryLabel}</div>

      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
        <button class="btn btn-edit" onclick="editProduct(${p.id})">수정</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">삭제</button>
        ${
          hasDetail
            ? `<button class="btn btn-primary" onclick="openDetail('${detailPath}')">상세보기</button>`
            : ""
        }
      </div>
    </div>
  `;
}

/* 카테고리 표시용 라벨 */
function getCategoryLabel(code) {
  switch (code) {
    case "towed": return "수중이동형 케이블";
    case "fixed": return "수중고정형 케이블";
    case "connector": return "수중 커넥터";
    case "custom": return "커스텀 케이블";
    default: return code || "미지정";
  }
}

/* ============================================================================
   ✏ 수정 / 삭제 / 상세보기
============================================================================ */
window.editProduct = (id) => {
  location.href = `/kr/admin/edit_product.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("삭제 실패");

    alert("삭제되었습니다.");
    loadProductList();
  } catch (err) {
    console.error(err);
    alert("삭제 중 오류 발생 (서버 로그 확인 필요)");
  }
};

window.openDetail = (path) => {
  if (!path) return;
  // 상대/절대 모두 처리
  if (path.startsWith("http")) {
    window.open(path, "_blank");
  } else {
    window.open(path, "_blank");
  }
};
