document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================================
     FULLSCREEN ENVELOPE LOGIC
  ========================================================================= */
  const waxSealBtn = document.getElementById('waxSealBtn');
  const sealContainer = document.getElementById('sealContainer');
  const flapTop = document.getElementById('flapTop');
  const envFront = document.getElementById('envFront');
  const envBack = document.querySelector('.env-back');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const mainContent = document.getElementById('main-content');
  const petalCanvas = document.getElementById('petalCanvas');

  if (waxSealBtn && flapTop) {
    waxSealBtn.addEventListener('click', () => {
      // 1. Hide the seal container
      sealContainer.classList.add('hide');
      
      // 2. Open the top flap
      flapTop.classList.add('open');
      
      // 3. Wait for flap to open, then trigger flash
      setTimeout(() => {
        const flashOverlay = document.getElementById('flashOverlay');
        if (flashOverlay) {
          // Trigger the bright flash
          flashOverlay.style.opacity = '1';
          
          // Exactly when the screen is white, swap everything out instantly
          setTimeout(() => {
            // Hide envelope instantly behind the flash
            envFront.style.transition = 'none';
            envBack.style.transition = 'none';
            envFront.style.opacity = '0';
            envBack.style.opacity = '0';
            envFront.style.display = 'none';
            envBack.style.display = 'none';
            
            // Reveal the card content instantly behind the flash
            const inviteCardContainer = document.getElementById('inviteCard');
            if (inviteCardContainer) inviteCardContainer.style.opacity = '1';

            // Make main content visible instantly
            mainContent.style.opacity = '1';
            mainContent.style.pointerEvents = 'auto';
            document.body.classList.remove('locked');
            envelopeWrapper.style.position = 'absolute';
            
            // Guarantee we are perfectly at the top of the page
            window.scrollTo(0, 0);
            
            // Start petals and reveals
            if (petalCanvas) petalCanvas.classList.add('active');
            initReveals();
            
            // Fade out the flash slowly to reveal the beautifully transitioned content
            flashOverlay.style.transition = 'opacity 1.5s ease-out';
            flashOverlay.style.opacity = '0';
            
          }, 300); // Wait 300ms for flash to reach full brightness
        }
      }, 900); // Wait 900ms for flap to finish opening

    });
  } else {
    // Fallback
    document.body.classList.remove('locked');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'auto';
    }
    if (petalCanvas) petalCanvas.classList.add('active');
    initReveals();
  }

  /* =========================================================================
     MOBILE NAVIGATION
  ========================================================================= */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const navbar = document.getElementById('navbar');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 0.5) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  /* =========================================================================
     TIMELINE SLIDER CONTROLS
  ========================================================================= */
  const slider = document.getElementById('timelineSlider');
  const btnPrev = document.getElementById('sliderPrev');
  const btnNext = document.getElementById('sliderNext');

  if (slider && btnPrev && btnNext) {
    const scrollAmount = 350; 
    
    btnNext.addEventListener('click', () => {
      slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
    
    btnPrev.addEventListener('click', () => {
      slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  /* =========================================================================
     SCROLL REVEALS
  ========================================================================= */
  function initReveals() {
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-card');
    
    const revealOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * 100); 
          observer.unobserve(entry.target);
        }
      });
    }, revealOptions);

    revealElements.forEach(el => revealObserver.observe(el));
  }

  /* =========================================================================
     COUNTDOWN TIMER
  ========================================================================= */
  const weddingDate = new Date('November 21, 2026 18:00:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance < 0) {
      const wrap = document.querySelector('.countdown-wrap');
      if(wrap) wrap.innerHTML = "<h3>Just Married!</h3>";
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    const elDays = document.getElementById('days');
    const elHours = document.getElementById('hours');
    const elMinutes = document.getElementById('minutes');
    const elSeconds = document.getElementById('seconds');

    if(elDays) elDays.innerText = d.toString().padStart(2, '0');
    if(elHours) elHours.innerText = h.toString().padStart(2, '0');
    if(elMinutes) elMinutes.innerText = m.toString().padStart(2, '0');
    if(elSeconds) elSeconds.innerText = s.toString().padStart(2, '0');

    setRingDash('ring-days', d, 365);
    setRingDash('ring-hours', h, 24);
    setRingDash('ring-minutes', m, 60);
    setRingDash('ring-seconds', s, 60);
  }

  function setRingDash(id, value, max) {
    const ring = document.getElementById(id);
    if (!ring) return;
    const circumference = 326.7; 
    const offset = circumference - (value / max) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  if (document.getElementById('days')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* =========================================================================
     ROSE PETAL CANVAS ANIMATION
  ========================================================================= */
  const canvas = document.getElementById('petalCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const petals = [];
    const numPetals = window.innerWidth < 768 ? 20 : 40;
    const colors = ['#8b0000', '#5c0000', '#a52a2a', '#7e1010'];

    class Petal {
      constructor() {
        this.reset();
        this.y = Math.random() * height; 
      }
      reset() {
        this.x = Math.random() * width;
        this.y = -Math.random() * 100 - 20; 
        this.size = Math.random() * 8 + 6;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = (Math.random() - 0.5) * 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.6 + 0.3;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;
        this.wobbleAmp = Math.random() * 2;
      }
      update() {
        this.y += this.speedY;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * this.wobbleAmp + this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > height + 20) {
          this.reset();
        }
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.bezierCurveTo(this.size, -this.size/2, this.size, this.size/2, 0, this.size);
        ctx.bezierCurveTo(-this.size, this.size/2, -this.size, -this.size/2, 0, -this.size);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < numPetals; i++) {
      petals.push(new Petal());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      petals.forEach(petal => {
        petal.update();
        petal.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }
});
