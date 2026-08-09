/* ==========================================================================
   THE DESCENT — main.js
   --------------------------------------------------------------------------
   This file controls three things:
     1. RINGS         — the data for each part of the map: title, the
                         vertical slice of map.png each ring occupies
                         (top/bottom, as fractions of the image height),
                         and what to show in the fullscreen viewer.
     2. Map builder    — lays a transparent, clickable region over each
                          horizontal band of the real map image, positioned
                          to match wherever the image is actually rendered
                          (it uses object-fit: contain, so it can be
                          letterboxed depending on screen size).
     3. Page control   — locks scrolling so the site always snaps fully
                         onto one of the 3 sections (hero / map / credits),
                         plus the fullscreen viewer that opens on ring click.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. RING DATA — edit me
     Put your real media in /assets/circles/ and update `media` below.
     Supported media: .gif, .png, .jpg (rendered as <img>) or
                       .mp4, .webm (rendered as an autoplaying <video>).
     If a file is missing, the viewer shows a placeholder instead of
     breaking, so you can wire this up before the art exists.
  ------------------------------------------------------------------------ */
  const RINGS = [
    {
      roman: 'I',
      title: 'Limbo',
      top: 0.0,
      bottom: 0.111,
      media: 'assets/circles/ring-01.gif',
      description: 'Placeholder description for Limbo. Edit RINGS in js/main.js.',
    },
    {
      roman: 'II',
      title: 'Lust',
      top: 0.111,
      bottom: 0.234,
      media: 'assets/circles/ring-02.gif',
      description: 'Placeholder description for Lust. Edit RINGS in js/main.js.',
    },
    {
      roman: 'III',
      title: 'Gluttony',
      top: 0.234,
      bottom: 0.335,
      media: 'assets/circles/ring-03.gif',
      description: 'Placeholder description for Gluttony. Edit RINGS in js/main.js.',
    },
    {
      roman: 'IV',
      title: 'Greed',
      top: 0.335,
      bottom: 0.452,
      media: 'assets/circles/ring-04.gif',
      description: 'Placeholder description for Greed. Edit RINGS in js/main.js.',
    },
    {
      roman: 'V',
      title: 'Wrath',
      top: 0.452,
      bottom: 0.532,
      media: 'assets/circles/ring-05.gif',
      description: 'Placeholder description for Wrath. Edit RINGS in js/main.js.',
    },
    {
      roman: 'VI',
      title: 'Heresy',
      top: 0.532,
      bottom: 0.617,
      media: 'assets/circles/ring-06.gif',
      description: 'Placeholder description for Heresy. Edit RINGS in js/main.js.',
    },
    {
      roman: 'VII',
      title: 'Violence',
      top: 0.617,
      bottom: 0.71,
      media: 'assets/circles/ring-07.gif',
      description: 'Placeholder description for Violence. Edit RINGS in js/main.js.',
    },
    {
      roman: 'VIII',
      title: 'Fraud',
      top: 0.71,
      bottom: 0.766,
      media: 'assets/circles/ring-08.gif',
      description: 'Placeholder description for Fraud — Malebolge. Edit RINGS in js/main.js.',
    },
    {
      roman: 'IX',
      title: 'Treachery',
      top: 0.766,
      bottom: 0.97,
      media: 'assets/circles/ring-09.gif',
      description: 'Placeholder description for Treachery. Edit RINGS in js/main.js.',
    },
  ];
  // `top` / `bottom` are fractions (0–1) of the IMAGE's height, not the
  // screen — they mark where each ring's band sits inside map.png.
  // These were estimated from the artwork; nudge them in small steps
  // (e.g. 0.532 -> 0.54) and reload if a boundary looks off against
  // your actual image.

  /* ------------------------------------------------------------------------
     HOVER SHAPE — this is what makes each region "fit" the funnel instead
     of being a full-width rectangle. The funnel is widest at the top and
     narrows to a point at the bottom, so each hover region is clipped into
     a trapezoid that tapers the same way.

     TWO PLACES TO ADJUST IT:

     A) Quick, whole-funnel adjustment — change these two numbers.
        Each is "how far the funnel edge sits from center", as a percent
        of the image width, at the very top and very bottom.
  ------------------------------------------------------------------------ */
  const FUNNEL_TOP_HALF_PCT = 31; // top rim: 50% ± this = how wide the top is
  const FUNNEL_BOTTOM_HALF_PCT = 4; // bottom tip: 50% ± this = how wide the point is

  function taperHalfWidthPct(fraction) {
    return FUNNEL_TOP_HALF_PCT + (FUNNEL_BOTTOM_HALF_PCT - FUNNEL_TOP_HALF_PCT) * fraction;
  }

  /* B) Precise, per-ring adjustment — if one specific ring's hover still
        doesn't match the art (e.g. the gold pile bulges out further than
        the taper predicts), give that ring its own `shape` object here,
        with each value as a percent (0–100) of the image width:
          shape: { topLeft: 20, topRight: 80, bottomLeft: 24, bottomRight: 76 }
        Any ring without a `shape` just uses the taper formula above. */
  const RING_SHAPES = {
    III: { topLeft: 18, topRight: 82, bottomLeft: 22, bottomRight: 78 },
    III: { topLeft: 18, topRight: 82, bottomLeft: 22, bottomRight: 78 },
  };

  function shapeFor(ring) {
    if (RING_SHAPES[ring.roman]) return RING_SHAPES[ring.roman];
    const topHalf = taperHalfWidthPct(ring.top);
    const bottomHalf = taperHalfWidthPct(ring.bottom);
    return {
      topLeft: 50 - topHalf,
      topRight: 50 + topHalf,
      bottomLeft: 50 - bottomHalf,
      bottomRight: 50 + bottomHalf,
    };
  }

  /* ------------------------------------------------------------------------
     2. MAP REGION BUILDER
     The map is now a real image (assets/map/map.png). Because the image
     has its own aspect ratio and uses object-fit:contain, it may be
     letterboxed inside .funnel-wrap — so on every build/resize we work
     out exactly where the image is actually drawn, then position each
     ring's clickable strip against that, not against the wrapper.
  ------------------------------------------------------------------------ */
  // const mapImage = document.getElementById('map-image');
  // const regionsLayer = document.getElementById('map-regions');
  // const funnelWrap = document.querySelector('.funnel-wrap');

  // function getRenderedImageRect() {
  //   const wrapRect = funnelWrap.getBoundingClientRect();
  //   const naturalRatio = (mapImage.naturalWidth || 2760) / (mapImage.naturalHeight || 1504);
  //   const boxRatio = wrapRect.width / wrapRect.height;

  //   let renderW, renderH, offsetX, offsetY;
  //   if (naturalRatio > boxRatio) {
  //     // image is relatively wider than the box -> letterboxed top/bottom
  //     renderW = wrapRect.width;
  //     renderH = renderW / naturalRatio;
  //     offsetX = 0;
  //     offsetY = (wrapRect.height - renderH) / 2;
  //   } else {
  //     // image is relatively taller than the box -> letterboxed left/right
  //     renderH = wrapRect.height;
  //     renderW = renderH * naturalRatio;
  //     offsetY = 0;
  //     offsetX = (wrapRect.width - renderW) / 2;
  //   }
  //   return { renderW, renderH, offsetX, offsetY };
  // }

  // function buildMapRegions() {
  //   regionsLayer.innerHTML = '';
  //   const { renderW, renderH, offsetX, offsetY } = getRenderedImageRect();

  //   RINGS.forEach((ring) => {
  //     const region = document.createElement('div');
  //     region.className = 'map-region';
  //     region.style.left = `${offsetX}px`;
  //     region.style.width = `${renderW}px`;
  //     region.style.top = `${offsetY + ring.top * renderH}px`;
  //     region.style.height = `${(ring.bottom - ring.top) * renderH}px`;
  //     region.setAttribute('tabindex', '0');
  //     region.setAttribute('role', 'button');
  //     region.setAttribute('aria-label', `Open ${ring.title}`);

  //     const shape = shapeFor(ring);
  //     region.style.clipPath = `polygon(
  //       ${shape.topLeft}% 0%, ${shape.topRight}% 0%,
  //       ${shape.bottomRight}% 100%, ${shape.bottomLeft}% 100%)`;

  //     const tag = document.createElement('span');
  //     tag.className = 'map-region__tag';
  //     tag.textContent = `CIRCLE ${ring.roman} — ${ring.title.toUpperCase()}`;
  //     // keep the tag inside the trapezoid at both its top and bottom edge
  //     const safeLeftPct = Math.max(shape.topLeft, shape.bottomLeft);
  //     tag.style.left = `calc(${safeLeftPct}% + 10px)`;
  //     region.appendChild(tag);

  //     region.addEventListener('click', () => openViewer(ring));
  //     region.addEventListener('keydown', (e) => {
  //       if (e.key === 'Enter' || e.key === ' ') {
  //         e.preventDefault();
  //         openViewer(ring);
  //       }
  //     });

  //     regionsLayer.appendChild(region);
  //   });
  // }

  // let resizeTimer;
  // window.addEventListener('resize', () => {
  //   clearTimeout(resizeTimer);
  //   resizeTimer = setTimeout(buildMapRegions, 120);
  // });

  // if (mapImage.complete) {
  //   buildMapRegions();
  // } else {
  //   mapImage.addEventListener('load', buildMapRegions);
  // }
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
     3a. FULLSCREEN VIEWER
  ------------------------------------------------------------------------ */
  const viewer = document.getElementById('viewer');
  const viewerMedia = document.getElementById('viewer-media');
  const viewerEyebrow = document.getElementById('viewer-eyebrow');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerDesc = document.getElementById('viewer-desc');
  const viewerClose = document.getElementById('viewer-close');

  let viewerOpen = false;

  function isVideo(path) {
    return /\.(mp4|webm|ogg)$/i.test(path);
  }

  function openViewer(ring) {
    viewerEyebrow.textContent = `CIRCLE ${ring.roman}`;
    viewerTitle.textContent = ring.title;
    viewerDesc.textContent = ring.description;

    viewerMedia.innerHTML = '';
    if (ring.media) {
      if (isVideo(ring.media)) {
        const video = document.createElement('video');
        video.src = ring.media;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.onerror = () => showPlaceholder(ring.media);
        viewerMedia.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = ring.media;
        img.alt = ring.title;
        img.onerror = () => showPlaceholder(ring.media);
        viewerMedia.appendChild(img);
      }
    } else {
      showPlaceholder(null);
    }

    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    viewerOpen = true;
  }

  function showPlaceholder(path) {
    viewerMedia.innerHTML = `<p class="placeholder">MEDIA NOT FOUND${path ? `<br>${path}` : ''}<br><br>Drop a gif or mp4 at this path,<br>or update it in js/main.js → RINGS</p>`;
  }

  function closeViewer() {
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    viewerOpen = false;
    setTimeout(() => {
      viewerMedia.innerHTML = '';
    }, 450);
  }

  viewerClose.addEventListener('click', closeViewer);
  viewer.querySelector('.viewer__scrim').addEventListener('click', closeViewer);

  /* ------------------------------------------------------------------------
     3b. PAGE CONTROL — locked, one-section-at-a-time scrolling
  ------------------------------------------------------------------------ */
  // const track = document.getElementById('scroll-track');
  // const panels = document.querySelectorAll('.panel');
  // const railDots = document.querySelectorAll('.rail__dot');
  // const totalPanels = panels.length;

  // let currentIndex = 0;
  // let isAnimating = false;
  // const ANIMATION_MS = 720;
  // const WHEEL_THRESHOLD = 12;

  // function goTo(nextIndex) {
  //   nextIndex = Math.max(0, Math.min(totalPanels - 1, nextIndex));
  //   if (nextIndex === currentIndex || isAnimating) return;
  //   currentIndex = nextIndex;
  //   track.style.transform = `translateY(-${currentIndex * 100}vh)`;
  //   railDots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentIndex));
  //   isAnimating = true;
  //   setTimeout(() => {
  //     isAnimating = false;
  //   }, ANIMATION_MS);
  // }

  // function next() {
  //   goTo(currentIndex + 1);
  // }
  // function prev() {
  //   goTo(currentIndex - 1);
  // }

  // // Mouse wheel / trackpad
  // window.addEventListener(
  //   'wheel',
  //   (e) => {
  //     if (viewerOpen) return; // let the viewer own scroll/close instead
  //     e.preventDefault();
  //     if (isAnimating) return;
  //     if (e.deltaY > WHEEL_THRESHOLD) next();
  //     else if (e.deltaY < -WHEEL_THRESHOLD) prev();
  //   },
  //   { passive: false },
  // );

  // // Touch swipe
  // let touchStartY = null;
  // window.addEventListener(
  //   'touchstart',
  //   (e) => {
  //     if (viewerOpen) return;
  //     touchStartY = e.touches[0].clientY;
  //   },
  //   { passive: true },
  // );

  // window.addEventListener(
  //   'touchend',
  //   (e) => {
  //     if (viewerOpen || touchStartY === null) return;
  //     const delta = touchStartY - e.changedTouches[0].clientY;
  //     if (Math.abs(delta) > 50) {
  //       delta > 0 ? next() : prev();
  //     }
  //     touchStartY = null;
  //   },
  //   { passive: true },
  // );

  // // Keyboard
  // window.addEventListener('keydown', (e) => {
  //   if (viewerOpen) {
  //     if (e.key === 'Escape') closeViewer();
  //     return;
  //   }
  //   if (['ArrowDown', 'PageDown'].includes(e.key)) {
  //     e.preventDefault();
  //     next();
  //   } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
  //     e.preventDefault();
  //     prev();
  //   }
  // });

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

    document.querySelector('.rail').classList.add('is-visible');

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

  function next() {
    if (currentIndex === 0 && !cloudsOpened) {
      openCloudsAndGo();
    } else {
      goTo(currentIndex + 1);
    }
  }

  function prev() {
    if (currentIndex === 1 && cloudsOpened) {
      goTo(0);
      setTimeout(closeClouds, ANIMATION_MS);
    } else {
      goTo(currentIndex - 1);
    }
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (viewerOpen) return;
      e.preventDefault();
      if (isAnimating) return;
      if (e.deltaY > WHEEL_THRESHOLD) next();
      else if (e.deltaY < -WHEEL_THRESHOLD) prev();
    },
    { passive: false },
  );

  // Touch swipe
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
        delta > 0 ? next() : prev();
      }
      touchStartY = null;
    },
    { passive: true },
  );

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (viewerOpen) {
      if (e.key === 'Escape') closeViewer();
      return;
    }
    if (['ArrowDown', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      next();
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      prev();
    }
  });

  // Rail dots + any element with data-jump="<index>"
  railDots.forEach((dot) => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index, 10)));
  });
  document.querySelectorAll('[data-jump]').forEach((el) => {
    el.addEventListener('click', () => goTo(parseInt(el.dataset.jump, 10)));
  });

  /* ------------------------------------------------------------------------
     3c. AMBIENT EMBERS
  ------------------------------------------------------------------------ */
  const embersContainer = document.getElementById('embers');
  const EMBER_COUNT = 42;

  for (let i = 0; i < EMBER_COUNT; i++) {
    const ember = document.createElement('span');
    ember.className = 'ember-particle';
    const left = Math.random() * 100;
    const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
    const duration = (6 + Math.random() * 8).toFixed(1) + 's';
    const delay = (Math.random() * 10).toFixed(1) + 's';
    ember.style.left = `${left}%`;
    ember.style.setProperty('--drift', drift);
    ember.style.animationDuration = duration;
    ember.style.animationDelay = delay;
    embersContainer.appendChild(ember);
  }

  /* ------------------------------------------------------------------------
     4. DANTE'S DESCENT PRELOADER (LOOPING LOGIC)
  ------------------------------------------------------------------------ */
  const hellStages = [
    { stage: 'STAGE 1', title: 'CIRCLE I — LIMBO' },
    { stage: 'STAGE 2', title: 'CIRCLE II — LUST' },
    { stage: 'STAGE 3', title: 'CIRCLE III — GLUTTONY' },
    { stage: 'STAGE 4', title: 'CIRCLE IV — GREED' },
    { stage: 'STAGE 5', title: 'CIRCLE V — WRATH' },
    { stage: 'STAGE 6', title: 'CIRCLE VI — HERESY' },
    { stage: 'STAGE 7', title: 'CIRCLE VII — VIOLENCE' },
    { stage: 'STAGE 8', title: 'CIRCLE VIII — FRAUD' },
    { stage: 'STAGE 9', title: 'CIRCLE IX — TREACHERY' },
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
        const preloadImg = new Image();
        preloadImg.src = ring.media;
      }
    });
  });

  if (loader && loaderTextStage && loaderTextTitle) {
    function applyStage(index) {
      loaderTextStage.classList.add('fade');
      loaderTextTitle.classList.add('fade');

      setTimeout(() => {
        loaderTextStage.textContent = hellStages[index].stage;
        loaderTextTitle.textContent = hellStages[index].title;
        loaderTextStage.classList.remove('fade');
        loaderTextTitle.classList.remove('fade');

        const circleEl = document.querySelector(`.circle-${index + 1}`);
        if (circleEl) circleEl.classList.add('is-active');
      }, 400);
    }

    loaderTextStage.textContent = hellStages[0].stage;
    loaderTextTitle.textContent = hellStages[0].title;
    document.querySelector('.circle-1').classList.add('is-active');

    const descentInterval = setInterval(() => {
      currentStage++;

      if (currentStage < hellStages.length) {
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
