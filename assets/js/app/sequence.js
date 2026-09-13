/* ==========================================================================
   TOSS CLUB — Scroll-linked image sequence
   --------------------------------------------------------------------------
   A tall shell wrapped around a sticky, full-screen <canvas>. While the
   shell is passing the viewport the canvas is pinned, and how far the page
   has scrolled through the shell decides which frame of a preloaded image
   sequence is painted. Scrolling back up steps back through the frames.
   This is the technique Apple use on their product pages.

   The whole component is declared in markup, so a second sequence anywhere
   on the site is a second <section> and nothing else:

     <section class="seq" data-seq
              data-seq-src="assets/frames/frame-"
              data-seq-ext=".jpg"
              data-seq-count="60"
              data-seq-pad="3"
              data-seq-travel="400"
              data-seq-label="Description for screen readers">

   Frames are numbered from 1 and zero-padded to `data-seq-pad` digits, so
   the example above resolves to assets/frames/frame-001.jpg … frame-060.jpg.

   Three things this file is careful about, because they are what makes the
   difference between a scrub that feels attached to the wheel and one that
   feels like a slideshow:

     · Nothing is ever drawn from the scroll event. There is no scroll
       listener at all — a requestAnimationFrame loop samples the position
       instead, so painting can never run more often than the display does.
     · That loop only runs while the shell is near the viewport. An
       IntersectionObserver starts and stops it, so the sequence costs
       exactly nothing for the rest of the page.
     · A frame is only painted when the computed index actually changes.
       At sixty frames over three screens of travel most passes of the loop
       land on the same image as the last one, and those cost a comparison.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $$ = d.$$, el = d.el;

  /* Below this width we load every second frame. Halves both the bytes over
     the wire and the decoded bitmaps held in memory, which is the figure
     that actually matters on a phone: sixty 1920×1080 frames occupy roughly
     500MB decoded, and mobile Safari will evict them mid-scroll. */
  var MOBILE = "(max-width: 767px)";

  /* Parallel image requests. Six is about where a connection stops getting
     faster and starts just queueing, and it leaves room for the rest of the
     page to finish loading alongside. */
  var LANES = 6;

  var instances = [];

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

  function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = "0" + s;
    return s;
  }

  /* ---------------------------------------------------------------------- */
  /* One sequence                                                           */
  /* ---------------------------------------------------------------------- */

  function Sequence(section) {
    var ds = section.dataset;

    this.section = section;
    this.src     = ds.seqSrc || "assets/frames/frame-";
    this.ext     = ds.seqExt || ".jpg";
    this.total   = parseInt(ds.seqCount, 10) || 0;
    this.digits  = parseInt(ds.seqPad, 10) || 3;

    /* How tall the shell is, in vh. The sticky canvas is one screen, so the
       scrollable travel is this minus 100vh — see the mapping notes in
       update(). This is the tuning dial: bigger is slower. */
    this.travel  = parseInt(ds.seqTravel, 10) || 400;

    /* The single frame shown under reduced motion. Defaults to the last one,
       which for a sequence that resolves into a composition is the frame
       worth keeping; an opening shot would name frame 1 here instead. */
    this.poster  = parseInt(ds.seqPoster, 10) || this.total;

    /* Read once, at startup. Deliberately not re-read on resize: dropping or
       adding thirty frames because someone dragged a desktop window narrow
       would mean a second preload and a visible stall, and the frames
       already in memory are the expensive part either way. */
    this.step = window.matchMedia(MOBILE).matches ? 2 : 1;

    /* Reduced motion wins by default, which is the accessible behaviour and
       what most visitors should get. But the OS setting is easy to have on
       without realising — Windows turns it on under Accessibility > Visual
       effects > Animation effects, and the whole sequence then reads as a
       frozen picture that ignores the scroll.

         data-seq-motion="always"  ignore the setting, always animate
         data-seq-motion="respect" honour it (the default)

       "always" is a deliberate accessibility trade: it overrides a stated
       preference, so use it only where the sequence is the point of the
       page rather than decoration. */
    this.reduced = ds.seqMotion === "always" ? false : d.reducedMotion.matches;

    /* Crop tighter than plain cover-fit. 1 is cover; above that the frame is
       scaled up and the edges are cropped away, which is how you lose
       whatever is baked into the margins of a frame — a logo across the top,
       a caption along the bottom. focusY slides the crop window vertically:
       0 keeps the top, 1 keeps the bottom, .5 centres it. */
    this.zoom   = parseFloat(ds.seqZoom) || 1;
    this.focusY = ds.seqFocusY === undefined ? 0.5 : parseFloat(ds.seqFocusY);

    this.frames  = [];   /* decoded images, in playing order */
    this.loaded  = 0;
    this.index   = -1;   /* the frame currently on the canvas; -1 = nothing */
    this.running = false;
    this.ready   = false;
    this.visible = false;
    this.top     = 0;    /* cached geometry; see measure() */
    this.height  = 0;

    this.build();
    this.observe();
  }

  /* --- Markup ----------------------------------------------------------- */

  Sequence.prototype.build = function () {
    var section = this.section;

    section.style.setProperty("--seq-travel", this.travel + "vh");
    if (this.reduced) section.classList.add("seq--still");

    this.canvas = el("canvas", {
      class: "seq__canvas",
      role: "img",
      "aria-label": section.dataset.seqLabel || "Animation"
    });

    /* alpha:false lets the compositor skip blending a full-screen opaque
       photograph against what is behind it, every frame. */
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    this.bar = el("i", { class: "seq__barfill" });
    this.pct = el("span", { class: "seq__pct", text: "0%" });
    this.loader = el("div", { class: "seq__loader" }, [
      el("div", { class: "seq__bar", "aria-hidden": "true" }, [this.bar]),
      this.pct
    ]);

    this.sticky = el("div", { class: "seq__sticky" }, [this.canvas, this.loader]);
    section.appendChild(this.sticky);

    this.resize();
    this.measure();

    var self = this;
    this.onResize = function () { self.resize(); self.measure(); };
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("orientationchange", this.onResize, { passive: true });

    /* The shell's position moves whenever anything above it changes height —
       a webfont landing, an async section rendering, an accordion opening.
       Watching the document height catches all of it without the frame loop
       having to re-read layout on every pass. */
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(function () { self.measure(); });
      this.ro.observe(document.documentElement);
    }
  };

  /* The one place layout is read. Called on build, on resize, whenever the
     document changes height, and from TOSS.sequence.refresh(). */
  Sequence.prototype.measure = function () {
    var r = this.section.getBoundingClientRect();
    this.top = r.top + window.scrollY;
    this.height = r.height;
  };

  /* --- Canvas sizing ---------------------------------------------------- */
  /* The backing store is sized to the sticky box in device pixels; the frame
     is then drawn cover-fit inside it, so the image keeps its own aspect
     ratio and the overflow is cropped evenly rather than stretched. */

  Sequence.prototype.resize = function () {
    var box = this.sticky || this.section;
    var w = box.clientWidth || window.innerWidth;
    var h = box.clientHeight || window.innerHeight;

    /* Capped at 2. A 3x phone would ask for an eight-megapixel backing store
       to show a 1920-wide source, which costs memory and fill rate to draw a
       picture that has no more detail in it. */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var cw = Math.round(w * dpr);
    var ch = Math.round(h * dpr);
    if (cw === this.canvas.width && ch === this.canvas.height) return;

    this.canvas.width = cw;
    this.canvas.height = ch;

    /* Resizing a canvas clears it, so whatever was showing has to be put
       back — otherwise a window drag leaves a blank screen until the next
       change of frame index, which may never come if the user has stopped
       scrolling. */
    var current = this.index;
    this.index = -1;
    if (current >= 0) this.paint(current);
  };

  Sequence.prototype.paint = function (i) {
    var img = this.frames[i];
    if (!img) return;

    var cw = this.canvas.width, ch = this.canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return;

    /* Cover: scale by whichever axis needs the most, then zoom in further if
       asked. Taking the max of the two ratios is what preserves the aspect
       ratio — the image is never scaled differently on x and y, only
       cropped. */
    var scale = Math.max(cw / iw, ch / ih) * this.zoom;
    var dw = iw * scale, dh = ih * scale;

    /* Horizontally always centred; vertically wherever focusY asks for. */
    this.ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * this.focusY, dw, dh);
    this.index = i;
  };

  /* --- Preloading ------------------------------------------------------- */
  /* Every frame is in memory and decoded before the sequence will animate.
     A sequence that starts scrubbing against a half-loaded set shows holes
     on the way down and nothing at all on the way back up. */

  Sequence.prototype.load = function () {
    if (this.started) return;
    this.started = true;

    /* Reduced motion never animates, so it never needs the sequence — one
       image, drawn once, and the shell collapses to a single screen. */
    var wanted = [];
    if (this.reduced) {
      wanted.push(this.poster);
    } else {
      for (var n = 1; n <= this.total; n += this.step) wanted.push(n);
    }

    var self = this;
    var need = wanted.length || 1;
    var next = 0;
    var done = 0;

    function pump() {
      if (next >= wanted.length) return;

      var slot = next++;
      var img = new Image();
      img.decoding = "async";
      img.src = self.src + pad(wanted[slot], self.digits) + self.ext;

      /* Decoded up front rather than on first draw. Without this the first
         paint of each frame runs its JPEG decode on the main thread, inside
         the frame loop — which is exactly where a scrub stutters. */
      var held = img.decode ? img.decode() : Promise.reject();

      held.catch(function () {
        /* decode() rejects on a genuine failure, but also on browsers that
           dislike it for an image that is already complete. Fall back to the
           load state rather than dropping a frame that is actually fine. */
        return null;
      }).then(function () {
        /* A frame that truly failed is left out rather than left as a hole;
           the sequence simply plays one frame shorter. */
        if (img.naturalWidth) self.frames[slot] = img;

        done++;
        self.loaded++;
        self.progress(self.loaded / need);

        if (done === wanted.length) self.finish();
        else pump();
      });
    }

    this.progress(0);
    for (var i = 0; i < LANES; i++) pump();
  };

  Sequence.prototype.progress = function (p) {
    this.bar.style.setProperty("--p", clamp01(p));
    this.pct.textContent = Math.round(clamp01(p) * 100) + "%";
  };

  Sequence.prototype.finish = function () {
    /* Close the gaps left by any frame that failed, so indexing stays dense
       and the mapping below never has to test for a missing image. */
    this.frames = this.frames.filter(Boolean);

    if (!this.frames.length) {
      /* Nothing arrived — most likely the path is wrong. Collapse the shell
         so the page does not carry four screens of blank scroll. */
      this.section.classList.add("seq--failed");
      return;
    }

    this.ready = true;
    this.section.classList.add("is-ready");

    if (this.reduced) {
      this.paint(0);
      return;
    }

    this.update();
    if (this.visible) this.start();
  };

  /* --- Scroll → frame index -------------------------------------------- */

  Sequence.prototype.update = function () {
    if (!this.ready) return;

    /* Pure arithmetic over geometry measured in measure(). Nothing here reads
       layout. That matters more than it looks: this runs inside the shared
       frame loop, after the scenes and the parallax have written to the DOM,
       and a single layout read after a write forces the browser to lay the
       whole page out again synchronously, every frame.

       The mapping, against the cached top and height:

           scrollY = top                    the canvas has just pinned  → 0
           scrollY = top + height - 100vh   the shell is used up        → 1

       so the travel — the distance the canvas spends pinned — is the shell's
       height less the one screen its sticky child occupies. With the default
       400vh shell that is 300vh of scrolling spread over the sequence. */
    var travel = this.height - window.innerHeight;
    if (travel <= 0) return;

    var p = clamp01((window.scrollY - this.top) / travel);

    /* Progress to frame. floor(p × count) gives every frame an equal share
       of the travel; the min() is only there for p === 1 exactly, which
       would otherwise index one past the end.

       This is the line to change for a different feel:
         · An eased scrub — slow at the ends, quick through the middle — is
           p = p * p * (3 - 2 * p) immediately above this line.
         · A sequence that should finish early and then hold on its last
           frame is p = clamp01(p / 0.8).
       Plain speed, though, belongs in data-seq-travel rather than here.
       Changing the shell's height keeps every frame on screen for an equal
       share of a longer scroll, where reshaping p makes some frames linger
       and others flick past. */
    var i = Math.min(this.frames.length - 1, Math.floor(p * this.frames.length));

    /* The redundant-draw guard. Sixty frames over three screens means each
       one holds for about 5vh, so most passes of the loop compute the same
       index as the last and return here without touching the canvas. */
    if (i === this.index) return;
    this.paint(i);
  };

  /* --- The frame loop --------------------------------------------------- */

  /* Prefers the page's existing frame loop over starting a second one. Two
     independent rAF loops on one page is not twice the work, it is worse
     than that: they interleave, so writes from one land between the reads of
     the other and each pass can force a fresh layout. TOSS.scroll already
     runs a loop and already fires onScroll only when the position actually
     changed, which is exactly the condition this needs.

     The previous handler is chained rather than replaced, so registering
     here can never quietly unhook something else. Falling back to an own
     loop keeps the component usable on a page without TOSS.scroll. */
  Sequence.prototype.start = function () {
    if (this.running || this.reduced || !this.ready) return;
    this.running = true;

    var self = this;

    if (TOSS.scroll && typeof TOSS.scroll.init === "function") {
      var prev = TOSS.scroll.onScroll;
      this.prevOnScroll = prev;
      this.hooked = function (y) {
        if (prev) prev(y);
        if (self.running) self.update();
      };
      TOSS.scroll.onScroll = this.hooked;
      return;
    }

    (function tick() {
      if (!self.running) return;
      self.update();
      requestAnimationFrame(tick);
    })();
  };

  Sequence.prototype.stop = function () {
    if (!this.running) return;
    this.running = false;

    /* Unhook only if nothing else has registered on top of ours since. */
    if (this.hooked && TOSS.scroll && TOSS.scroll.onScroll === this.hooked) {
      TOSS.scroll.onScroll = this.prevOnScroll || null;
      this.hooked = null;
    }
    /* One last sample on the way out. The loop is stopped while the shell is
       still a screen or two from the edge of the viewport, so without this
       the canvas would keep the frame it happened to hold at that moment
       rather than the first or last frame of the sequence. */
    this.update();
  };

  /* --- Visibility ------------------------------------------------------- */
  /* One observer does both jobs: it starts the preload early enough that the
     loader is usually gone before the shell arrives, and it gates the frame
     loop so nothing runs while the sequence is off screen. A sequence sitting
     at the top of the page is already intersecting when it is observed, so
     this fires immediately on load and the preload starts at once. */

  Sequence.prototype.observe = function () {
    var self = this;

    if (!("IntersectionObserver" in window)) {
      this.visible = true;
      this.load();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      self.visible = on;
      if (on) {
        self.load();
        self.start();
      } else {
        self.stop();
      }
    }, { rootMargin: "200% 0px" });

    io.observe(this.section);

    /* A second, separate question: is the sequence the thing filling the
       screen right now? Squeezing the observer's root to a 1px band across
       the middle of the viewport answers it without a scroll handler and
       without needing the frame loop, so it works under reduced motion too.

       The page chrome is faded while that is true. These frames carry their
       own logo and captions baked into the picture, and the site's fixed nav
       landing on top of them reads as two brands fighting over the same
       corner. */
    if (this.section.dataset.seqCover === "false") return;

    var cover = new IntersectionObserver(function (entries) {
      document.documentElement.classList.toggle(
        "seq-cover", entries[0].isIntersecting
      );
    }, { rootMargin: "-50% 0px -50% 0px" });

    cover.observe(this.section);
  };

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                   */
  /* ---------------------------------------------------------------------- */

  function init() {
    $$("[data-seq]").forEach(function (section) {
      if (section.dataset.seqOn) return;
      section.dataset.seqOn = "1";
      instances.push(new Sequence(section));
    });
  }

  TOSS.sequence = {
    init: init,
    /* Re-measures and re-samples every sequence. Not normally needed — the
       loop measures live — but useful after a scroll position is restored
       programmatically, or a container is resized without a window resize. */
    refresh: function () {
      instances.forEach(function (s) { s.resize(); s.measure(); s.update(); });
    },
    get all() { return instances.slice(); }
  };
})();
