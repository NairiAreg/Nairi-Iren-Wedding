// Initialize for mobile devices immediately
if (window.innerWidth <= 767) {
  // Add a class to html element
  document.documentElement.classList.add("mobile");

  // Don't lock scrolling initially - the mobile-init.js will handle proper layout
  // Only set initial view position
  window.scrollTo(0, 0);
}

class Item {
  constructor(el) {
    this.el = el;
    this.path = this.el.querySelector(".draw path");
    this.block = this.el.querySelector(".block");
    if (this.path) {
      this.update();
      this.observer = new IntersectionObserver((entries) =>
        entries.forEach(
          (entry) => (this.isVisible = entry.intersectionRatio > 0)
        )
      );
      this.observer.observe(this.el);
      this.initEvents();
    }
    this.init();
  }

  init() {
    console.log(this);
  }

  offsetPath() {
    this.pathLength = this.path.getTotalLength();
    this.path.style.strokeDasharray = this.pathLength + " " + this.pathLength;
  }

  growPathOnScroll(path, index) {
    let rect = path.getBoundingClientRect();
    let offset = 0;
    if (index === 1) {
      offset = 10;
    }

    let percent = (triggerPoint - rect.left + offset) / rect.width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    this.offsetPath();
  }

  showOnScroll() {
    let rect = this.block.getBoundingClientRect();
    if (rect.left < triggerPoint) {
      if (!this.block.classList.contains("show"))
        this.block.classList.add("show");
    } else {
      if (this.block.classList.contains("show"))
        this.block.classList.remove("show");
    }
  }

  update() {
    this.getSize();
    for (const key in this.renderedStyles) {
      this.renderedStyles[key].current = this.renderedStyles[key].previous =
        this.renderedStyles[key].setValue();
    }
    this.layout();
  }

  getSize() {
    let rect = this.path.getBoundingClientRect();
    let percent = (triggerPoint - rect.left) / rect.width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    this.offsetPath();
    // const rect = this.el.getBoundingClientRect();
    // this.props = {
    //     height: rect.height,
    //     top: docScroll + rect.top
    // }
    // }
  }

  initEvents() {
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.update();
  }

  render() {
    for (const key in this.renderedStyles) {
      this.renderedStyles[key].current = this.renderedStyles[key].setValue();
      this.renderedStyles[key].previous = MathUtils.lerp(
        this.renderedStyles[key].previous,
        this.renderedStyles[key].current,
        this.renderedStyles[key].ease
      );
    }
    this.layout();
  }

  layout() {
    this.path.style.strokeDasharray = this.pathLength + " " + this.pathLength;
    // = `translate3d(0,${this.renderedStyles.innerTranslationY.previous}px,0)`;
  }
}

class ShowOnScroll {
  constructor(el) {
    this.el = el;
    this.scroller = this.el.querySelector(".scroller");
    this.slides = [];
    [...this.el.querySelectorAll(".slide")].forEach((item) =>
      this.slides.push(new Item(item))
    );
    this.init();
  }
  init() {
    console.log(this);
  }
}

let qs = (q, c) => (c || document).querySelector(q);
let qsa = (q, c) => [...(c || document).querySelectorAll(q)];
let each = (array, fn, args) => array.forEach((item) => fn(item, args));
let triggerPoint = 0;
let setTriggerPoint = () =>
  (triggerPoint = window.innerWidth - window.innerWidth / 3);
let resetPath = (path) =>
  (path.style.strokeDasharray = "0 " + path.getTotalLength());
let resetPaths = (paths) => paths.forEach(resetPath);

let offsetPath = (path, percent) => {
  let pathLength = path.getTotalLength();
  path.style.strokeDasharray = pathLength * percent + " " + pathLength;
};

let growPathOnScroll = (path, index) => {
  let rect = path.getBoundingClientRect();
  let offset = 0;
  if (index === 1) {
    offset = -10;
  }

  let percent = (triggerPoint - rect.left + offset) / rect.width;
  if (percent < 0) percent = 0;
  if (percent > 1) percent = 1;
  offsetPath(path, percent);
};

let showOnScroll = (block) => {
  let rect = block.getBoundingClientRect();
  if (rect.left < triggerPoint) {
    if (!block.classList.contains("show")) block.classList.add("show");
  } else {
    if (block.classList.contains("show")) block.classList.remove("show");
  }
};

// Improved mobile detection
const isMobile = () => window.innerWidth <= 767;

