(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     0a. TRANSLATION & LANGUAGE TOGGLE SYSTEM
  ------------------------------------------------------------------------ */
  let translations = {};
  let currentLang = localStorage.getItem('lang') || 'en';
  let currentRing = null; // Track open viewer data to refresh it smoothly

  window.t = function (key, placeholders = {}) {
    const keys = key.split('.');
    let result = translations[currentLang];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key;
      }
    }
    if (typeof result === 'string') {
      for (const [k, v] of Object.entries(placeholders)) {
        result = result.replace(new RegExp(`{${k}}`, 'g'), v);
      }
    }
    return result;
  };

  function updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.innerHTML = window.t(key);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', window.t(key));
    });

    document.getElementById('page-title').textContent = window.t('site.title');
    document.getElementById('meta-desc').setAttribute('content', window.t('site.description'));
    document
      .getElementById('main-nav')
      .setAttribute('aria-label', window.t('navigation.sectionNav'));

    if (viewerOpen && currentRing) {
      document.getElementById('viewer-eyebrow').textContent = window.t('viewer.circle', {
        roman: currentRing.roman,
      });
      document.getElementById('viewer-title').textContent = window.t(currentRing.titleKey);
      document.getElementById('viewer-desc').textContent = window.t(currentRing.descriptionKey);
    }
  }

  window.setLanguage = function (lang, save = true, transition = true) {
    if (!translations[lang]) lang = 'en';
    if (currentLang === lang && transition) return;

    currentLang = lang;
    if (save) localStorage.setItem('lang', lang);

    const executeSwitch = () => {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
      updateDOM();
      if (transition) document.body.classList.remove('is-switching-lang');
    };

    if (transition) {
      document.body.classList.add('is-switching-lang');
      setTimeout(executeSwitch, 250);
    } else {
      executeSwitch();
    }
  };

  async function initTranslations() {
    try {
      const res = await fetch('assets/i18n/translations.json');
      translations = await res.json();
      setLanguage(currentLang, false, false);

      const langToggle = document.getElementById('lang-toggle');
      if (langToggle) {
        langToggle.addEventListener('click', () => {
          const newLang = currentLang === 'en' ? 'fa' : 'en';
          setLanguage(newLang, true, true);
        });
      }
    } catch (e) {
      console.error('Failed to load translations', e);
    }
  }

  /* ------------------------------------------------------------------------
     0b. AMBIENT AUDIO SYSTEM
  ------------------------------------------------------------------------ */
  let bgAudio = null;
  // Default to true if not previously set by the user
  let musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  let musicInitialized = false;

  const VOL_DEFAULT = 0.35;
  const VOL_DUCK = 0.15;

  window.initMusic = function () {
    if (musicInitialized) return;
    musicInitialized = true;

    // Create the Audio object lazily
    bgAudio = new Audio('assets/audio/infernno.mp3');
    bgAudio.loop = true;
    bgAudio.volume = VOL_DEFAULT;
  };

  window.playMusic = function () {
    if (!bgAudio) window.initMusic();
    if (!musicEnabled || !bgAudio) return;

    const playPromise = bgAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Double check state in case it was toggled rapidly during load
          if (!musicEnabled) bgAudio.pause();
          updateSoundUI();
        })
        .catch((err) => {
          console.warn('Audio autoplay blocked by browser:', err);
          musicEnabled = false; // Fail silently, update UI to reflect blocked state
          updateSoundUI();
        });
    }
  };

  window.pauseMusic = function () {
    if (bgAudio) bgAudio.pause();
    updateSoundUI();
  };

  window.toggleMusic = function () {
    if (!musicInitialized) window.initMusic();

    musicEnabled = !musicEnabled;
    localStorage.setItem('musicEnabled', musicEnabled);

    if (musicEnabled) {
      window.playMusic();
    } else {
      window.pauseMusic();
    }
  };

  window.setMusicVolume = function (targetVol, duration = 1.5) {
    if (!bgAudio) return;
    // Uses existing GSAP engine for smooth, artifact-free volume fades
    gsap.to(bgAudio, { volume: targetVol, duration: duration, ease: 'power2.inOut' });
  };

  function updateSoundUI() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      btn.textContent = musicEnabled ? 'SOUND ON' : 'SOUND OFF';
    }
  }

  // Setup sound UI default state & listeners immediately
  updateSoundUI();
  document.getElementById('sound-toggle')?.addEventListener('click', window.toggleMusic);

  /* ------------------------------------------------------------------------
     1. RING DATA
  ------------------------------------------------------------------------ */
  const RINGS = [
    {
      roman: 'I',
      titleKey: 'rings.I.title',
      top: 0.0,
      bottom: 0.111,
      media: 'assets/circles/ring-01.webm',
      descriptionKey: 'rings.I.description',
    },
    {
      roman: 'II',
      titleKey: 'rings.II.title',
      top: 0.111,
      bottom: 0.234,
      media: 'assets/circles/ring-02.webm',
      descriptionKey: 'rings.II.description',
    },
    {
      roman: 'III',
      titleKey: 'rings.III.title',
      top: 0.234,
      bottom: 0.335,
      media: 'assets/circles/ring-03.webm',
      descriptionKey: 'rings.III.description',
    },
    {
      roman: 'IV',
      titleKey: 'rings.IV.title',
      top: 0.335,
      bottom: 0.452,
      media: 'assets/circles/ring-04.webm',
      descriptionKey: 'rings.IV.description',
    },
    {
      roman: 'V',
      titleKey: 'rings.V.title',
      top: 0.452,
      bottom: 0.532,
      media: 'assets/circles/ring-05.webm',
      descriptionKey: 'rings.V.description',
    },
    {
      roman: 'VI',
      titleKey: 'rings.VI.title',
      top: 0.532,
      bottom: 0.617,
      media: 'assets/circles/ring-06.webm',
      descriptionKey: 'rings.VI.description',
    },
    {
      roman: 'VII',
      titleKey: 'rings.VII.title',
      top: 0.617,
      bottom: 0.71,
      media: 'assets/circles/ring-07.webm',
      descriptionKey: 'rings.VII.description',
    },
    {
      roman: 'VIII',
      titleKey: 'rings.VIII.title',
      top: 0.71,
      bottom: 0.766,
      media: 'assets/circles/ring-08.webm',
      descriptionKey: 'rings.VIII.description',
    },
    {
      roman: 'IX',
      titleKey: 'rings.IX.title',
      top: 0.766,
      bottom: 0.97,
      media: 'assets/circles/ring-09.webm',
      descriptionKey: 'rings.IX.description',
    },
  ];

  /* ------------------------------------------------------------------------
     2. MAP INTERACTION
  ------------------------------------------------------------------------ */
  const mapAreas = document.querySelectorAll('.map-area');
  mapAreas.forEach((area) => {
    area.setAttribute('tabindex', '0');
    area.setAttribute('role', 'button');
    const index = parseInt(area.getAttribute('data-index'), 10);
    const activate = () => {
      if (RINGS[index]) {
        openViewer(RINGS[index]);
      }
    };
    area.addEventListener('click', activate);
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  /* ------------------------------------------------------------------------
     3a. FULLSCREEN VIEWER (With Horizontal Panning Support)
  ------------------------------------------------------------------------ */
  const viewer = document.getElementById('viewer');
  const viewerMedia = document.getElementById('viewer-media');
  const viewerEyebrow = document.getElementById('viewer-eyebrow');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerDesc = document.getElementById('viewer-desc');
  const viewerClose = document.getElementById('viewer-close');
  let viewerOpen = false;

  // Horizontal Panning State
  let viewerMediaElement = null; // Reference to the dynamically created img/video
  let maxTranslateX = 0; // The calculated maximum boundary the user can drag horizontally
  let currentTranslateX = 0; // Current position of the media
  let dragStartX = 0; // Anchor coordinate when the user initiates a drag
  let isDraggingViewer = false;

  function isVideo(path) {
    return /\.(mp4|webm|ogg)$/i.test(path);
  }

  // Resets all positioning explicitly to 0 (Center) - Executed on both Viewer Open and Close
  function resetViewerPosition() {
    currentTranslateX = 0;
    maxTranslateX = 0;
    isDraggingViewer = false;
    viewerMedia.classList.remove('is-pannable', 'is-dragging');
    setViewerPosition(0);
  }

  // Applies the calculated X offset to the media element without saving state permanently
  function setViewerPosition(x) {
    if (viewerMediaElement) {
      viewerMediaElement.style.transform = `translateX(${x}px)`;
    }
  }

  // Programmatically recreates 'object-fit: cover' logic to enable panning on overflowing axes
  function updateViewerBounds() {
    if (!viewerMediaElement || !viewerOpen) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const intrinsicW = viewerMediaElement.videoWidth || viewerMediaElement.naturalWidth;
    const intrinsicH = viewerMediaElement.videoHeight || viewerMediaElement.naturalHeight;

    if (!intrinsicW || !intrinsicH) return; // Prevent logic before metadata/image has loaded

    const viewportRatio = vw / vh;
    const mediaRatio = intrinsicW / intrinsicH;

    let renderW, renderH;

    if (mediaRatio > viewportRatio) {
      // Media is wider relative to the viewport (e.g. standard landscape monitor / mobile portrait). Height is pinned to 100vh, width overflows.
      renderH = vh;
      renderW = vh * mediaRatio;
    } else {
      // Media is taller relative to viewport. Width pinned to 100vw, height overflows (Panning logic focuses horizontally per requirements).
      renderW = vw;
      renderH = vw / mediaRatio;
    }

    // Apply exact pixel values directly so they can be securely bounded
    viewerMediaElement.style.width = `${renderW}px`;
    viewerMediaElement.style.height = `${renderH}px`;
    viewerMediaElement.style.maxWidth = 'none';

    // Calculate how far horizontally they are allowed to pan from center
    maxTranslateX = Math.max(0, (renderW - vw) / 2);

    if (maxTranslateX > 0) {
      viewerMedia.classList.add('is-pannable');
    } else {
      viewerMedia.classList.remove('is-pannable');
      currentTranslateX = 0;
    }

    // Clamp current position gracefully in case bounds changed (e.g., resizing screen)
    currentTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, currentTranslateX));
    setViewerPosition(currentTranslateX);
  }

  // Utility to handle both Mouse and Touch inputs dynamically
  function getClientX(e) {
    return e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
  }

  function startViewerDrag(e) {
    if (maxTranslateX <= 0) return; // Ignore requests if not overflowing
    if (e.target.closest('.viewer__close') || e.target.closest('.viewer__panel')) return; // Allow normal clicks on close/text

    isDraggingViewer = true;
    dragStartX = getClientX(e) - currentTranslateX;
    viewerMedia.classList.add('is-dragging');
  }

  function moveViewerDrag(e) {
    if (!isDraggingViewer) return;

    // Crucial: prevents native swipe-back behaviors, accidental text selections, and vertical page scroll
    e.preventDefault();

    const x = getClientX(e) - dragStartX;
    // Strict clamp bounding prevents rubber-band interaction
    currentTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, x));
    setViewerPosition(currentTranslateX);
  }

  function endViewerDrag() {
    if (!isDraggingViewer) return;
    isDraggingViewer = false;
    viewerMedia.classList.remove('is-dragging');
  }

  // Attach Interaction Listeners for Desktop and Mobile (Mouse & Touch)
  viewerMedia.addEventListener('mousedown', startViewerDrag);
  viewerMedia.addEventListener('mousemove', moveViewerDrag);
  window.addEventListener('mouseup', endViewerDrag); // Placed on window to catch straggling events

  viewerMedia.addEventListener('touchstart', startViewerDrag, { passive: false });
  viewerMedia.addEventListener('touchmove', moveViewerDrag, { passive: false });
  window.addEventListener('touchend', endViewerDrag);
  window.addEventListener('touchcancel', endViewerDrag);

  // Enable Trackpad Support
  viewerMedia.addEventListener(
    'wheel',
    (e) => {
      if (maxTranslateX <= 0 || !viewerOpen) return;

      if (Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        // Scrolling right (positive delta) shifts media left
        const newX = currentTranslateX - e.deltaX;
        currentTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newX));
        setViewerPosition(currentTranslateX);
      }
    },
    { passive: false },
  );

  // Recalculate accurately upon rotation/sizing events
  window.addEventListener('resize', () => {
    if (viewerOpen) {
      updateViewerBounds();
    }
  });

  function openViewer(ring) {
    currentRing = ring;

    viewerEyebrow.textContent = window.t('viewer.circle', { roman: ring.roman });
    viewerTitle.textContent = window.t(ring.titleKey);
    viewerDesc.textContent = window.t(ring.descriptionKey);

    viewerMedia.innerHTML = '';
    resetViewerPosition(); // Force reset offset explicitly[cite: 1]

    if (ring.media) {
      if (isVideo(ring.media)) {
        const video = document.createElement('video');
        video.src = ring.media;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.onerror = () => showPlaceholder(ring.media);
        video.addEventListener('loadedmetadata', updateViewerBounds);
        viewerMedia.appendChild(video);
        viewerMediaElement = video; // Track logic
      } else {
        const img = document.createElement('img');
        img.src = ring.media;
        img.alt = window.t(ring.titleKey);
        img.onerror = () => showPlaceholder(ring.media);
        img.addEventListener('load', updateViewerBounds);
        viewerMedia.appendChild(img);
        viewerMediaElement = img; // Track logic
      }
    } else {
      showPlaceholder(null);
    }

    document.querySelector('.lang-toggle').classList.remove('is-visible');
    document.querySelector('.sound-toggle').classList.remove('is-visible');

    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    viewerOpen = true;
  }

  function showPlaceholder(path) {
    const notFound = window.t('viewer.mediaNotFound');
    const instruction = window.t('viewer.mediaInstruction');
    viewerMedia.innerHTML = `<p class="placeholder">${notFound}${path ? `<br>${path}` : ''}<br><br>${instruction}</p>`;
  }

  function closeViewer() {
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    viewerOpen = false;
    currentRing = null;

    // Clear elements smoothly and safely trigger hard position reset
    setTimeout(() => {
      viewerMedia.innerHTML = '';
      viewerMediaElement = null;
      resetViewerPosition();
    }, 450);

    document.querySelector('.lang-toggle').classList.add('is-visible');
    document.querySelector('.sound-toggle').classList.add('is-visible');
  }

  viewerClose.addEventListener('click', closeViewer);
  viewer.querySelector('.viewer__scrim').addEventListener('click', closeViewer);

  /* ------------------------------------------------------------------------
     3b. PAGE CONTROL
  ------------------------------------------------------------------------ */
  const track = document.getElementById('scroll-track');
  const panels = document.querySelectorAll('.panel');
  const railDots = document.querySelectorAll('.rail__dot');
  const totalPanels = panels.length;

  let currentIndex = 0;
  let isAnimating = false;
  let cloudsOpened = false;
  const ANIMATION_MS = 720;
  const WHEEL_THRESHOLD = 12;

  function goTo(nextIndex) {
    nextIndex = Math.max(0, Math.min(totalPanels - 1, nextIndex));
    if (nextIndex === currentIndex || isAnimating) return;
    currentIndex = nextIndex;
    track.style.transform = `translateY(-${currentIndex * 100}vh)`;
    railDots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));
    isAnimating = true;
    setTimeout(() => {
      isAnimating = false;
    }, ANIMATION_MS);
  }

  function openCloudsAndGo() {
    isAnimating = true;

    // First user interaction: initialize and play music if enabled
    window.initMusic();
    if (musicEnabled) {
      window.playMusic();
    }

    document.querySelector('.rail').classList.add('is-visible');
    document.querySelector('.lang-toggle').classList.add('is-visible');
    document.querySelector('.sound-toggle').classList.add('is-visible');
    gsap.to('.hero-clouds--left', { xPercent: -100, ease: 'power2.in', duration: 1.2 });
    gsap.to('.hero-clouds--right', { xPercent: 100, ease: 'power2.in', duration: 1.2 });
    gsap.to('.hero-title-wrap', { opacity: 0, yPercent: -20, ease: 'power1.in', duration: 1 });
    gsap.to('.hero-sky', {
      opacity: 0,
      ease: 'power1.in',
      duration: 1.2,
      onComplete: () => {
        cloudsOpened = true;
        isAnimating = false;
        goTo(1);
      },
    });
  }

  function closeClouds() {
    document.querySelector('.rail').classList.remove('is-visible');
    document.querySelector('.lang-toggle').classList.remove('is-visible');
    document.querySelector('.sound-toggle').classList.remove('is-visible');
    gsap.to('.hero-clouds--left', { xPercent: 0, ease: 'power2.out', duration: 1.2 });
    gsap.to('.hero-clouds--right', { xPercent: 0, ease: 'power2.out', duration: 1.2 });
    gsap.to('.hero-title-wrap', { opacity: 1, yPercent: 0, ease: 'power1.out', duration: 1.2 });
    gsap.to('.hero-sky', {
      opacity: 1,
      ease: 'power1.out',
      duration: 1.2,
      onComplete: () => {
        cloudsOpened = false;
      },
    });
  }

  window.next = function () {
    if (currentIndex === 0 && !cloudsOpened) openCloudsAndGo();
    else goTo(currentIndex + 1);
  };

  window.prev = function () {
    if (currentIndex === 1 && cloudsOpened) {
      goTo(0);
      setTimeout(closeClouds, ANIMATION_MS);
    } else {
      goTo(currentIndex - 1);
    }
  };

  window.addEventListener(
    'wheel',
    (e) => {
      if (viewerOpen) return;
      e.preventDefault();
      if (isAnimating) return;
      if (e.deltaY > WHEEL_THRESHOLD) window.next();
      else if (e.deltaY < -WHEEL_THRESHOLD) window.prev();
    },
    { passive: false },
  );

  let touchStartY = null;
  window.addEventListener(
    'touchstart',
    (e) => {
      if (viewerOpen) return;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true },
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (viewerOpen || touchStartY === null) return;
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 50) {
        delta > 0 ? window.next() : window.prev();
      }
      touchStartY = null;
    },
    { passive: true },
  );

  window.addEventListener('keydown', (e) => {
    if (viewerOpen) {
      if (e.key === 'Escape') closeViewer();
      return;
    }
    if (['ArrowDown', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      window.next();
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      window.prev();
    }
  });

  railDots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index, 10)));
  });

  /* ------------------------------------------------------------------------
     3c. AMBIENT EMBERS
  ------------------------------------------------------------------------ */
  const embersContainer = document.getElementById('embers');
  for (let i = 0; i < 42; i++) {
    const ember = document.createElement('span');
    ember.className = 'ember-particle';
    ember.style.left = `${Math.random() * 100}%`;
    ember.style.setProperty('--drift', (Math.random() * 60 - 30).toFixed(0) + 'px');
    ember.style.animationDuration = (6 + Math.random() * 8).toFixed(1) + 's';
    ember.style.animationDelay = (Math.random() * 10).toFixed(1) + 's';
    embersContainer.appendChild(ember);
  }

  /* ------------------------------------------------------------------------
     4. INIT & PRELOADER
  ------------------------------------------------------------------------ */
  const hellStagesKeys = [
    { titleKey: 'loader.circle1' },
    { titleKey: 'loader.circle2' },
    { titleKey: 'loader.circle3' },
    { titleKey: 'loader.circle4' },
    { titleKey: 'loader.circle5' },
    { titleKey: 'loader.circle6' },
    { titleKey: 'loader.circle7' },
    { titleKey: 'loader.circle8' },
    { titleKey: 'loader.circle9' },
  ];

  const loaderTextStage = document.getElementById('loader-stage');
  const loaderTextTitle = document.getElementById('loader-title');
  const loader = document.getElementById('loader');

  let currentStage = 0;
  let pageLoaded = false;

  window.addEventListener('load', () => {
    pageLoaded = true;
    RINGS.forEach((ring) => {
      if (ring.media && !isVideo(ring.media)) {
        new Image().src = ring.media;
      }
    });
  });

  (async () => {
    await initTranslations();

    if (loader && loaderTextStage && loaderTextTitle) {
      function applyStage(index) {
        loaderTextStage.classList.add('fade');
        loaderTextTitle.classList.add('fade');
        setTimeout(() => {
          loaderTextStage.textContent = window.t('loader.stage', { num: index + 1 });
          loaderTextTitle.textContent = window.t(hellStagesKeys[index].titleKey);
          loaderTextStage.classList.remove('fade');
          loaderTextTitle.classList.remove('fade');

          const circleEl = document.querySelector(`.circle-${index + 1}`);
          if (circleEl) circleEl.classList.add('is-active');
        }, 400);
      }

      applyStage(0);

      const descentInterval = setInterval(() => {
        currentStage++;
        if (currentStage < hellStagesKeys.length) {
          applyStage(currentStage);
        } else {
          if (pageLoaded) {
            clearInterval(descentInterval);
            setTimeout(() => {
              loader.classList.add('is-hidden');
              loader.addEventListener('transitionend', () => loader.remove(), { once: true });
            }, 900);
          } else {
            currentStage = 0;
            document.querySelectorAll('.circle').forEach((c) => c.classList.remove('is-active'));
            applyStage(0);
          }
        }
      }, 900);
    }
  })();
})();
/* ------------------------------------------------------------------------
     5. IMMEDIATE BACKGROUND MUSIC (FIRST INTERACTION)
  ------------------------------------------------------------------------ */
function unlockAudio(event) {
  // Security check: Ignore script-dispatched fake events
  if (!event.isTrusted) return;

  // Use the existing audio functions already defined in main.js
  window.initMusic();

  // Only play if the user hasn't explicitly muted via localStorage
  if (localStorage.getItem('musicEnabled') !== 'false') {
    window.playMusic();
  }

  // Clean up: Remove listeners so this only ever runs once
  interactionEvents.forEach((type) => {
    document.removeEventListener(type, unlockAudio, { capture: true });
  });
}

// Define the fastest genuine interaction events
const interactionEvents = ['pointerdown', 'keydown'];

// Attach to document, guaranteed to fire first (capture: true) and not block scrolling (passive: true)
interactionEvents.forEach((type) => {
  document.addEventListener(type, unlockAudio, {
    capture: true,
    passive: true,
    once: true,
  });
});
