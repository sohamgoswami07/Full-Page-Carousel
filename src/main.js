// import GSAP ScrollTrigger and SplitText
import { gsap } from "gsap";
import sliders from "../public/Constants/slidesData.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

document.addEventListener("DOMContentLoaded", () => {
  const totalSlides = sliders.length;
  let currentSlide = 1;

  let isAnimating = false;
  let scrollAllowed = true;
  let lastScrollTime = 0;

  // Create slide element
  function createSlide(slideIndex) {
    const slideData = sliders[slideIndex - 1];

    const slide = document.createElement("div");
    slide.className = "slide";

    const slideImg = document.createElement("div");
    slideImg.className = "slide-img";
    const img = document.createElement("img");
    img.src = slideData.imageUrl;
    img.alt = slideData.title;
    slideImg.appendChild(img);
    slide.append(slideImg);

    const slideHeader = document.createElement("div");
    slideHeader.className = "slide-header";
    slide.append(slideHeader);

    const slideTitle = document.createElement("div");
    slideTitle.className = "slide-title";
    const title = document.createElement("h1");
    title.textContent = slideData.title;
    slideTitle.appendChild(title);
    slideHeader.append(slideTitle);

    const slideDescription = document.createElement("div");
    slideDescription.className = "slide-description";
    const description = document.createElement("p");
    description.textContent = slideData.description;
    slideDescription.appendChild(description);
    slideHeader.append(slideDescription);

    const slideIndexWrapper = document.createElement("div");
    slideIndexWrapper.className = "slide-index-wrapper";
    slide.append(slideIndexWrapper);

    const currentSlideIndex = document.createElement("p");
    currentSlideIndex.className = "current-slide-index";
    currentSlideIndex.textContent = slideIndex.toString().padStart(2, "0");
    slideIndexWrapper.append(currentSlideIndex);

    const slideIndexSeparator = document.createElement("p");
    slideIndexSeparator.className = "slide-index-separator";
    slideIndexSeparator.textContent = "-";
    slideIndexWrapper.append(slideIndexSeparator);

    const totalSlideCount = document.createElement("p");
    totalSlideCount.className = "total-slide-count";
    totalSlideCount.textContent = totalSlides.toString().padStart(2, "0");
    slideIndexWrapper.append(totalSlideCount);

    return slide;
  }

  // Apply SplitText to headings + paragraphs (with safe fallback if Font Loading API isn't available)
  function applySplitText(slide) {
    const fontReady =
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    return fontReady.then(() => {
      const slideHeader = slide.querySelector(".slide-title h1");
      if (slideHeader) {
        new SplitText(slideHeader, { type: "words", wordsClass: "word" });
      }

      const slideContent = slide.querySelectorAll("p, a");
      slideContent.forEach((el) => {
        new SplitText(el, {
          type: "lines",
          linesClass: "line",
          reduceWhiteSpace: false,
        });
      });
    });
  }

  // Main slide animation
  function animateSlide(direction) {
    if (isAnimating || !scrollAllowed) return;

    isAnimating = true;
    scrollAllowed = false;

    const slider = document.querySelector(".slider");
    const currentSlideElement = slider.querySelector(".slide");

    // Update index
    currentSlide =
      direction === "down"
        ? (currentSlide === totalSlides ? 1 : currentSlide + 1)
        : (currentSlide === 1 ? totalSlides : currentSlide - 1);

    // Create new slide and set initial transform states using yPercent (NOT vh)
    const newSlide = createSlide(currentSlide);
    slider.appendChild(newSlide);

    // Ensure stacking order so the incoming slide is above the outgoing one
    gsap.set(currentSlideElement, { zIndex: 1 });
    gsap.set(newSlide, {
      zIndex: 2,
      // Enter from bottom when scrolling down, from top when scrolling up
      yPercent: direction === "down" ? 100 : -100,
      autoAlpha: 0,
      scale: 0.98,
      transformOrigin: "50% 50%",
    });

    // Container timeline: start immediately (no waiting on fonts)
    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut", duration: 1.1 },
      onComplete: () => {
        // Clean up old slide after animation completes
        currentSlideElement.remove();
        isAnimating = false;
        setTimeout(() => (scrollAllowed = true), 160);
      },
    });

    // Exit old slide
    tl.to(
      currentSlideElement,
      {
        yPercent: direction === "down" ? -100 : 100,
        rotation: 0,
        scale: 0.8,
        autoAlpha: 0,
      },
      0
    );

    // Enter new slide
    tl.to(
      newSlide,
      {
        yPercent: 0,
        autoAlpha: 1,
        scale: 1,
      },
      0 // start at the same time as exit for a smooth crossfade/slide
    );

    // Text reveal runs in parallel as soon as fonts/split is ready
    applySplitText(newSlide).then(() => {
      const words = newSlide.querySelectorAll(".word");
      const lines = newSlide.querySelectorAll(".line");

      // Set initial states for split pieces
      gsap.set(words, { yPercent: 100 });
      gsap.set(lines, { yPercent: 100 });

      // Staggered reveals; slight delay so the container motion is already underway
      gsap.to(words, {
        yPercent: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.15,
      });
      gsap.to(lines, {
        yPercent: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.15,
      });
    });
  }

  // Handle scroll with throttle
  function handleScroll(direction) {
    const now = Date.now();
    if (isAnimating || !scrollAllowed) return;
    if (now - lastScrollTime < 800) return; // throttle
    lastScrollTime = now;
    animateSlide(direction);
  }

  // Mouse wheel
  window.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? "down" : "up";
      handleScroll(direction);
    },
    { passive: false }
  );

  // Touch gestures
  let touchStartY = 0;
  let isTouchActive = false;

  window.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0].clientY;
      isTouchActive = true;
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      if (!isTouchActive || isAnimating || !scrollAllowed) return;

      const touchCurrentY = event.touches[0].clientY;
      const difference = touchStartY - touchCurrentY;

      if (Math.abs(difference) > 50) {
        isTouchActive = false;
        const direction = difference > 0 ? "down" : "up";
        handleScroll(direction);
      }
    },
    { passive: false }
  );

  window.addEventListener("touchend", () => {
    isTouchActive = false;
  });
});
