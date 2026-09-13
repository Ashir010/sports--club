/* ==========================================================================
   TOSS CLUB — Scroll behaviour
   --------------------------------------------------------------------------
   One requestAnimationFrame loop drives everything that depends on scroll
   position: the Lenis smoothing itself, the chapter rail, and the parallax
   drift on the court drawings. Nothing else listens to the scroll event, so
   the page has a single, predictable frame budget.

   If Lenis is unavailable the page keeps native scrolling and every other
   feature here still works. If reduced motion is requested, the smoothing
   and the drift are skipped entirely.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;

  var reduced = d.reducedMotion.matches;
  var lenis = null;
  var running = false;

  /* ---------------------------------------------------------------------- */
  /* Smooth scrolling                                                       */
  /* ---------------------------------------------------------------------- */

  function initLenis() {
    if (reduced || typeof window.Lenis !== "function") return null;

    lenis = new window.Lenis({
      duration: 1.05,
      /* Exponential ease-out: quick to respond, long to settle. */
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.7,
      autoRaf: false
    });
    return lenis;
  }

  function scrollTo(target, opts) {
    var o = opts || {};
    var offset = o.offset !== undefined ? o.offset : -(navHeight() + 8);
    if (lenis) {
      lenis.scrollTo(target, { offset: offset, duration: o.duration || 1.25 });
    } else if (typeof target === "string" || target instanceof Element) {
      var node = typeof target === "string" ? $(target) : target;
      if (node) node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    } else {
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    }
  }

  function navHeight() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h");
    return parseInt(v, 10) || 76;
  }

  function stop() { if (lenis) lenis.stop(); }
  function start() { if (lenis) lenis.start(); }

  /* In-page links go through Lenis so anchors keep the same easing as the
     wheel, and so the fixed bar never covers the heading landed on. */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href || href === "#" || link.hasAttribute("data-book")) return;
      var node = document.querySelector(href);
      if (!node) return;
      e.preventDefault();
      scrollTo(node);
      /* Keep the keyboard with the eye. */
      node.setAttribute("tabindex", "-1");
      node.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Chapter rail                                                           */
  /* ---------------------------------------------------------------------- */

  /* `boxes` and `max` are measured geometry, refreshed on resize and by
     refresh(). They exist because updateRail used to read offsetTop and
     offsetHeight off every target on every frame — and did it twice, in two
     separate loops, after updateScenes had already written to the scenes.
     A read after a write forces the browser to lay the page out again
     synchronously, so the rail alone was costing ~33 forced layouts per
     frame. Same reasoning as the parallax cache below. */
  var rail = { root: null, fill: null, dots: [], targets: [], boxes: [], max: 1 };

  function buildRail() {
    var host = $("#railnav");
    if (!host) return;

    var links = $$(".nav__link");
    if (!links.length) return;

    rail.root = host;
    rail.fill = el("i", { class: "railnav__fill" });
    host.appendChild(el("div", { class: "railnav__track" }, [rail.fill]));

    links.forEach(function (a) {
      var id = a.getAttribute("href");
      var node = document.querySelector(id);
      if (!node) return;
      var dot = el("button", {
        class: "railnav__dot",
        type: "button",
        "aria-label": "Go to " + a.textContent.trim()
      }, [el("span", { class: "railnav__label", text: a.textContent.trim() })]);
      dot.addEventListener("click", function () { scrollTo(node); });
      host.appendChild(dot);
      rail.dots.push(dot);
      rail.targets.push(node);
    });
  }

  function measureRail() {
    if (!rail.root) return;
    rail.max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    rail.boxes = rail.targets.map(function (node) {
      var r = node.getBoundingClientRect();
      return {
        top: r.top + window.scrollY,
        h: r.height,
        light: node.classList.contains("section--light")
      };
    });
  }

  /* Pure arithmetic over the cached boxes, plus writes. No layout is read
     here, so this can run after updateScenes without forcing a reflow. */
  function updateRail(y) {
    if (!rail.root || !rail.boxes.length) return;

    rail.fill.style.setProperty("--p", Math.min(y / rail.max, 1));

    var mid = y + window.innerHeight / 2;
    var active = -1;
    var onLight = false;

    /* One pass, not two: the active dot and the light-ground test were
       walking the same list looking for the same thing. */
    for (var i = 0; i < rail.boxes.length; i++) {
      var b = rail.boxes[i];
      if (mid >= b.top && mid < b.top + b.h) {
        active = i;
        onLight = b.light;
        break;
      }
    }

    for (var j = 0; j < rail.dots.length; j++) {
      rail.dots[j].classList.toggle("is-on", j === active);
    }
    rail.root.classList.toggle("is-onlight", onLight);
  }

  /* ---------------------------------------------------------------------- */
  /* Parallax on the court drawings                                         */
  /* ---------------------------------------------------------------------- */
  /* Positions are measured once and cached. Reading layout inside the frame
     loop for thirty drawings would force a reflow every frame.             */

  var layers = [];

  function measure() {
    layers = $$(".plate__art").filter(function (node) {
      /* Skip anything whose position on screen is not a function of how far
         the page has scrolled: the sticky story stage, the rotating hero
         plate, the lightbox, and the pinned prologue backdrops, which are
         scrubbed against their own scene progress instead. */
      return !node.closest(".story__stage, .hero__plate, .lightbox, .scene__bg");
    }).map(function (node) {
      var box = node.parentElement || node;
      var r = box.getBoundingClientRect();
      return {
        node: node,
        top: r.top + window.scrollY,
        h: r.height || 1,
        shift: 0
      };
    });

    /* Anything still masked was measured before the content below it had
       finished rendering, so its recorded position may have moved. */
    masked.forEach(function (m) {
      m.top = m.node.getBoundingClientRect().top + window.scrollY;
    });
  }

  function updateParallax(y) {
    if (reduced) return;
    var vh = window.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var start = L.top - vh;
      var end = L.top + L.h;
      if (y < start || y > end) continue;
      /* -1 above the fold, +1 below it. */
      var p = ((y + vh / 2) - (L.top + L.h / 2)) / (vh / 2 + L.h / 2);
      var shift = Math.round(p * 26 * 10) / 10;
      if (shift !== L.shift) {
        L.shift = shift;
        L.node.style.setProperty("--py", shift + "px");
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Unmask                                                                 */
  /* ---------------------------------------------------------------------- */
  /* These are measured against scroll position rather than watched with an
     IntersectionObserver, and deliberately so: the mask is a clip-path that
     collapses the element to zero height, and a clipped element reports
     itself as not intersecting. An observer would therefore never fire and
     the mask could never lift itself. getBoundingClientRect ignores the
     element's own clip, so measuring is both correct and cheap here — we
     already run a frame loop for the parallax.                             */

  var masked = [];

  function collectUnmask(root) {
    var nodes = $$(".unmask:not(.is-in)", root || document);
    if (!nodes.length) return;

    if (reduced) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    nodes.forEach(function (node) {
      for (var i = 0; i < masked.length; i++) {
        if (masked[i].node === node) return;
      }
      var r = node.getBoundingClientRect();
      masked.push({ node: node, top: r.top + window.scrollY });
    });
  }

  function updateUnmask(y) {
    if (!masked.length) return;
    /* Lift once the top of the element has come a tenth of the way up. */
    var line = y + window.innerHeight * 0.92;
    for (var i = masked.length - 1; i >= 0; i--) {
      if (masked[i].top <= line) {
        masked[i].node.classList.add("is-in");
        masked.splice(i, 1);
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Scenes — the pinned chapters of the prologue                           */
  /* ---------------------------------------------------------------------- */
  /* A scene is a tall shell wrapped around a sticky frame. CSS does the
     pinning; all this contributes is how far through the shell the page has
     scrolled, published on the shell as two custom properties:

       --t  0 to 1 across the whole travel, for anything continuous —
            a scale, a drift, a fade-out.
       --f  the arrival: 0 while the frame is still sliding up into place,
            1 by the time it is pinned, and 1 from then on.

     --f deliberately has no fall. A chapter that faded out before its
     frame released left the pin holding an empty screen for most of a
     viewport; letting the text stay lit and physically slide away with its
     own frame, while the next chapter slides in underneath, is both
     shorter and a cleaner cut.

     Neither is written under reduced motion, so the stylesheet's var()
     fallbacks render the finished state and the shells collapse to their
     natural height. */

  var scenes = [];

  function collectScenes() {
    scenes = $$(".scene").map(function (node) {
      return {
        node: node,
        frame: $(".scene__frame", node),
        top: 0,
        travel: 1,
        t: -1,
        f: -1
      };
    });
  }

  function measureScenes() {
    var vh = window.innerHeight;
    scenes.forEach(function (s) {
      var r = s.node.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      var frameH = s.frame ? s.frame.offsetHeight : vh;
      /* The sticky frame is parked for exactly the height the shell has
         over and above the frame itself. That distance is the travel. */
      s.travel = Math.max(1, r.height - frameH);
    });
  }

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

  function updateScenes(y) {
    if (reduced || !scenes.length) return;

    var live = null;

    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var raw = (y - s.top) / s.travel;

      /* Clamped rather than skipped. A scene the page has jumped clean over
         — an anchor, a restored hash, a fast flick — still has to be left
         holding its terminal value, or it keeps whatever it was showing
         when it was last on screen. Writes only happen on a change, so a
         settled scene costs nothing after the first frame. */
      var t = clamp01(raw);
      /* Lit a third of a screen before the frame settles, so a chapter is
         already readable as it slides into place rather than appearing
         once it has stopped. */
      var f = clamp01((raw + 0.35) / 0.4);

      t = Math.round(t * 1000) / 1000;
      f = Math.round(f * 1000) / 1000;

      if (t !== s.t) { s.t = t; s.node.style.setProperty("--t", t); }
      if (f !== s.f) { s.f = f; s.node.style.setProperty("--f", f); }

      if (raw >= 0 && raw <= 1 && !live) live = s;
    }

    if (TOSS.scroll.onScene) TOSS.scroll.onScene(live);
  }

  /* ---------------------------------------------------------------------- */
  /* Cursor label                                                           */
  /* ---------------------------------------------------------------------- */

  function initCursor() {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;

    var label = el("div", { class: "cursorlabel", "aria-hidden": "true" });
    document.body.appendChild(label);

    var x = 0, y = 0, shown = false;

    document.addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      var hit = e.target.closest ? e.target.closest("[data-cursor]") : null;
      if (hit) {
        if (!shown) { shown = true; label.classList.add("is-on"); }
        label.textContent = hit.getAttribute("data-cursor");
      } else if (shown) {
        shown = false;
        label.classList.remove("is-on");
      }
    }, { passive: true });

    document.addEventListener("pointerdown", function () {
      label.classList.remove("is-on");
      shown = false;
    }, { passive: true });

    TOSS.scroll._cursorFrame = function () {
      label.style.setProperty("--cx", x + "px");
      label.style.setProperty("--cy", y + "px");
    };
  }

  /* ---------------------------------------------------------------------- */
  /* The frame loop                                                         */
  /* ---------------------------------------------------------------------- */

  var lastY = -1;
  var velY = 0;        /* pixels of scroll in the last frame, smoothed */
  var velFrom = 0;
  var lastTime = 0;

  function frame(time) {
    if (lenis) lenis.raf(time);

    var y = window.scrollY;
    var dt = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;

    /* Smoothed so a single stuttering frame does not throw anything that
       reads the velocity. */
    velY += ((y - velFrom) - velY) * 0.25;
    velFrom = y;

    if (y !== lastY) {
      lastY = y;
      updateScenes(y);
      updateRail(y);
      updateParallax(y);
      updateUnmask(y);
      if (TOSS.scroll.onScroll) TOSS.scroll.onScroll(y);
    }

    /* Anything that has to move every frame, scrolling or not — the name
       bands, the cursor disc — runs here rather than starting a second
       requestAnimationFrame loop of its own. */
    if (TOSS.scroll.onFrame) TOSS.scroll.onFrame(dt, velY);
    if (TOSS.scroll._cursorFrame) TOSS.scroll._cursorFrame();

    requestAnimationFrame(frame);
  }

  function init() {
    initLenis();
    buildRail();
    initAnchors();
    initCursor();
    collectScenes();
    measureScenes();
    updateScenes(window.scrollY);
    measure();
    measureRail();
    collectUnmask();
    updateUnmask(window.scrollY);

    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measureScenes();
        measure();
        measureRail();
        lastY = -1;
        if (lenis) lenis.resize();
      }, 180);
    }, { passive: true });
  }

  TOSS.scroll = {
    init: init,
    to: scrollTo,
    stop: stop,
    start: start,
    /* Call after any render that adds plates or unmaskable tiles. */
    refresh: function (root) {
      measureScenes();
      measure();
      measureRail();
      collectUnmask(root);
      updateUnmask(window.scrollY);
      lastY = -1;
    },
    get lenis() { return lenis; },
    reduced: reduced,
    onScroll: null,
    /* Called with the scene currently under the pin, or null between them. */
    onScene: null,
    /* Called every frame with (deltaMs, scrollVelocity), for motion that
       continues whether or not the page is being scrolled. */
    onFrame: null
  };
})();
