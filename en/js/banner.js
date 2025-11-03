const slidesContainer = document.querySelector('.slides');
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const paginationContainer = document.querySelector('.pagination');

let index = 0;
let autoSlide;
const totalSlides = slides.length;

// 1. 초기 설정
slidesContainer.style.display = 'flex';
slidesContainer.style.transition = 'transform 0.6s ease-in-out';
slides.forEach(slide => {
  slide.style.flex = '0 0 100%'; // 한 화면에 하나씩
});

// 2. 페이지네이션 생성
for (let i = 0; i < totalSlides; i++) {
  const dot = document.createElement('div');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => {
    moveToSlide(i);
    resetAutoSlide();
  });
  paginationContainer.appendChild(dot);
}
const dots = paginationContainer.querySelectorAll('div');

function updatePagination() {
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

// 3. 슬라이드 이동
function moveToSlide(i) {
  index = i;
  slidesContainer.style.transform = `translateX(-${index * 100}%)`;
  updatePagination();
}

// 4. 버튼 클릭
nextBtn.addEventListener('click', () => { 
  moveToSlide((index + 1) % totalSlides); 
  resetAutoSlide(); 
});
prevBtn.addEventListener('click', () => { 
  moveToSlide((index - 1 + totalSlides) % totalSlides); 
  resetAutoSlide(); 
});

// 5. 자동 슬라이드
function startAutoSlide() {
  autoSlide = setInterval(() => {
    moveToSlide((index + 1) % totalSlides);
  }, 5000);
}
function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}
startAutoSlide();

// 6. 터치 지원 (좌우 스와이프)
let startX = 0;
let moveX = 0;

slidesContainer.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
slidesContainer.addEventListener('touchmove', e => { moveX = e.touches[0].clientX - startX; });
slidesContainer.addEventListener('touchend', e => {
  if (moveX > 50) moveToSlide((index - 1 + totalSlides) % totalSlides);
  else if (moveX < -50) moveToSlide((index + 1) % totalSlides);
  resetAutoSlide();
  moveX = 0;
});
