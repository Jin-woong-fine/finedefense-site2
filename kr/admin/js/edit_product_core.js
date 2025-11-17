/* ============================================================================
   🔐 토큰 & 기본 설정
============================================================================ */
const token = localStorage.getItem("token");
const API_BASE = "/api";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

/* ============================================================================
   🖋 Quill 초기화
============================================================================ */
let quill;
document.addEventListener("DOMContentLoaded", () => {
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

  loadProduct();
  initNewImageUpload();
});

/* ============================================================================
   📥 기존 제품 정보 불러오기
============================================================================ */
async function loadProduct() {
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  const p = data.product;   // ★ 핵심
  const imgs = data.images; // ★ 핵심

  document.getElementById("title").value = p.title;
  document.getElementById("category").value = p.category;

  // ★ description_html을 읽어야 함
  quill.root.innerHTML = p.description_html || "";

  // ★ 이미지 URL 배열 생성
  existingImages = imgs.map(i => i.url);

  renderExistingImages();
}



function renderExistingImages() {
  const box = document.getElementById("existingImages");
  box.innerHTML = "";

  existingImages.forEach((url, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";

    const image = document.createElement("img");
    image.src = url; // ★ 이미 url임

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "×";
    btn.onclick = () => {
      removedImages.push(url);
      existingImages.splice(idx, 1);
      renderExistingImages();
    };

    wrap.appendChild(image);
    wrap.appendChild(btn);
    box.appendChild(wrap);
  });
}


/* ============================================================================
   📤 새 이미지 추가 및 미리보기
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

/* ============================================================================
   💾 수정 저장
============================================================================ */
document.getElementById("saveBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const description = quill.root.innerHTML.trim();

  if (!title) return alert("제품명을 입력하세요.");

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("description", description);

  // 삭제 이미지
  fd.append("removedImages", JSON.stringify(removedImages));

  // 새 이미지
  newImageFiles.forEach((f) => fd.append("newImages", f));

  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    alert("수정 실패! (서버 확인 필요)");
    return;
  }

  alert("수정 완료!");
  location.href = "/kr/admin/products.html";
});