// Mobile fixes - run immediately
function fixMobileLayout() {
  if (isMobile()) {
    // Ensure we're at the top on mobile
    window.scrollTo(0, 0);

    // Apply mobile specific styles
    document.body.classList.add("mobile-view");

    // Fix positioning of key elements
    document.querySelectorAll(".slide").forEach((slide) => {
      slide.style.height = "100vh";
      slide.style.width = "100vw";
      slide.style.position = "relative";
      slide.style.overflow = "hidden";
    });

    // Fix wrapper and scroller positioning
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.style.position = "fixed";
      wrapper.style.top = "0";
      wrapper.style.left = "0";
      wrapper.style.width = "100%";
      wrapper.style.height = "100vh";
      wrapper.style.overflow = "hidden";
    }

    const scroller = document.querySelector(".scroller");
    if (scroller) {
      scroller.style.position = "relative";
      scroller.style.top = "0";
      scroller.style.left = "0";
    }

    // Make content visible
    document.querySelectorAll(".block").forEach((block) => {
      block.classList.add("show");
    });

    // Fix content positioning
    const heroBlock = document.getElementById("hero");
    if (heroBlock) {
      heroBlock.style.position = "static";
      heroBlock.style.top = "0";
      heroBlock.style.left = "0";
      heroBlock.style.transform = "none";
    }

    // Force body constraints
    document.body.style.height = "100vh";
    document.body.style.maxHeight = "100vh";
    document.body.style.overflowY = "hidden";

    // Remove any position values that might be interfering
    document.querySelectorAll(".content").forEach((content) => {
      content.style.position = "relative";
      content.style.zIndex = "10";
    });
  }
}

// Improved resize function with better mobile responsiveness
let resize = (e) => {
  let width = 0;
  slides.forEach((slide) => (width = width + slide.clientWidth));

  // Adjust body width based on device size
  let additionalWidth = isMobile() ? 800 : 1200;
  document.body.style.width = width + additionalWidth + "px";

  // Adjust the card container layout if on mobile
  if (isMobile()) {
    // Mobile-specific adjustments
    const cardContainer = document.querySelector(".container");
    if (cardContainer) {
      // Adjust container styling for better mobile layout
      cardContainer.style.flexWrap = "wrap";
      cardContainer.style.justifyContent = "center";
    }

    // Adjust the game card container for better image display
    const gameCardContainer = document.querySelector(".l-container");
    if (gameCardContainer) {
      cardContainer.style.gridGap = "10px";
    }

    // Fix mobile positioning
    fixMobileLayout();
  }

  // Recalculate trigger point
  setTriggerPoint();
};

/* setup */
let html = document.documentElement;
let wrapper = document.querySelector(".wrapper");
let scroller = document.querySelector(".scroller");
let slides = [...document.querySelectorAll(".slide")];
let paths = [...document.querySelectorAll(".draw path")];
let blocks = [...document.querySelectorAll(".block")];
let scr = new ShowOnScroll(wrapper);

html.classList.add("js");
blocks.forEach((block) => showOnScroll(block));
resetPaths(paths);
window.addEventListener("resize", resize);
resize();

window.addEventListener("scroll", (e) => {
  scroller.style.transform = `translateX(-${window.scrollX}px)`;
  if (window.scrollX != 0) {
    if (!html.classList.contains("scrolled")) html.classList.add("scrolled");
  } else {
    if (html.classList.contains("scrolled")) html.classList.remove("scrolled");
  }
  // console.log(window.scrollX)
});

window.addEventListener("load", (e) => {
  html.classList.add("loaded");

  // Fix mobile positioning
  fixMobileLayout();

  // Force scroll to beginning on mobile devices
  if (isMobile()) {
    window.scrollTo(0, 0);

    // Apply another fixed position after a small delay
    setTimeout(() => {
      window.scrollTo(0, 0);
      fixMobileLayout();
    }, 500);
  }
});

let lastX = 0;
let draw = () => {
  let x = scroller.getBoundingClientRect().left;
  if (x != lastX) {
    if (-x <= window.innerWidth - window.innerWidth / 3) triggerPoint = -x;
    paths.forEach((path, index) => growPathOnScroll(path, index));
    blocks.forEach((block) => showOnScroll(block));
  }
  lastX = x;
  requestAnimationFrame(draw);
};
draw();

window.addEventListener("wheel", (e) => {
  if (e.deltaY != 0 && !e.shiftKey) window.scroll(window.scrollX + e.deltaY, 0);
});

