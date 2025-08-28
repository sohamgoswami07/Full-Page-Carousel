import { gsap } from "gsap";
import slides from "../public/Constants/slidesData.js";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

document.addEventListener("DOMContentLoaded", () => {
  const totalSlides = slides.length;
  let currentSlide = 1;
  let isAnimating = false;
  let lastScrollTime = 0;

  // Create slide element
  function createSlide(slideIndex) {
    const slideData = slides[slideIndex - 1];

    const slide = document.createElement("div");
    slide.className = "slide";

    // Image
    const slideImg = document.createElement("div");
    slideImg.className = "slide-img";
    const img = document.createElement("img");
    img.src = slideData.imageUrl;
    img.alt = slideData.title;
    slideImg.appendChild(img);
    slide.appendChild(slideImg);

    // Header container
    const slideHeader = document.createElement("div");
    slideHeader.className = "slide-header";
    slide.appendChild(slideHeader);

    // Title
    const slideTitle = document.createElement("div");
    slideTitle.className = "slide-title";
    const title = document.createElement("h1");
    title.textContent = slideData.title;
    slideTitle.appendChild(title);
    slideHeader.appendChild(slideTitle);

    // Description
    const slideDescription = document.createElement("div");
    slideDescription.className = "slide-description";
    const description = document.createElement("p");
    description.textContent = slideData.description;
    slideDescription.appendChild(description);
    slideHeader.appendChild(slideDescription);

    // Slide index
    const slideIndexWrapper = document.createElement("div");
    slideIndexWrapper.className = "slide-index-wrapper";
    
    const currentSlideIndex = document.createElement("p");
    currentSlideIndex.className = "current-slide-index";
    currentSlideIndex.textContent = slideIndex.toString().padStart(2, "0");
    
    const slideIndexSeparator = document.createElement("p");
    slideIndexSeparator.className = "slide-index-separator";
    slideIndexSeparator.textContent = "-";
    
    const totalSlideCount = document.createElement("p");
    totalSlideCount.className = "total-slide-count";
    totalSlideCount.textContent = totalSlides.toString().padStart(2, "0");
    
    slideIndexWrapper.append(currentSlideIndex, slideIndexSeparator, totalSlideCount);
    slide.appendChild(slideIndexWrapper);

    return slide;
  }

  // Apply SplitText
  function applySplitText(slide) {
    const slideHeader = slide.querySelector(".slide-title h1");
    if (slideHeader) {
      new SplitText(slideHeader, { type: "words", wordsClass: "word" });
    }

    const slideContent = slide.querySelectorAll("p");
    slideContent.forEach((el) => {
      new SplitText(el, { type: "lines", linesClass: "line" });
    });
  }

  // Main slide animation
  function animateSlide(direction) {
    if (isAnimating) return;

    isAnimating = true;

    const slider = document.querySelector(".slider");
    const currentSlideElement = slider.querySelector(".slide");

    // Update index
    currentSlide = direction === "down" 
      ? (currentSlide === totalSlides ? 1 : currentSlide + 1)
      : (currentSlide === 1 ? totalSlides : currentSlide - 1);

    // Create new slide
    const newSlide = createSlide(currentSlide);
    slider.appendChild(newSlide);

    // Set initial states
    gsap.set(currentSlideElement, { zIndex: 1 });
    gsap.set(newSlide, {
      zIndex: 2,
      yPercent: direction === "down" ? 100 : -100,
      rotation: -10,
      opacity: 0,
      scale: 0.98,
    });

    // Animation timeline
    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut", duration: 1.1 },
      onComplete: () => {
        currentSlideElement.remove();
        isAnimating = false;
      },
    });

    // Animate slides
    tl.to(currentSlideElement, {
      yPercent: direction === "down" ? -100 : 100,
      rotation: 10,
      scale: 0.8,
      opacity: 0,
    }, 0)
    .to(newSlide, {
      yPercent: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
    }, 0);

    // Text animation
    applySplitText(newSlide);
    const words = newSlide.querySelectorAll(".word");
    const lines = newSlide.querySelectorAll(".line");

    gsap.set([words, lines], { yPercent: 100, opacity: 0 });
    gsap.to([words, lines], {
      yPercent: 0,
      opacity: 1,
      duration: 0.15,
      ease: "power3.out",
      stagger: 0.15,
      delay: 0.85,
    });
  }

  // Handle scroll with throttle
  function handleScroll(direction) {
    const now = Date.now();
    if (isAnimating || now - lastScrollTime < 800) return;
    
    lastScrollTime = now;
    animateSlide(direction);
  }

  // Mouse wheel events
  window.addEventListener("wheel", (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? "down" : "up";
    handleScroll(direction);
  }, { passive: false });

  // Touch events
  let touchStartY = 0;

  window.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
  });

  window.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (isAnimating) return;

    const touchCurrentY = event.touches[0].clientY;
    const difference = touchStartY - touchCurrentY;

    if (Math.abs(difference) > 50) {
      const direction = difference > 0 ? "down" : "up";
      handleScroll(direction);
    }
  }, { passive: false });
});