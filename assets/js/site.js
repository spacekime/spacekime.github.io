const imageEl = document.querySelector("[data-carousel-image]");
const captionEl = document.querySelector("[data-carousel-caption]");
const dotsEl = document.querySelector("[data-carousel-dots]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const carouselEl = document.querySelector("[data-carousel]");
const yearEl = document.querySelector("[data-current-year]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const defaultArchitecturePageCount = 15;

function buildSlides(pageCount) {
  const totalPages = Math.max(1, pageCount);

  return Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = String(index + 1).padStart(2, "0");

    return {
      src: `assets/img/architecture/page-${pageNumber}.jpg`,
      label: `Page ${index + 1} of ${totalPages}`,
      alt: `The Spacekime Architecture page ${index + 1} of ${totalPages}`,
    };
  });
}

async function loadArchitectureSlides() {
  const manifestPath = carouselEl?.dataset.carouselManifest;

  if (!manifestPath) {
    return buildSlides(defaultArchitecturePageCount);
  }

  try {
    const response = await fetch(manifestPath, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load architecture manifest: ${response.status}`);
    }

    const manifest = await response.json();
    const pageCount = Number(manifest.pageCount);

    if (!Number.isInteger(pageCount) || pageCount < 1) {
      throw new Error("Architecture manifest must define a positive integer pageCount.");
    }

    return buildSlides(pageCount);
  } catch (error) {
    console.warn(error);
    return buildSlides(defaultArchitecturePageCount);
  }
}

async function initCarousel() {
  if (!(imageEl && captionEl && dotsEl && prevButton && nextButton && carouselEl)) {
    return;
  }

  const slides = await loadArchitectureSlides();
  let currentSlide = 0;
  let autoplayId = null;

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

  function goToSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    renderSlide(currentSlide);
    restartAutoplay();
  }

  function buildDots() {
    dotsEl.replaceChildren();

    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.className = "carousel-dot";
      button.type = "button";
      button.setAttribute("aria-label", `Go to architecture ${slide.label}`);
      button.addEventListener("click", () => goToSlide(index));
      dotsEl.appendChild(button);
    });
  }

  buildDots();
  renderSlide(currentSlide);

  prevButton.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextButton.addEventListener("click", () => goToSlide(currentSlide + 1));

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

void initCarousel();

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
