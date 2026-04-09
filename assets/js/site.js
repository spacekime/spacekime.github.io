const slides = Array.from({ length: 15 }, (_, index) => {
  const pageNumber = String(index + 1).padStart(2, "0");
  return {
    src: `assets/img/architecture/page-${pageNumber}.jpg`,
    label: `Page ${index + 1} of 15`,
    alt: `The Spacekime Architecture page ${index + 1} of 15`,
  };
});

const imageEl = document.querySelector("[data-carousel-image]");
const captionEl = document.querySelector("[data-carousel-caption]");
const dotsEl = document.querySelector("[data-carousel-dots]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const carouselEl = document.querySelector("[data-carousel]");
const yearEl = document.querySelector("[data-current-year]");

let currentSlide = 0;
let autoplayId = null;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function renderSlide(index) {
  const slide = slides[index];
  imageEl.src = slide.src;
  imageEl.alt = slide.alt;
  captionEl.textContent = slide.label;

  dotsEl.querySelectorAll(".carousel-dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
    dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
  });
}

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  renderSlide(currentSlide);
  restartAutoplay();
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function previousSlide() {
  goToSlide(currentSlide - 1);
}

function stopAutoplay() {
  if (autoplayId !== null) {
    window.clearInterval(autoplayId);
    autoplayId = null;
  }
}

function startAutoplay() {
  if (prefersReducedMotion || slides.length < 2) {
    return;
  }

  stopAutoplay();
  autoplayId = window.setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    renderSlide(currentSlide);
  }, 5000);
}

function restartAutoplay() {
  stopAutoplay();
  startAutoplay();
}

function buildDots() {
  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.className = "carousel-dot";
    button.type = "button";
    button.setAttribute("aria-label", `Go to architecture ${slide.label}`);
    button.addEventListener("click", () => goToSlide(index));
    dotsEl.appendChild(button);
  });
}

if (imageEl && captionEl && dotsEl && prevButton && nextButton && carouselEl) {
  buildDots();
  renderSlide(currentSlide);

  prevButton.addEventListener("click", previousSlide);
  nextButton.addEventListener("click", nextSlide);

  carouselEl.addEventListener("mouseenter", stopAutoplay);
  carouselEl.addEventListener("mouseleave", startAutoplay);
  carouselEl.addEventListener("focusin", stopAutoplay);
  carouselEl.addEventListener("focusout", (event) => {
    if (!carouselEl.contains(event.relatedTarget)) {
      startAutoplay();
    }
  });

  startAutoplay();
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
