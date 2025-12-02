/* ============================================================
   제품 상세 페이지 스크립트 (Toast UI Viewer 적용)
============================================================ */

async function loadProduct() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    alert("잘못된 접근입니다.");
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`);
    const out = await res.json();

    if (!res.ok) {
      alert("제품 정보를 불러오지 못했습니다.");
      return;
    }

    const p = out.product;
    const images = out.images || [];

    /* 제목/카테고리 */
    document.getElementById("productTitle").innerText = p.title;
    document.getElementById("productCategory").innerText =
      `${p.category.toUpperCase()} | ${p.lang.toUpperCase()}`;

    document.getElementById("crumbProduct").innerText = p.title;

    /* -------------------------
       이미지 갤러리
    ------------------------- */

    const mainImage = document.getElementById("mainImage");
    const thumbList = document.getElementById("thumbList");

    if (images.length > 0) {
      mainImage.src = images[0].url;
    }

    thumbList.innerHTML = "";

    images.forEach((img, index) => {
      const t = document.createElement("img");
      t.src = img.url;

      if (index === 0) t.classList.add("active");

      t.addEventListener("click", () => {
        document.querySelectorAll(".thumb-list img")
          .forEach(el => el.classList.remove("active"));
        t.classList.add("active");

        mainImage.src = img.url;
      });

      thumbList.appendChild(t);
    });

    /* -------------------------
       🔥 Toast UI Viewer 로 랜더링
    ------------------------- */

    new toastui.Editor.factory({
      el: document.querySelector("#productDesc"),
      viewer: true,
      height: "auto",
      initialValue: p.description_html || ""
    });

  } catch (err) {
    console.error(err);
    alert("서버 오류 발생");
  }
}

loadProduct();
