/* ============================================================================
   🔐 관리자 인증 체크
============================================================================ */
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("관리자 로그인이 필요합니다.");
  location.href = "/kr/admin/login.html";
}

const API = "/api";
const postId = new URLSearchParams(location.search).get("id");

if (!postId) {
  alert("유효하지 않은 접근입니다.");
  location.href = "/kr/admin/newsroom_list.html";
}

/* ============================================================================
   🖋 Quill Editor 초기화
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

  loadPost();   // 게시글 로딩
});


/* ============================================================================
   📌 기존 게시글 불러오기
============================================================================ */
let removedImages = [];
let newImageFiles = [];

async function loadPost() {
  try {
    const res = await fetch(`${API}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("불러오기 실패");

    const post = await res.json();

    // 값 채우기
    document.getElementById("title").value = post.title || "";
    document.getElementById("category").value = post.category || "news";
    document.getElementById("lang").value = post.lang || "kr";
    quill.root.innerHTML = post.content || "";

    renderExistingImages(post.images || []);

  } catch (err) {
    console.error(err);
    alert("게시물 정보를 불러오지 못했습니다.");
  }
}


/* ============================================================================
   🖼 기존 이미지 렌더링 + 삭제 버튼
============================================================================ */
function renderExistingImages(images) {
  const box = document.getElementById("existingImages");
  box.innerHTML = "";

  images.forEach((img) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";

    const imageEl = document.createElement("img");
    imageEl.src = img.startsWith("http") ? img : img;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";

    removeBtn.onclick = () => {
      removedImages.push(img);
      wrap.remove();
    };

    wrap.appendChild(imageEl);
    wrap.appendChild(removeBtn);
    box.appendChild(wrap);
  });
}


/* ============================================================================
   🟦 새로운 이미지 선택 + 미리보기
============================================================================ */
document.getElementById("newImages").addEventListener("change", (event) => {
  const selected = Array.from(event.target.files);
  newImageFiles = [...newImageFiles, ...selected];
  renderNewPreviews();
});

function renderNewPreviews() {
  const box = document.getElementById("newPreview");
  box.innerHTML = "";

  newImageFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrap = document.createElement("div");
      wrap.className = "preview-item";

      const img = document.createElement("img");
      img.src = e.target.result;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "×";

      removeBtn.onclick = () => {
        newImageFiles = newImageFiles.filter((_, i) => i !== idx);
        renderNewPreviews();
      };

      wrap.appendChild(img);
      wrap.appendChild(removeBtn);
      box.appendChild(wrap);
    };

    reader.readAsDataURL(file);
  });
}


/* ============================================================================
   💾 수정 저장 (PUT)
============================================================================ */
document.getElementById("saveBtn").addEventListener("click", savePost);

async function savePost() {
  const title = document.getElementById("title").value.trim();
  const category = document.getElementById("category").value;
  const lang = document.getElementById("lang").value;
  const content = quill.root.innerHTML.trim();

  if (!title) return alert("제목을 입력하세요.");
  if (!content.replace(/<p><br><\/p>/g, "").trim())
    return alert("내용을 입력하세요.");

  const fd = new FormData();
  fd.append("title", title);
  fd.append("category", category);
  fd.append("lang", lang);
  fd.append("content", content);

  // 삭제 목록
  fd.append("removedImages", JSON.stringify(removedImages));

  // 새로운 이미지
  newImageFiles.forEach((f) => fd.append("newImages", f));

  try {
    const res = await fetch(`${API}/posts/${postId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) throw new Error("수정 실패");

    alert("게시물 수정이 완료되었습니다!");
    location.href = "/kr/admin/newsroom_list.html";

  } catch (err) {
    console.error(err);
    alert("수정 도중 오류 발생 (서버 로그 확인 필요)");
  }
}
