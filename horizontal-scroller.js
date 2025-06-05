/**
 * Horizontal Scroller
 * A clean implementation for horizontal scrolling websites that works on both desktop and mobile
 */

// CONFIGURABLE PARAMETERS - Adjust these for perfect animation
const ANIMATION_CONFIG = {
  // Drawing speed control (0.1 = very slow, 1.0 = fast)
  drawingSpeed: 0.1,

  // Spacing between path animations (0 = no gaps, 0.2 = small gaps)
  pathSpacing: 0.0,

  // Smooth easing for scrolling (lower = more smooth, higher = more responsive)
  scrollEasing: 0.08,

  // Touch sensitivity on mobile (higher = more sensitive)
  touchSensitivity: 3,

  // Overall animation scale (how much of total scroll is used for drawing)
  animationScale: 0.9,
};

class HorizontalScroller {
  constructor(options = {}) {
    // Default options
    this.options = {
      wrapper: ".wrapper",
      scroller: ".scroller",
      slides: ".slide",
      activeClass: "active",
      threshold: 0.2,
      easing: ANIMATION_CONFIG.scrollEasing,
      touchSensitivity: ANIMATION_CONFIG.touchSensitivity,
      snapToSlides: false,
      ...options,
    };

    // DOM elements
    this.wrapper = document.querySelector(this.options.wrapper);
    this.scroller = document.querySelector(this.options.scroller);
    this.slides = [...document.querySelectorAll(this.options.slides)];

    // State variables
    this.isMobile = window.innerWidth <= 767;
    this.currentSlide = 0;
    this.isScrolling = false;
    this.targetX = 0;
    this.currentX = 0;
    this.lastScrollPosition = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.isDragging = false;
    this.slideWidth = 0;
    this.totalWidth = 0;
    this.wrapperWidth = 0;
    this.pathsData = [];

    // Initialize
    this.init();
  }

  init() {
    // Set up event listeners
    this.setupEventListeners();

    // Initial calculations (needed for delay calculations)
    this.calculateDimensions();

    // Set up SVG paths for scroll-based animation (after dimensions are calculated)
    this.setupSVGPaths();

    // Set initial styles
    this.setupStyles();

    // Create control panel
    // this.createControlPanel();

    // Start animation loop
    this.animate();

    // Mark as initialized
    document.body.classList.add("horizontal-scroll-initialized");

    // Add visible class to first slide
    this.slides[0].classList.add(this.options.activeClass);
    this.showSlideContent(0);

    console.log("Horizontal scroller initialized");
  }

