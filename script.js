/* =========================================================================
   1. LOADING SCREEN
========================================================================= */
(function () {
  const ls = document.getElementById('loadingScreen');
  if (!ls) return;
  // Hide as soon as everything is ready
  function hideLoader() {
    setTimeout(() => ls.classList.add('hidden'), 600);
  }
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
    // Safety net — never block for more than 4 s
    setTimeout(hideLoader, 4000);
  }
})();

/* =========================================================================
   2. CONFETTI BURST
========================================================================= */
const confettiBurst = (function () {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return { fire: () => {} };
  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf = null;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#bf953f','#ffe299','#8b0000','#c0392b','#ffffff','#ffd700','#fcf6ba'];
  const SHAPES = ['rect','circle','ribbon'];

  function Particle(cx, cy) {
    this.x   = cx;
    this.y   = cy;
    this.vx  = (Math.random() - 0.5) * 18;
    this.vy  = (Math.random() - 1.2) * 16;
    this.w   = Math.random() * 10 + 5;
    this.h   = Math.random() * 5  + 3;
    this.rot = Math.random() * 360;
    this.rsp = (Math.random() - 0.5) * 9;
    this.col = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shp = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.opa = 1;
    this.grav= 0.45;
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.opa > 0.02);
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.grav;
      p.vx *= 0.98;
      p.rot+= p.rsp;
      p.opa-= 0.013;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opa);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.col;
      if (p.shp === 'rect') {
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      } else if (p.shp === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.w/2, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(0, 0, p.w/2, p.h/4, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });
    if (particles.length) raf = requestAnimationFrame(animate);
    else raf = null;
  }

  return {
    fire(x, y, count = 200) {
      const cx = x ?? canvas.width  / 2;
      const cy = y ?? canvas.height / 2;
      for (let i = 0; i < count; i++) particles.push(new Particle(cx, cy));
      if (!raf) animate();
    }
  };
})();

/* =========================================================================
   3. BACKGROUND MUSIC PLAYER
========================================================================= */
(function () {
  const btn   = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  if (!btn || !audio) return;

  const playIcon  = btn.querySelector('.music-play-icon');
  const pauseIcon = btn.querySelector('.music-pause-icon');
  
  // Set initial volume to 0 for smooth fade-in
  audio.volume = 0;
  
  // Global fade function (attached to window so wax seal can trigger it)
  window.fadeAudio = function(audioElement, targetVolume, duration) {
    return new Promise(resolve => {
      const step = 0.05;
      const intervalDelay = duration / Math.abs((targetVolume - audioElement.volume) / step);
      
      clearInterval(audioElement.fadeInterval);
      audioElement.fadeInterval = setInterval(() => {
        let newVolume = audioElement.volume;
        if (newVolume < targetVolume) {
          newVolume = Math.min(targetVolume, newVolume + step);
        } else {
          newVolume = Math.max(targetVolume, newVolume - step);
        }
        audioElement.volume = newVolume;

        if (newVolume === targetVolume) {
          clearInterval(audioElement.fadeInterval);
          resolve();
        }
      }, intervalDelay);
    });
  };

  window.toggleMusicState = function(forcePlay = false) {
    if (audio.paused || forcePlay) {
      audio.play().then(() => {
        playIcon.style.display  = 'none';
        pauseIcon.style.display = 'block';
        btn.classList.add('playing');
        window.fadeAudio(audio, 1, 1000); // 1-second fade in
      }).catch(e => console.log('Audio play failed:', e));
    } else {
      window.fadeAudio(audio, 0, 800).then(() => {
        audio.pause();
        playIcon.style.display  = 'block';
        pauseIcon.style.display = 'none';
        btn.classList.remove('playing');
      });
    }
  };

  btn.addEventListener('click', () => window.toggleMusicState());

  // Custom Loop Logic: Fade out at the end, then fade back in
  let isLoopFading = false;
  const FADE_OUT_SECS = 3; // Start fading out 3 seconds before the song ends
  const FADE_IN_SECS = 2;  // Fade back in over 2 seconds

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || audio.paused) return;
    
    // If we're near the end of the song and not already fading
    if (audio.duration - audio.currentTime <= FADE_OUT_SECS && !isLoopFading) {
      isLoopFading = true;
      
      // Fade out
      window.fadeAudio(audio, 0, FADE_OUT_SECS * 1000).then(() => {
        // Once faded out, if the user hasn't paused, seek to 0 and fade back in
        if (!audio.paused) {
          audio.currentTime = 0;
          window.fadeAudio(audio, 1, FADE_IN_SECS * 1000).then(() => {
            isLoopFading = false;
          });
        } else {
          isLoopFading = false;
        }
      });
    }
  });

})();