/* vertical touch gesture to horizontal scroll */
let direction = null;
let scrollXOnDown = 0;
let xDown = null;
let yDown = null;

let handleTouchStart = (e) => {
  scrollXOnDown = window.scrollX;
  xDown = e.touches[0].clientX;
  yDown = e.touches[0].clientY;
};

let handleTouchEnd = (e) => {
  xDown = null;
  yDown = null;
};

// Modified touch handling for better mobile experience
let handleTouchMove = (e) => {
  if (!xDown || !yDown) return;

  // Prevent default only for horizontal movement to allow some vertical scrolling if needed
  if (isMobile()) {
    e.preventDefault();
  }

  let xUp = e.touches[0].clientX;
  let yUp = e.touches[0].clientY;
  let xDiff = xDown - xUp;
  let yDiff = yDown - yUp;

  // Enhanced sensitivity for mobile
  let scrollFactor = isMobile() ? 1.5 : 3;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) direction = "left";
    else direction = "right";
    window.scrollBy({ left: (xDiff * scrollFactor) / 5, behavior: "auto" });
  } else if (isMobile()) {
    // Only use vertical swipes for horizontal scrolling on mobile
    if (yDiff > 0) direction = "up";
    else direction = "down";
    window.scrollBy({ left: (yDiff * scrollFactor) / 5, behavior: "auto" });
  }
};

wrapper.addEventListener("touchstart", handleTouchStart, false);
wrapper.addEventListener("touchmove", handleTouchMove, { passive: false }); // Changed to non-passive for better control
wrapper.addEventListener("touchend", handleTouchEnd, false);

setTimeout(function () {
  document.getElementById("splash").style.opacity = "0";
}, 1000);
setTimeout(function () {
  document.getElementById("splash").style.display = "none";
}, 3000);

//   $(".option").click(function(){
//     $(".option").removeClass("active");
//     $(this).addClass("active");

//  });

// js-media-resize

document.addEventListener("scroll", () => {
  if (window.screen.width <= 800) {
    document.getElementById("fixed_zibil").style.display = "flex";
    document.getElementById("fixed_zibil").style.width =
      window.innerWidth + "px";
  }
});
if (window.screen.width <= 800) {
  document.getElementById("fixed_zibil").style.display = "flex";
  document.getElementById("fixed_zibil").style.width = window.innerWidth + "px";
}

// document.querySelector("body *").style.display = 'none';

// Mobile detection - update to be responsive rather than showing a message
document.addEventListener("scroll", () => {
  // Remove the desktop-only message
  document.getElementById("fixed_zibil").style.display = "none";
});

// Remove the desktop-only message entirely
if (document.getElementById("fixed_zibil")) {
  document.getElementById("fixed_zibil").style.display = "none";
}

// Resize handler for better mobile support
window.addEventListener("resize", () => {
  // Recalculate trigger point for better mobile drawing
  triggerPoint = window.innerWidth - window.innerWidth / 3;
});

// Initial trigger point calculation
setTriggerPoint();

// Countdown Timer
function updateCountdown() {
  const weddingDate = new Date("June 28, 2025 00:00:00").getTime();
  const now = new Date().getTime();
  const distance = weddingDate - now;

  // Time calculations
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display the result
  document.getElementById("days").innerText = String(days).padStart(2, "0");
  document.getElementById("hours").innerText = String(hours).padStart(2, "0");
  document.getElementById("minutes").innerText = String(minutes).padStart(
    2,
    "0"
  );
  document.getElementById("seconds").innerText = String(seconds).padStart(
    2,
    "0"
  );
}

// Update countdown every second
setInterval(updateCountdown, 1000);
updateCountdown();

// RSVP Form Submission to Google Sheets
document.addEventListener("DOMContentLoaded", function () {
  const rsvpForm = document.getElementById("rsvp-form");
  const formStatus = document.getElementById("form-status");
  const attendingBtn = document.getElementById("attending-yes");
  const notAttendingBtn = document.getElementById("attending-no");

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
      formStatus.textContent = "Շնորհակալություն! Ձեր RSVP-ն ընդունված է։";
      formStatus.className = "success";
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
      submitForm("Այո");
    });

    notAttendingBtn.addEventListener("click", function (e) {
      submitForm("Ոչ");
    });
  }
});

// Run fixMobileLayout immediately if on mobile
if (isMobile()) {
  fixMobileLayout();
}
