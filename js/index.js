// ─── DEBOUNCE FUNCTION ───
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ─── CURSOR ───
(function(){
  const cur = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  if(!cur) return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove', debounce(e => { mx=e.clientX; my=e.clientY; }, 10));
  function loop(){
    rx += (mx-rx)*.15; ry += (my-ry)*.15;
    cur.style.left = mx+'px'; cur.style.top = my+'px';
    ring.style.left = rx+'px'; ring.style.top = ry+'px';
    requestAnimationFrame(loop);
  }
  loop();
})();


// ─── CASES NAVIGATION ───
function scrollCases(direction) {
  const container = document.querySelector('.cases-scroll');
  const firstCard = container.querySelector('.case-card');
  const cardWidth = firstCard ? firstCard.offsetWidth : 400;
  const gap = 16;
  const scrollAmount = cardWidth + gap;

  if (direction === 'prev') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  updateCasesButtons();
}

function updateCasesButtons() {
  const container = document.querySelector('.cases-scroll');
  const prevBtn = document.getElementById('casesPrev');
  const nextBtn = document.getElementById('casesNext');
  
  if (container.scrollLeft <= 0) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.cursor = 'not-allowed';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
  }
  
  if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.cursor = 'not-allowed';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
  }
}

// Initialize cases navigation
document.addEventListener('DOMContentLoaded', function() {
  const casesScroll = document.querySelector('.cases-scroll');
  if (casesScroll) {
    casesScroll.addEventListener('scroll', updateCasesButtons);
    updateCasesButtons();
  }
});

// ─── ACCORDION ───
function toggleAcc(header) {
  const item = header.parentNode;
  const body = item.querySelector('.acc-body');
  const isOpen = item.classList.contains('active');
  
  // Toggle current accordion (others stay open)
  if(!isOpen) {
    item.classList.add('active');
    body.style.maxHeight = body.scrollHeight + 'px';
    body.style.transition = 'max-height 0.3s ease-in-out';
  } else {
    item.classList.remove('active');
    body.style.maxHeight = '0';
    body.style.transition = 'max-height 0.3s ease-in-out';
  }
}

// ─── REVEAL ON SCROLL ───
(function(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  els.forEach(el => io.observe(el));
})();

// ─── FEATURED CASES GALLERY ───
(function(){
  const caseCards = document.querySelectorAll('.featured-case-card');
  
  caseCards.forEach(card => {
    const mainPhoto = card.querySelector('.featured-photo-img');
    const thumbs = card.querySelectorAll('.featured-thumb');
    
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', function() {
        const index = this.getAttribute('data-index');
        const newSrc = this.getAttribute('src');
        
        // Update main photo
        mainPhoto.style.opacity = '0';
        setTimeout(() => {
          mainPhoto.setAttribute('src', newSrc);
          mainPhoto.setAttribute('data-index', index);
          mainPhoto.style.opacity = '1';
        }, 200);
        
        // Update active thumb
        thumbs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  });
})();

// ─── FEATURED CASES VIDEO ───
(function(){
  const videos = document.querySelectorAll('.featured-video');
  
  videos.forEach(video => {
    // Pause other videos when one starts playing
    video.addEventListener('play', function() {
      videos.forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
        }
      });
    });
  });
})();

// ─── FEATURED CASES NAVIGATION ───
function scrollFeaturedCases(direction) {
  const container = document.querySelector('.featured-cases');
  const firstCard = container.querySelector('.featured-case-card');
  const cardWidth = firstCard ? firstCard.offsetWidth : 600;
  const gap = 30;
  const scrollAmount = cardWidth + gap;

  if (direction === 'prev') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  updateFeaturedButtons();
  updateFeaturedDots();
}

function updateFeaturedButtons() {
  const container = document.querySelector('.featured-cases');
  const prevBtn = document.getElementById('featuredPrev');
  const nextBtn = document.getElementById('featuredNext');
  
  if (container.scrollLeft <= 0) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.cursor = 'not-allowed';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.cursor = 'pointer';
  }
  
  if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.cursor = 'not-allowed';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.cursor = 'pointer';
  }
}

