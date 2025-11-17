/* ============================================================================
   🔐 토큰 & 기본 설정
============================================================================ */
const token = localStorage.getItem("token");
const API_BASE = "/api";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

let quill;
let existingImages = []; // 서버에서 가져온 이미지 URL 목록
let removedImages = [];  // 삭제 요청할 이미지 URL 목록
let newImageFiles = [];  // 새로 추가한 이미지 파일 목록

/* ============================================================================
   🖋 DOM 로드 시 실행
============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initQuill();
  loadProduct();
  initNewImageUpload();
});

/* ============================================================================
   🖋 Quill 에디터 초기화
============================================================================ */
function initQuill() {
  quill = new Quill("#editor", {
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"]
      ]
    }
  });
}

/* ============================================================================
   📥 제품 상세 불러오기
============================================================================ */
async function loadProduct() {
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  const p = data.product;
  const imgs = data.images;

  // ----- 제목, 카테고리, 설명 -----
  document.getElementById("title").value = p.title;
  document.getElementById("category").value = p.category;
  quill.root.innerHTML = p.description_html || "";

  // ----- 기존 이미지 URL 정리 -----
  existingImages = imgs.map(i => i.url);

  renderExistingImages();
}

/* ============================================================================
   🖼 기존 이미지 렌더링
============================================================================ */
function renderExistingImages() {
  const box = document.getElementById("existingImages");
  box.innerHTML = "";

  existingImages.forEach((url, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";

    const img = document.createElement("img");
    img.src = url;

    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.className = "remove-btn";

    btn.onclick = () => {
      removedImages.push(url);        // 삭제 요청
      existingImages.splice(idx, 1);  // 현재 화면에서는 제거
      renderExistingImages();
    };

    wrap.appendChild(img);
    wrap.appendChild(btn);
    box.appendChild(wrap);
  });
}

/* ============================================================================
   🖼 새 이미지 미리보기 + 추가 로직
============================================================================ */
function initNewImageUpload() {
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
        wrap.className = "preview-item";

        const img = document.createElement("img");
        img.src = ev.target.result;

        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.className = "remove-btn";

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

/* ============================================================================
   💾 제품 수정 저장
============================================================================ */
document.getElementById("saveBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description_html = quill.root.innerHTML.trim();

  if (!title) return alert("제품명을 입력하세요.");

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description_html", description_html);

  // 삭제된 기존 이미지 (URL 배열)
  fd.append("removedImages", JSON.stringify(removedImages));

  // 새 이미지 추가
  newImageFiles.forEach((f) => fd.append("images", f));

  // ----- PUT 요청 -----
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  if (!res.ok) {
    alert("수정 실패 (서버 로그 확인 필요)");
    return;
  }

  alert("수정 완료!");
  location.href = "/kr/admin/products.html";
});
