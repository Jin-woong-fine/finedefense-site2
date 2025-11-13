function loadNewsroom(jsonPath) {
  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      const list = document.querySelector('.news-list');
      if (!list) return;

      const defaultImage = "/img/newsroom/newsroom-placeholder_v2.png";

      // ✅ 카드 HTML 생성
      list.innerHTML = data.map(item => {
        const imageSrc = item.image && item.image.trim() !== ""
          ? item.image
          : defaultImage;

        return `
          <a href="${item.link}" class="news-item ${item.category}">
            <img src="${imageSrc}" alt="${item.title}">
            <div class="news-info">
              <h3>${item.title}</h3>
              <p>${item.desc}</p>
              <span class="news-date">${item.date}</span>
            </div>
          </a>
        `;
      }).join('');

      // ✅ 필터링 기능 적용
      const buttons = document.querySelectorAll('.news-filter button');
      const items = document.querySelectorAll('.news-item');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.getAttribute('data-filter');

          items.forEach(item => {
            item.style.display =
              filter === 'all' || item.classList.contains(filter)
                ? 'flex'
                : 'none';
          });
        });
      });
    })
    .catch(err => console.error("❌ 뉴스 데이터를 불러올 수 없습니다:", err));
}
