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

  var rail = { root: null, fill: null, dots: [], targets: [] };

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

  function updateRail(y) {
    if (!rail.root) return;

    var max = document.documentElement.scrollHeight - window.innerHeight;
    rail.fill.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);

    var mid = y + window.innerHeight / 2;
    var active = -1;
    rail.targets.forEach(function (node, i) {
      var top = node.offsetTop;
      if (mid >= top && mid < top + node.offsetHeight) active = i;
    });
    rail.dots.forEach(function (dot, i) {
      dot.classList.toggle("is-on", i === active);
    });

    /* Invert the rail over a chalk chapter so it stays legible. */
    var onLight = false;
    for (var i = 0; i < rail.targets.length; i++) {
      var n = rail.targets[i];
      if (mid >= n.offsetTop && mid < n.offsetTop + n.offsetHeight) {
        onLight = n.classList.contains("section--light");
        break;
      }
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
         plate, and the lightbox. */
      return !node.closest(".story__stage, .hero__plate, .lightbox");
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

  function frame(time) {
    if (lenis) lenis.raf(time);

    var y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      updateRail(y);
      updateParallax(y);
      updateUnmask(y);
      if (TOSS.scroll.onScroll) TOSS.scroll.onScroll(y);
    }
    if (TOSS.scroll._cursorFrame) TOSS.scroll._cursorFrame();

    requestAnimationFrame(frame);
  }

  function init() {
    initLenis();
    buildRail();
    initAnchors();
    initCursor();
    measure();
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
        measure();
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
      measure();
      collectUnmask(root);
      updateUnmask(window.scrollY);
      lastY = -1;
    },
    get lenis() { return lenis; },
    reduced: reduced,
    onScroll: null
  };
})();