/* =========================================================================
   4. PARALLAX ENGINE (Hardware Accelerated)
========================================================================= */
(function () {
  // Only shift decorative INNER elements — never whole sections
  // This prevents layout overlap with adjacent sections
  const layers = [
    ['.hero-bg-img',        0.30],   // hero bg drifts slowest
    ['.hero-overlay',       0.18],   // overlay drifts slightly faster
    ['.floral-corner.top-left',  0.10],
    ['.floral-corner.bottom-right', -0.08],  // opposite direction for depth
    ['#quote-section .quote-icon', 0.08],
  ];

  const resolved = layers.map(([sel, speed]) => ({
    els: Array.from(document.querySelectorAll(sel)),
    speed,
  })).filter(l => l.els.length);

  // Apply will-change for compositor layer promotion
  resolved.forEach(({ els }) => els.forEach(el => el.style.willChange = 'transform'));

  let rafId = null;
  let lastScrollY = window.scrollY;

  function updateParallax() {
    resolved.forEach(({ els, speed }) => {
      els.forEach(el => {
        el.style.transform = `translate3d(0, ${lastScrollY * speed}px, 0)`;
      });
    });
    rafId = null;
  }

  function onScroll() {
    lastScrollY = window.scrollY;
    if (!rafId) {
      rafId = requestAnimationFrame(updateParallax);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallax(); // Initial positioning
})();

/* =========================================================================
   FULL PAGE PETAL ANIMATION
========================================================================= */
(function startPetals() {
  const canvas = document.getElementById('petalCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#8b0000', '#5c0000', '#a52a2a', '#b84040', '#c0392b'];
  const numPetals = window.innerWidth < 768 ? 25 : 50;

  class HeroPetal {
    constructor(scattered) {
      this.reset();
      if (scattered) this.y = Math.random() * canvas.height;
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -Math.random() * 80 - 10;
      this.size = Math.random() * 7 + 4;
      this.speedY = Math.random() * 0.8 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.6;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.04;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.55 + 0.2;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.025 + 0.008;
      this.wobbleAmp = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.y += this.speedY;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * this.wobbleAmp + this.speedX;
      this.rotation += this.rotSpeed;
      if (this.y > canvas.height + 20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size, -this.size / 2, this.size, this.size / 2, 0, this.size);
      ctx.bezierCurveTo(-this.size, this.size / 2, -this.size, -this.size / 2, 0, -this.size);
      ctx.fill();
      ctx.restore();
    }
  }

  const petals = Array.from({ length: numPetals }, (_, i) => new HeroPetal(i < numPetals * 0.6));

  function animatePetals() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animatePetals);
  }
  animatePetals();
})();

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
      // Auto-start music with a gentle fade when the envelope is opened
      if (window.toggleMusicState && document.getElementById('bgMusic').paused) {
        window.toggleMusicState(true);
      }

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
            
            // Start reveals (hero petal canvas handles petals — no full-page canvas needed)
            initReveals();
            
            // Fade out the flash slowly to reveal the beautifully transitioned content
            flashOverlay.style.transition = 'opacity 1.5s ease-out';
            flashOverlay.style.opacity = '0';

            // 🎉 Confetti burst as the flash fades to reveal the invitation
            setTimeout(() => confettiBurst.fire(window.innerWidth / 2, window.innerHeight / 3, 220), 400);
            
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
     VERTICAL TIMELINE SCROLL LOGIC
  ========================================================================= */
  const verticalTimeline = document.getElementById('verticalTimeline');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineItems = document.querySelectorAll('.timeline-item');

  function updateTimeline() {
    if (!verticalTimeline || !timelineProgress) return;
    
    const rect = verticalTimeline.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Start drawing line when top of timeline reaches middle of screen
    const startPoint = windowHeight * 0.6;
    const scrollPx = startPoint - rect.top;
    
    // Convert to percentage of total timeline height
    let progressPercent = (scrollPx / rect.height) * 100;
    
    // Clamp between 0 and 100
    progressPercent = Math.max(0, Math.min(100, progressPercent));
    
    timelineProgress.style.height = `${progressPercent}%`;

    // Activate items as the line reaches them
    timelineItems.forEach(item => {
      const itemRect = item.getBoundingClientRect();
      const dotTop = itemRect.top + 40; // Approx dot position relative to viewport
      
      // If the dot is above the bottom 40% of the screen, activate it
      if (dotTop < windowHeight * 0.6) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateTimeline);
  // Initial check
  setTimeout(updateTimeline, 100);

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

});