  createControlPanel() {
    // Create control panel HTML
    const controlPanel = document.createElement("div");
    controlPanel.className = "scroll-control-panel";
    controlPanel.innerHTML = `
      <div class="control-panel-header">
        <h3>🎛️ Animation Controls</h3>
        <button class="toggle-panel">×</button>
      </div>
      <div class="control-panel-content">
        <div class="control-group">
          <label>Default Drawing Speed: <span id="speed-value">${ANIMATION_CONFIG.drawingSpeed}</span></label>
          <input type="range" id="drawing-speed" min="0.01" max="0.2" step="0.01" value="${ANIMATION_CONFIG.drawingSpeed}">
          <small style="color: #666; font-size: 12px;">Individual SVGs can override this with data-speed attribute</small>
        </div>
        
        <div class="control-group">
          <label>Currently Drawing: <span id="current-svg">Ready...</span></label>
          <div id="progress-bar" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <div id="progress-fill" style="height: 100%; background: #007bff; width: 0%; transition: width 0.1s;"></div>
          </div>
        </div>
        
        <div class="control-group">
          <label>Path Spacing: <span id="spacing-value">${ANIMATION_CONFIG.pathSpacing}</span></label>
          <input type="range" id="path-spacing" min="0" max="0.5" step="0.05" value="${ANIMATION_CONFIG.pathSpacing}">
        </div>
        
        <div class="control-group">
          <label>Scroll Smoothness: <span id="easing-value">${ANIMATION_CONFIG.scrollEasing}</span></label>
          <input type="range" id="scroll-easing" min="0.01" max="0.2" step="0.01" value="${ANIMATION_CONFIG.scrollEasing}">
        </div>
        
        <div class="control-group">
          <label>Touch Sensitivity: <span id="touch-value">${ANIMATION_CONFIG.touchSensitivity}</span></label>
          <input type="range" id="touch-sensitivity" min="0.5" max="3" step="0.1" value="${ANIMATION_CONFIG.touchSensitivity}">
        </div>
        
        <div class="control-group">
          <label>Animation Scale: <span id="scale-value">${ANIMATION_CONFIG.animationScale}</span></label>
          <input type="range" id="animation-scale" min="0.3" max="1" step="0.1" value="${ANIMATION_CONFIG.animationScale}">
        </div>
        
        <div class="control-buttons">
          <button id="reset-controls">Reset to Default</button>
          <button id="hide-controls">Hide Panel</button>
        </div>
      </div>
    `;

    // Add control panel styles
    const style = document.createElement("style");
    style.textContent = `
      .scroll-control-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 0;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        min-width: 280px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        transition: transform 0.3s ease;
      }
      
      .scroll-control-panel.hidden {
        transform: translateX(calc(100% + 20px));
      }
      
      .control-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 12px 12px 0 0;
        margin: 0;
      }
      
      .control-panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      .toggle-panel {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .toggle-panel:hover {
        background: rgba(0, 0, 0, 0.1);
      }
      
      .control-panel-content {
        padding: 16px;
      }
      
      .control-group {
        margin-bottom: 16px;
      }
      
      .control-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #555;
      }
      
      .control-group input[type="range"] {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #e0e0e0;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }
      
      .control-group input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      
      .control-group input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      
      .control-buttons {
        display: flex;
        gap: 8px;
        margin-top: 20px;
      }
      
      .control-buttons button {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        color: #333;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .control-buttons button:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      
      @media (max-width: 767px) {
        .scroll-control-panel {
          right: 10px;
          top: 10px;
          min-width: 250px;
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(controlPanel);

    // Set up event listeners for controls
    this.setupControlEventListeners();
  }

  setupControlEventListeners() {
    // Drawing speed control
    const drawingSpeedSlider = document.getElementById("drawing-speed");
    const speedValue = document.getElementById("speed-value");
    drawingSpeedSlider.addEventListener("input", (e) => {
      ANIMATION_CONFIG.drawingSpeed = parseFloat(e.target.value);
      speedValue.textContent = ANIMATION_CONFIG.drawingSpeed;
      this.setupSVGPaths(); // Recalculate path timings
    });

    // Path spacing control
    const pathSpacingSlider = document.getElementById("path-spacing");
    const spacingValue = document.getElementById("spacing-value");
    pathSpacingSlider.addEventListener("input", (e) => {
      ANIMATION_CONFIG.pathSpacing = parseFloat(e.target.value);
      spacingValue.textContent = ANIMATION_CONFIG.pathSpacing;
      this.setupSVGPaths(); // Recalculate path timings
    });

    // Scroll easing control
    const easingSlider = document.getElementById("scroll-easing");
    const easingValue = document.getElementById("easing-value");
    easingSlider.addEventListener("input", (e) => {
      ANIMATION_CONFIG.scrollEasing = parseFloat(e.target.value);
      easingValue.textContent = ANIMATION_CONFIG.scrollEasing;
      this.options.easing = ANIMATION_CONFIG.scrollEasing;
    });

    // Touch sensitivity control
    const touchSlider = document.getElementById("touch-sensitivity");
    const touchValue = document.getElementById("touch-value");
    touchSlider.addEventListener("input", (e) => {
      ANIMATION_CONFIG.touchSensitivity = parseFloat(e.target.value);
      touchValue.textContent = ANIMATION_CONFIG.touchSensitivity;
      this.options.touchSensitivity = ANIMATION_CONFIG.touchSensitivity;
    });

    // Animation scale control
    const scaleSlider = document.getElementById("animation-scale");
    const scaleValue = document.getElementById("scale-value");
    scaleSlider.addEventListener("input", (e) => {
      ANIMATION_CONFIG.animationScale = parseFloat(e.target.value);
      scaleValue.textContent = ANIMATION_CONFIG.animationScale;
      this.setupSVGPaths(); // Recalculate path timings
    });

    // Reset button
    document.getElementById("reset-controls").addEventListener("click", () => {
      ANIMATION_CONFIG.drawingSpeed = 0.2;
      ANIMATION_CONFIG.pathSpacing = 0.0;
      ANIMATION_CONFIG.scrollEasing = 0.08;
      ANIMATION_CONFIG.touchSensitivity = 3;
      ANIMATION_CONFIG.animationScale = 0.9;

      // Update sliders
      drawingSpeedSlider.value = ANIMATION_CONFIG.drawingSpeed;
      pathSpacingSlider.value = ANIMATION_CONFIG.pathSpacing;
      easingSlider.value = ANIMATION_CONFIG.scrollEasing;
      touchSlider.value = ANIMATION_CONFIG.touchSensitivity;
      scaleSlider.value = ANIMATION_CONFIG.animationScale;

      // Update displays
      speedValue.textContent = ANIMATION_CONFIG.drawingSpeed;
      spacingValue.textContent = ANIMATION_CONFIG.pathSpacing;
      easingValue.textContent = ANIMATION_CONFIG.scrollEasing;
      touchValue.textContent = ANIMATION_CONFIG.touchSensitivity;
      scaleValue.textContent = ANIMATION_CONFIG.animationScale;

      // Apply changes
      this.options.easing = ANIMATION_CONFIG.scrollEasing;
      this.options.touchSensitivity = ANIMATION_CONFIG.touchSensitivity;
      this.setupSVGPaths();
    });

    // Hide/show panel
    const panel = document.querySelector(".scroll-control-panel");
    document.getElementById("hide-controls").addEventListener("click", () => {
      panel.classList.add("hidden");
    });

    document.querySelector(".toggle-panel").addEventListener("click", () => {
      panel.classList.toggle("hidden");
    });

    // Show panel on 'C' key press
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey) {
        panel.classList.toggle("hidden");
      }
    });
  }

  setupSVGPaths() {
    // Collect all SVG paths with their individual speeds
    this.pathsData = [];
    let globalPathIndex = 0;
    let currentProgress = 0;

    this.slides.forEach((slide, slideIndex) => {
      const svgs = slide.querySelectorAll("svg");

      svgs.forEach((svg, svgIndex) => {
        const paths = svg.querySelectorAll("path");

        // Get individual SVG speed - use mobile-specific if on mobile, fallback to desktop, then global config
        let svgSpeed = ANIMATION_CONFIG.drawingSpeed;
        if (this.isMobile) {
          // Mobile: check data-speed-mob first, then data-speed, then default
          svgSpeed =
            parseFloat(svg.getAttribute("data-speed-mob")) ||
            parseFloat(svg.getAttribute("data-speed")) ||
            ANIMATION_CONFIG.drawingSpeed;
        } else {
          // Desktop: use data-speed or default
          svgSpeed =
            parseFloat(svg.getAttribute("data-speed")) ||
            ANIMATION_CONFIG.drawingSpeed;
        }

        // Get delay offset - use mobile-specific if on mobile, fallback to desktop, then 0
        let svgDelay = 0;
        if (this.isMobile) {
          // Mobile: check data-delay-mob first, then data-delay, then default
          svgDelay =
            parseFloat(svg.getAttribute("data-delay-mob")) ||
            parseFloat(svg.getAttribute("data-delay")) ||
            0;
        } else {
          // Desktop: use data-delay or default
          svgDelay = parseFloat(svg.getAttribute("data-delay")) || 0;
        }

        paths.forEach((path, pathIndex) => {
          if (path.getTotalLength) {
            const totalLength = path.getTotalLength();

            // FORCE initial state - completely undrawn, override any CSS
            path.style.strokeDasharray = `${totalLength} ${totalLength}`;
            path.style.strokeDashoffset = `${totalLength}px`;
            path.style.transition = "none"; // Remove ALL CSS transitions
            path.style.animation = "none"; // Remove ALL CSS animations
            path.style.animationDelay = "unset";
            path.style.animationDuration = "unset";
            path.style.animationFillMode = "unset";

            this.pathsData.push({
              element: path,
              slideIndex,
              svgIndex,
              pathIndex,
              globalIndex: globalPathIndex,
              totalLength,
              speed: svgSpeed, // Each path gets speed from its parent SVG
              delay: svgDelay, // Delay offset in pixels from parent SVG
            });

            globalPathIndex++;
          }
        });
      });
    });

    // Calculate sequential drawing positions with individual speeds for each path
    this.pathsData.forEach((pathData, index) => {
      // Duration for this path based on its parent SVG's individual speed
      // Lower speed = more scroll space needed = longer duration
      const pathDuration =
        ANIMATION_CONFIG.animationScale * (1.0 / pathData.speed);

      // Convert delay from pixels to scroll progress ratio
      const delayProgress =
        this.maxScroll > 0 ? pathData.delay / this.maxScroll : 0;

      const startProgress = currentProgress + delayProgress;
      const endProgress = startProgress + pathDuration;

      // Ensure bounds
      pathData.startProgress = Math.min(startProgress, 0.95);
      pathData.endProgress = Math.min(endProgress, 1.0);

      // Move to next position (continuous drawing, but don't include delay in next position)
      currentProgress = currentProgress + pathDuration;

      console.log(
        `Path ${index + 1}: speed=${pathData.speed}, delay=${
          pathData.delay
        }px, duration=${pathDuration.toFixed(
          3
        )}, progress=${pathData.startProgress.toFixed(
          3
        )}→${pathData.endProgress.toFixed(3)}`
      );
    });

    console.log(
      "SVG paths setup for sequential drawing:",
      this.pathsData.length,
      "paths with individual speeds"
    );
  }

  updateSVGAnimations() {
    const scrollProgress =
      this.maxScroll > 0 ? this.currentX / this.maxScroll : 0;

    let currentlyDrawingPath = null;
    let overallProgress = 0;

    // Apply animations to all paths
    this.pathsData.forEach((pathData, index) => {
      const { element, totalLength, startProgress, endProgress } = pathData;

      // Calculate if this path should be drawing based on scroll position (SEQUENTIAL)
      let drawProgress = 0;

      if (scrollProgress >= startProgress && scrollProgress <= endProgress) {
        // Calculate progress within this path's segment
        const pathProgress =
          (scrollProgress - startProgress) / (endProgress - startProgress);
        drawProgress = Math.max(0, Math.min(1, pathProgress));
        currentlyDrawingPath = index + 1;
        const pathProgressInSequence =
          (index + pathProgress) / this.pathsData.length;
        overallProgress = pathProgressInSequence * 100;
      } else if (scrollProgress > endProgress) {
        // Past this path - fully drawn
        drawProgress = 1;
        overallProgress = Math.max(
          overallProgress,
          ((index + 1) / this.pathsData.length) * 100
        );
      }
      // else: before this path - remains at 0 (undrawn)

      // Apply the drawing progress to stroke-dashoffset
      const offset = totalLength * (1 - drawProgress);
      element.style.strokeDashoffset = `${offset}px`;

      // Ensure no CSS animations interfere
      element.style.animation = "none";
      element.style.transition = "none";
    });

    // Update control panel with current progress
    const currentSVGElement = document.getElementById("current-svg");
    const progressFill = document.getElementById("progress-fill");

    if (currentSVGElement && progressFill) {
      if (currentlyDrawingPath) {
        const pathData = this.pathsData[currentlyDrawingPath - 1];
        const delayText =
          pathData.delay > 0 ? `, delay: ${pathData.delay}px` : "";
        currentSVGElement.textContent = `Path ${currentlyDrawingPath} of ${this.pathsData.length} (speed: ${pathData.speed}${delayText})`;
      } else {
        const completedPaths = this.pathsData.filter(
          (path) => scrollProgress > path.endProgress
        ).length;
        currentSVGElement.textContent =
          completedPaths === 0
            ? `Ready to start...`
            : `Completed ${completedPaths} of ${this.pathsData.length}`;
      }
      progressFill.style.width = `${Math.min(overallProgress, 100)}%`;
    }
  }

  setupEventListeners() {
    // Resize event
    window.addEventListener("resize", this.onResize.bind(this));

    // Mouse wheel event
    this.wrapper.addEventListener("wheel", this.onWheel.bind(this), {
      passive: false,
    });

    // Touch events
    this.wrapper.addEventListener("touchstart", this.onTouchStart.bind(this), {
      passive: false,
    });
    this.wrapper.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false,
    });
    this.wrapper.addEventListener("touchend", this.onTouchEnd.bind(this), {
      passive: false,
    });

    // Keyboard events
    document.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  calculateDimensions() {
    this.isMobile = window.innerWidth <= 767;
    this.wrapperWidth = this.wrapper.offsetWidth;

    // Calculate slide widths and total width
    this.totalWidth = 0;
    this.slides.forEach((slide) => {
      // Special handling for hero slide on mobile
      if (this.isMobile && slide.id === "hero-slide") {
        // Keep full width on mobile for hero slide
        slide.style.width = "100vw";
        this.totalWidth += this.wrapperWidth;
      } else {
        // Use clientWidth to get the actual width of the slide
        const slideWidth = slide.offsetWidth;
        slide.style.width = `${slideWidth}px`;
        this.totalWidth += slideWidth;
      }
    });

    // Set scroller width
    this.scroller.style.width = `${this.totalWidth}px`;

    // Calculate maximum scroll position
    this.maxScroll = Math.max(0, this.totalWidth - this.wrapperWidth);
  }

  setupStyles() {
    // Set wrapper styles
    this.wrapper.style.overflow = "hidden";
    this.wrapper.style.position = "relative";
    this.wrapper.style.width = "100%";
    this.wrapper.style.height = "100vh";

    // Set scroller styles
    this.scroller.style.position = "absolute";
    this.scroller.style.top = "0";
    this.scroller.style.left = "0";
    this.scroller.style.height = "100%";
    this.scroller.style.display = "flex";
    this.scroller.style.flexWrap = "nowrap";

    // Set slide styles
    this.slides.forEach((slide) => {
      slide.style.height = "100%";
      slide.style.position = "relative";
      slide.style.flexShrink = "0";

      // Only set overflow to hidden if it's not already set to visible
      const computedOverflow = window.getComputedStyle(slide).overflow;
      const inlineOverflow = slide.style.overflow;

      if (inlineOverflow !== "visible" && computedOverflow !== "visible") {
        slide.style.overflow = "hidden";
      }
    });

    // Mobile specific styles
    if (this.isMobile) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "pan-x"; // Allow horizontal panning but preserve form interactions
      document.body.style.position = "fixed";
      document.body.style.top = "0";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.bottom = "0";
      document.body.style.overscrollBehavior = "none";
    }
  }

  animate() {
    // Smooth scrolling with easing
    this.currentX += (this.targetX - this.currentX) * this.options.easing;

    // Apply transform
    this.scroller.style.transform = `translateX(${-this.currentX}px)`;

    // Update SVG animations based on scroll position
    this.updateSVGAnimations();

    // Check if we should update active slide
    this.updateActiveSlide();

    // Handle scroll arrow visibility
    this.updateScrollArrowVisibility();

    // Continue animation loop
    requestAnimationFrame(this.animate.bind(this));
  }

  updateActiveSlide() {
    // Find the slide that is most visible in the viewport
    const viewportCenter = this.currentX + this.wrapperWidth / 2;
    let closestSlide = 0;
    let closestDistance = Infinity;

    let accumulatedWidth = 0;
    this.slides.forEach((slide, index) => {
      // Get slide width, accounting for hero slide on mobile
      let slideWidth;
      if (this.isMobile && slide.id === "hero-slide") {
        slideWidth = this.wrapperWidth;
      } else {
        slideWidth = slide.offsetWidth;
      }

      const slideCenter = accumulatedWidth + slideWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlide = index;
      }

      accumulatedWidth += slideWidth;
    });

    // Update active class if changed
    if (closestSlide !== this.currentSlide) {
      this.slides.forEach((slide) =>
        slide.classList.remove(this.options.activeClass)
      );
      this.slides[closestSlide].classList.add(this.options.activeClass);

      // Show content for new slide
      this.showSlideContent(closestSlide);

      this.currentSlide = closestSlide;

      // Trigger custom event
      const event = new CustomEvent("slideChange", {
        detail: { index: closestSlide },
      });
      this.wrapper.dispatchEvent(event);
    }
  }

  showSlideContent(slideIndex) {
    const slide = this.slides[slideIndex];
    if (!slide) return;

    // Show all blocks in this slide
    const blocks = slide.querySelectorAll(".block");
    blocks.forEach((block) => {
      block.classList.add("active");
    });
  }

  updateScrollArrowVisibility() {
    const scrollArrow = document.querySelector(".scroll-arrow-container");
    if (scrollArrow) {
      // Hide arrow after user starts scrolling horizontally (100px threshold)
      if (this.currentX > 100) {
        scrollArrow.style.opacity = "0";
      } else {
        scrollArrow.style.opacity = "1";
      }
    }
  }

  scrollTo(position) {
    this.targetX = Math.max(0, Math.min(position, this.maxScroll));
  }

  scrollToSlide(index) {
    if (index < 0 || index >= this.slides.length) return;

    let targetPosition = 0;
    for (let i = 0; i < index; i++) {
      // Account for hero slide on mobile
      if (this.isMobile && this.slides[i].id === "hero-slide") {
        targetPosition += this.wrapperWidth;
      } else {
        targetPosition += this.slides[i].offsetWidth;
      }
    }

    this.scrollTo(targetPosition);
  }

  nextSlide() {
    this.scrollToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.scrollToSlide(this.currentSlide - 1);
  }

  onResize() {
    // Recalculate dimensions on resize
    this.calculateDimensions();

    // Recalculate SVG path data
    this.setupSVGPaths();

    // Update target position to keep current slide in view
    let targetPosition = 0;
    for (let i = 0; i < this.currentSlide; i++) {
      // Account for hero slide on mobile
      if (this.isMobile && this.slides[i].id === "hero-slide") {
        targetPosition += this.wrapperWidth;
      } else {
        targetPosition += this.slides[i].offsetWidth;
      }
    }

    this.scrollTo(targetPosition);
  }

  onWheel(e) {
    e.preventDefault();

    // Determine scroll direction and amount
    const delta = e.deltaY || e.deltaX;
    this.scrollTo(this.targetX + delta);
  }

  onTouchStart(e) {
    // Don't prevent default for form elements or elements inside RSVP form
    const target = e.target;
    const isFormElement = target.matches(
      "input, select, button, textarea, [contenteditable]"
    );
    const isInRSVPForm = target.closest(".rsvp-form");

    if (!isFormElement && !isInRSVPForm) {
      e.preventDefault();
      this.isDragging = true;
    } else {
      this.isDragging = false; // Don't start dragging on form elements
    }

    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.lastTouchX = this.touchStartX;
  }

  onTouchMove(e) {
    if (!this.isDragging) return;

    // Don't prevent default for form elements or if any input is focused
    const target = e.target;
    const isFormElement = target.matches(
      "input, select, button, textarea, [contenteditable]"
    );
    const isInRSVPForm = target.closest(".rsvp-form");
    const hasActiveInput =
      document.activeElement &&
      document.activeElement.matches(
        "input, select, button, textarea, [contenteditable]"
      );

    if (!isFormElement && !isInRSVPForm && !hasActiveInput) {
      e.preventDefault();

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;

      // Calculate distance moved
      const deltaX = this.lastTouchX - touchX;
      this.lastTouchX = touchX;

      // Enhanced mobile touch sensitivity for horizontal scrolling only
      let touchMultiplier = this.isMobile ? 0.8 : 1.0;

      // Update target position based on horizontal touch movement only
      this.scrollTo(
        this.targetX + deltaX * this.options.touchSensitivity * touchMultiplier
      );
    }
  }

  onTouchEnd(e) {
    // Don't prevent default for form elements or elements inside RSVP form
    const target = e.target;
    const isFormElement = target.matches(
      "input, select, button, textarea, [contenteditable]"
    );
    const isInRSVPForm = target.closest(".rsvp-form");

    if (!isFormElement && !isInRSVPForm) {
      e.preventDefault();
    }

    this.isDragging = false;

    // Snap to closest slide if enabled
    if (this.options.snapToSlides) {
      this.scrollToSlide(this.currentSlide);
    }
  }

  onKeyDown(e) {
    // Arrow key navigation
    switch (e.key) {
      case "ArrowRight":
        this.scrollTo(this.targetX + 100);
        break;
      case "ArrowLeft":
        this.scrollTo(this.targetX - 100);
        break;
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // First, STOP all existing SVG animations and reset paths
  const allPaths = document.querySelectorAll("path");
  allPaths.forEach((path) => {
    if (path.getTotalLength) {
      const totalLength = path.getTotalLength();
      // Force complete reset
      path.style.strokeDasharray = `${totalLength} ${totalLength}`;
      path.style.strokeDashoffset = `${totalLength}px`;
      path.style.animation = "none";
      path.style.transition = "none";
      path.style.animationDelay = "unset";
      path.style.animationDuration = "unset";
      path.style.animationFillMode = "unset";
    }
  });

  // Hide splash screen after a delay
  setTimeout(() => {
    const splash = document.getElementById("splash");
    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.style.display = "none";
      }, 500);
    }
  }, 500);

  // Initialize horizontal scroller
  window.horizontalScroller = new HorizontalScroller();

  // Add scroll note animation
  const scrollNote = document.querySelector(".scroll-note");
  if (scrollNote) {
    scrollNote.style.animation = "blink-and-fade 3s infinite";
  }

  // Add click handler for scroll arrow
  const scrollArrow = document.querySelector(".scroll-arrow");
  if (scrollArrow) {
    scrollArrow.addEventListener("click", () => {
      window.horizontalScroller.nextSlide();
    });
  }

  // Initialize countdown if present
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Initialize RSVP form if present
  initializeRSVPForm();
});

// Countdown function
function updateCountdown() {
  const countdownElements = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
  };

  if (!countdownElements.days) return;

  // Set the wedding date - June 28, 2025
  const weddingDate = new Date("June 28, 2025 13:00:00").getTime();
  const now = new Date().getTime();
  const distance = weddingDate - now;

  // Calculate time values
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Update countdown elements
  countdownElements.days.textContent = days.toString().padStart(2, "0");
  countdownElements.hours.textContent = hours.toString().padStart(2, "0");
  countdownElements.minutes.textContent = minutes.toString().padStart(2, "0");
  countdownElements.seconds.textContent = seconds.toString().padStart(2, "0");
}

// RSVP Form functionality
function initializeRSVPForm() {
  const rsvpForm = document.getElementById("rsvp-form");
  const formStatus = document.getElementById("form-status");
  const attendingBtn = document.getElementById("attending-yes");
  const notAttendingBtn = document.getElementById("attending-no");

  if (!rsvpForm) return;

  // Google Apps Script URL
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbyTjezA5tccPxq4Q4BnYeXrZq04n-wi-UrTt7P6k5Ww3qbVcQs917fGOzSRSQgGdx2v/exec";

  function submitForm(attendance) {
    // Validate form
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;

    if (!name || !phone) {
      formStatus.textContent = "Խնդրում ենք լրացնել բոլոր դաշտերը։";
      formStatus.className = "error";
      return;
    }

    // Show loading state
    formStatus.textContent = "Ուղարկվում է...";
    formStatus.className = "";

    // Prepare data for sending with only the required fields
    const data = {
      timestamp: new Date().toISOString(),
      name: name,
      phone: phone,
      attendance: attendance,
    };

    // Create an iframe for the response
    const iframeName = "hidden-iframe";
    let iframe = document.getElementById(iframeName);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = iframeName;
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    // Create form with proper encoding for JSON
    const form = document.createElement("form");
    form.method = "POST";
    form.action = scriptURL;
    form.target = iframeName;

    // Add a field for the JSON data
    const jsonField = document.createElement("input");
    jsonField.type = "hidden";
    jsonField.name = "payload";
    jsonField.value = JSON.stringify(data);
    form.appendChild(jsonField);

    // Submit the form
    document.body.appendChild(form);
    form.submit();

    // Remove the form after submission
    setTimeout(() => {
      document.body.removeChild(form);

      // Show different messages based on attendance
      if (attendance === "Այո") {
        // If coming - show Armenian message about dancing
        formStatus.textContent =
          "Շնորհակալություն! Էդ օրը լիքը կպարենք միասին! 💃🕺";
        formStatus.className = "success";
      } else {
        // If not coming - show red toast message
        showRedToast(
          "Ափսոս :( Պարելու ենք առանց ձեզ! 💃🕺❤️"
        );
        formStatus.textContent = "Ձեր պատասխանն ընդունված է։";
        formStatus.className = "success";
      }

      rsvpForm.reset();
    }, 2000);

    // Add event listener to handle errors
    iframe.onerror = function () {
      formStatus.textContent = "Տեղի ունեցավ սխալ: Խնդրում ենք փորձել կրկին։";
      formStatus.className = "error";
    };
  }

  if (attendingBtn && notAttendingBtn) {
    attendingBtn.addEventListener("click", function (e) {
      attendingBtn.classList.add("selected");
      notAttendingBtn.classList.remove("selected");
      submitForm("Այո");
    });

    notAttendingBtn.addEventListener("click", function (e) {
      notAttendingBtn.classList.add("selected");
      attendingBtn.classList.remove("selected");
      submitForm("Ոչ");
    });
  }
}

// Red toast notification function
function showRedToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = "red-toast";
  toast.textContent = message;

  // Add toast styles
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ff4757, #ff3742);
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
    box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 90vw;
    font-family: "Open Sans", "Arial Armenian", sans-serif;
  `;

  // Add to page
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, -50%) scale(1.05)";
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, -50%) scale(0.95)";
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

// Helper function to check if device is mobile
function isMobile() {
  return window.innerWidth <= 767;
}