function updateFeaturedDots() {
  const container = document.querySelector('.featured-cases');
  const dots = document.querySelectorAll('.featured-dot');
  const firstCard = container.querySelector('.featured-case-card');
  const cardWidth = firstCard ? firstCard.offsetWidth : 600;
  const gap = 30;
  const currentIndex = Math.round(container.scrollLeft / (cardWidth + gap));
  
  dots.forEach((dot, index) => {
    if (index === currentIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// Initialize featured cases navigation
document.addEventListener('DOMContentLoaded', function() {
  const featuredScroll = document.querySelector('.featured-cases');
  if (featuredScroll) {
    featuredScroll.addEventListener('scroll', function() {
      updateFeaturedButtons();
      updateFeaturedDots();
    });
    updateFeaturedButtons();
    updateFeaturedDots();
    
    // Dot click handlers
    const dots = document.querySelectorAll('.featured-dot');
    dots.forEach((dot, index) => {
      dot.addEventListener('click', function() {
        const container = document.querySelector('.featured-cases');
        const firstCard = container.querySelector('.featured-case-card');
        const cardWidth = firstCard ? firstCard.offsetWidth : 600;
        const gap = 30;
        container.scrollTo({ left: (cardWidth + gap) * index, behavior: 'smooth' });
      });
    });
  }
});

// Proof carousel slider
function slideProof(btn, direction) {
  const carousel = btn.closest('.case-proof-carousel');
  const slides = carousel.querySelectorAll('.case-proof-slide');
  let currentIndex = 0;
  
  slides.forEach((slide, index) => {
    if (slide.classList.contains('active')) {
      currentIndex = index;
    }
  });
  
  slides[currentIndex].classList.remove('active');
  
  if (direction === 1) {
    currentIndex = (currentIndex + 1) % slides.length;
  } else {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
  }
  
  slides[currentIndex].classList.add('active');
}

// Video gallery thumb switcher
function switchVideoThumb(thumb) {
  const gallery = thumb.closest('.case-video-gallery');
  const videoMain = gallery.querySelector('.case-video-main');
  const video = videoMain.querySelector('video');
  const thumbs = gallery.querySelectorAll('.case-video-thumb');
  
  thumbs.forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  
  // If thumb is clicked, show it as poster
  video.poster = thumb.src;
  video.pause();
}

// Media gallery switcher (video/images)
function switchMedia(thumb) {
  const gallery = thumb.closest('.case-media-gallery');
  const mediaMain = gallery.querySelector('.case-media-main');
  const video = mediaMain.querySelector('.case-video');
  const img = mediaMain.querySelector('.case-media-img');
  const thumbs = gallery.querySelectorAll('.case-media-thumb');
  
  thumbs.forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  
  const type = thumb.getAttribute('data-type');
  
  if (type === 'video') {
    video.classList.remove('hidden');
    img.classList.remove('active');
    video.play();
  } else {
    video.classList.add('hidden');
    video.pause();
    img.classList.add('active');
    img.src = thumb.getAttribute('data-src');
  }
}

// Lightbox functions
let lightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(imgSrc, context = 'case') {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (context === 'featured') {
    // Get all images from featured case gallery
    const featuredThumbs = document.querySelectorAll('.featured-thumb');
    lightboxImages = Array.from(featuredThumbs).map(thumb => thumb.getAttribute('src'));
  } else {
    // Get all images from the media gallery
    const mediaThumbs = document.querySelectorAll('.case-media-thumb[data-type="image"]');
    lightboxImages = Array.from(mediaThumbs).map(thumb => thumb.getAttribute('data-src'));
  }

  // Find current index
  currentLightboxIndex = lightboxImages.indexOf(imgSrc);
  if (currentLightboxIndex === -1) currentLightboxIndex = 0;

  lightboxImg.src = imgSrc;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  currentLightboxIndex += direction;

  if (currentLightboxIndex < 0) {
    currentLightboxIndex = lightboxImages.length - 1;
  } else if (currentLightboxIndex >= lightboxImages.length) {
    currentLightboxIndex = 0;
  }

  const lightboxImg = document.getElementById('lightboxImg');
  lightboxImg.src = lightboxImages[currentLightboxIndex];
}

// Initialize lightbox
document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.getElementById('lightbox');

  // Close on background click
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Add click handler to main image (case media)
  const mediaImg = document.querySelector('.case-media-img');
  if (mediaImg) {
    mediaImg.addEventListener('click', function(e) {
      e.stopPropagation();
      openLightbox(this.src, 'case');
    });
  }

  // Add click handler to featured case photos
  const featuredPhotos = document.querySelectorAll('.featured-photo-img');
  featuredPhotos.forEach(photo => {
    photo.addEventListener('click', function(e) {
      e.stopPropagation();
      openLightbox(this.src, 'featured');
    });
  });
});
