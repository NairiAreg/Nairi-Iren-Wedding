class Item {
  constructor(el) {
      this.el = el;
      this.path =  this.el.querySelector('.draw path')
      this.block =  this.el.querySelector('.block')
      if(this.path){
          this.update();
          this.observer = new IntersectionObserver((entries) => entries.forEach(entry => this.isVisible = entry.intersectionRatio > 0));
          this.observer.observe(this.el);
          this.initEvents();
      }
      this.init()
  }
      
  init(){
    console.log(this);
  }

  offsetPath(){
    this.pathLength = this.path.getTotalLength()
    this.path.style.strokeDasharray = this.pathLength+ " " + this.pathLength
  }

  growPathOnScroll(){
  let rect = this.path.getBoundingClientRect()
  let percent = (triggerPoint - rect.left) / rect.width
  if(percent < 0) percent = 0
  if(percent > 1) percent = 1
  this.offsetPath()
  }

  showOnScroll(){
  let rect = this.block.getBoundingClientRect()
  if(rect.left < triggerPoint) {
    if(!this.block.classList.contains('show')) this.block.classList.add('show')
  } else {
    if(this.block.classList.contains('show'))this. block.classList.remove('show')
  }
  }

  update() {
      this.getSize();
      for (const key in this.renderedStyles) {
          this.renderedStyles[key].current = this.renderedStyles[key].previous = this.renderedStyles[key].setValue();
      }
      this.layout();
  }

  getSize() {

        let rect = this.path.getBoundingClientRect()
        let percent = (triggerPoint - rect.left) / rect.width
        if(percent < 0) percent = 0
        if(percent > 1) percent = 1
        this.offsetPath()
      // const rect = this.el.getBoundingClientRect();
      // this.props = {
      //     height: rect.height,
      //     top: docScroll + rect.top
      // }
      // }
  }

  initEvents() {
      window.addEventListener('resize', () => this.resize());
  }

  resize() {
      this.update();
  }

  render() {
      for (const key in this.renderedStyles) {
          this.renderedStyles[key].current = this.renderedStyles[key].setValue();
          this.renderedStyles[key].previous = MathUtils.lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].ease);
      }
      this.layout();
  }

  layout() {
      this.path.style.strokeDasharray = this.pathLength+ " " + this.pathLength
        // = `translate3d(0,${this.renderedStyles.innerTranslationY.previous}px,0)`;
  }
}


class ShowOnScroll {
  constructor(el) {
    this.el = el
    this.scroller = this.el.querySelector('.scroller')
    this.slides = [];
    [...this.el.querySelectorAll('.slide')].forEach(item => this.slides.push(new Item(item)))
    this.init()
  }
  init(){
    console.log(this);
  }
}


let qs = (q, c) => (c||document).querySelector(q)
let qsa = (q, c) => [...(c||document).querySelectorAll(q)]
let each = (array, fn, args) => array.forEach(item => fn(item, args))
let triggerPoint = 0
let setTriggerPoint = () => triggerPoint = window.innerWidth - (window.innerWidth / 3)
let resetPath = (path) => path.style.strokeDasharray = "0 " + path.getTotalLength()
let resetPaths = (paths) => paths.forEach(resetPath)

let offsetPath = (path, percent) => {
  let pathLength = path.getTotalLength()
  path.style.strokeDasharray = (pathLength * percent) + " " + pathLength
}

let growPathOnScroll = (path) => {
  let rect = path.getBoundingClientRect()
  let percent = (triggerPoint - rect.left) / rect.width
  if(percent < 0) percent = 0
  if(percent > 1) percent = 1
  offsetPath(path, percent)
}

let showOnScroll = (block) => {
  let rect = block.getBoundingClientRect()
  if(rect.left < triggerPoint) {
    if(!block.classList.contains('show')) block.classList.add('show')
  } else {
    if(block.classList.contains('show')) block.classList.remove('show')
  }
}

let resize = e => {
  let width = 0;
  slides.forEach(slide => width = width + slide.clientWidth);
  slides.forEach(slide => console.log(slide.clientWidth));
  document.body.style.width = width+1200+'px';
  console.log(width);
}

/* setup */
let html = document.documentElement
let wrapper = document.querySelector('.wrapper')
let scroller = document.querySelector('.scroller')
let slides = [...document.querySelectorAll('.slide')]
let paths =  [...document.querySelectorAll('.draw path')]
let blocks =  [...document.querySelectorAll('.block')]
let scr = new ShowOnScroll(wrapper);

html.classList.add('js')
blocks.forEach(block => showOnScroll(block))
resetPaths(paths)
window.addEventListener('resize', resize)
resize()

window.addEventListener('scroll', e => {
  scroller.style.transform = `translateX(-${window.scrollX}px)`;
  if(window.scrollX != 0) {if(!html.classList.contains('scrolled')) html.classList.add('scrolled')}
  else {if(html.classList.contains('scrolled')) html.classList.remove('scrolled')}
  // console.log(window.scrollX)
})

window.addEventListener('load', e => html.classList.add('loaded'))
let lastX = 0
let draw = () => {
  let x = scroller.getBoundingClientRect().left
  if(x != lastX) {
    if(-x <= window.innerWidth - (window.innerWidth / 3)) triggerPoint = -x;
    paths.forEach(path => growPathOnScroll(path))
    blocks.forEach(block => showOnScroll(block))
  }
  lastX = x
  requestAnimationFrame(draw)
}
draw()

window.addEventListener('wheel', e => {
  if(e.deltaY != 0 && !e.shiftKey) window.scroll(window.scrollX + e.deltaY, 0)
})

/* vertical touch gesture to horizontal scroll */
let direction = null
let scrollXOnDown = 0
let xDown = null
let yDown = null

let handleTouchStart = (e) => {
  scrollXOnDown = window.scrollX
  xDown = e.touches[0].clientX
  yDown = e.touches[0].clientY
}

let handleTouchEnd = (e) => {
  xDown = null
  yDown = null
}

let handleTouchMove = (e) => {
  e.preventDefault()
  if ( ! xDown || ! yDown ) return
  let xUp = e.touches[0].clientX
  let yUp = e.touches[0].clientY
  var xDiff = xDown - xUp
  var yDiff = yDown - yUp
  if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
    if ( xDiff > 0 ) direction = 'left'
    else direction = 'right'
    window.scroll(scrollXOnDown + (xDiff*3), 0)
  } else {
    if ( yDiff > 0 ) direction = 'up';
    else direction = 'down';
    window.scroll(scrollXOnDown + (yDiff*3), 0)
  }
}

wrapper.addEventListener('touchstart', handleTouchStart, false)
wrapper.addEventListener('touchmove', handleTouchMove, false)
wrapper.addEventListener('touchend', handleTouchEnd, false)  



//   $(".option").click(function(){
//     $(".option").removeClass("active");
//     $(this).addClass("active");
  
//  });


// js-media-resize

document.addEventListener('scroll',()=> {
console.log(window.screen.width);
if (window.screen.width <= 800) {
  document.getElementById('fixed_zibil').style.display = 'flex';
  document.getElementById('fixed_zibil').style.width = window.innerWidth+'px';
}
})
if (window.screen.width <= 800) {
document.getElementById('fixed_zibil').style.display = 'flex';
document.getElementById('fixed_zibil').style.width = window.innerWidth+'px';
}

// document.querySelector("body *").style.display = 'none';