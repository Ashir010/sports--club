/* ==========================================================================
   TOSS CLUB — The intro page
   --------------------------------------------------------------------------
   Everything that is specific to intro.html: the smooth scrolling, the one
   frame loop the page runs, and the handoff to the site at the end.

   The gate component itself is not touched. It prefers a shared frame loop
   over starting its own, asking for `TOSS.scroll` with an `init` method and
   registering on `TOSS.scroll.onScroll`. This file provides exactly that
   shape, so the intro gets the same single-loop behaviour the main site has
   without pulling in lib/scroll.js — which exists to drive a chapter rail,
   parallax layers and pinned scenes, none of which are here.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  /* The site itself. The intro lives at index.html so that it is what a
     visitor gets when they open the domain; the page it hands off to is
     home.html. Swapping those two filenames is all it takes to put the site
     back at the root and retire the intro. */
  var DEST = "home.html";

  var reduced = d.reducedMotion.matches;
  var lenis = null;
  var done = false;

  /* Must match the opacity transition on .intro__exit in assets/css/intro.css. */
  var EXIT_MS = 500;

  /* ---------------------------------------------------------------------- */
  /* Smooth scrolling                                                       */
  /* ---------------------------------------------------------------------- */
  /* Worth the bytes on a page whose whole job is a scrub. Without smoothing,
     one notch of a wheel is an instant ~100px jump, which across sixty
     frames in three screens of travel lands two or three frames further on
     every time and reads as stepping rather than motion. */

  function initLenis() {
    if (reduced || typeof window.Lenis !== "function") return null;
    return new window.Lenis({
      /* Frame-based damping rather than a timed tween.

         `duration` starts a fresh ease on every wheel event and retargets
         the one already running, so a series of notches reads as a series
         of surges: each one accelerates hard, decelerates hard, and is then
         interrupted by the next. Measured on this page that left the scroll
         velocity varying by two thirds of its own mean.

         `lerp` instead moves a fixed fraction of the remaining distance
         every frame. Notches accumulate into one continuous motion rather
         than fighting each other, which is what a scrub wants: the picture
         is tied to the position, so the position is what has to be smooth.
         Lower is smoother and heavier. At 0.11 this stage settles in about
         a seventh of a second and leaves room for the second filter in
         app/gate.js, which rounds off what is left. Measured over three
         runs of identical wheel input, the pair cut frame-to-frame jerk
         from 0.246 to 0.115 against the timed tween this replaced. */
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.7,
      /* Driven from the loop below rather than starting a second one. */
      autoRaf: false
    });
  }

  /* ---------------------------------------------------------------------- */
  /* The one frame loop                                                     */
  /* ---------------------------------------------------------------------- */
  /* Same contract as lib/scroll.js: advance Lenis every frame, but only call
     onScroll when the position actually changed, so the sequence is not
     asked to recompute a frame index that cannot have moved. */

  var lastY = -1;

  function frame(time) {
    if (lenis) lenis.raf(time);

    var y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      if (TOSS.scroll.onScroll) TOSS.scroll.onScroll(y);
      checkHandoff();
    }

    /* Called on every frame, whether or not the page moved.

       onScroll above is deliberately edge-triggered, which is right for a
       component that maps a position straight onto a frame index. It is
       wrong for one that eases toward the position it has been given: that
       needs to keep running after the scroll has stopped, or it freezes
       partway through catching up. Anything that smooths its own input
       listens here instead. */
    if (TOSS.scroll.onFrame) TOSS.scroll.onFrame(time);

    requestAnimationFrame(frame);
  }

  /* The shim the sequence component looks for. `init` only has to exist —
     the component tests for it to decide whether a shared loop is available. */
  TOSS.scroll = {
    init: function () {},
    onScroll: null,
    onFrame: null,
    get lenis() { return lenis; },
    reduced: reduced
  };

  /* ---------------------------------------------------------------------- */
  /* The handoff                                                            */
  /* ---------------------------------------------------------------------- */

  var outro = null;
  var exit = null;

  /* Fires once the outro panel is properly on screen rather than the instant
     it is touched, so a flick that overshoots the last frame by a few pixels
     does not fire the navigation. */
  function checkHandoff() {
    if (done || !outro) return;

    var r = outro.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.4) return;

    go();
  }

  function go() {
    if (done) return;
    done = true;

    /* Stop taking input. lenis.stop() makes Lenis swallow and preventDefault
       the wheel, which is enough on its own — setting overflow:hidden on the
       body used to be here too and did nothing, because the scroller is the
       root element, not the body. On a platform with classic scrollbars it
       was actively harmful: toggling overflow can reclaim the scrollbar
       gutter and shift the whole page sideways at the exact moment it is
       supposed to be sitting still. */
    if (lenis) lenis.stop();

    /* Tells the far side that this is an arrival from the intro, so home.html
       knows to fade up rather than paint cold. Read and cleared there. */
    try { sessionStorage.setItem("toss:from-intro", "1"); } catch (e) {}

    if (reduced) {
      window.location.replace(DEST);
      return;
    }

    if (exit) exit.classList.add("is-on");

    /* Held until the wash is actually opaque. Navigating mid-fade is what
       makes a crossfade read as a flash: the old page is still partly visible
       when it is torn down. EXIT_MS matches the transition in intro.css, and
       the small margin covers the frame the class change costs.

       replace() rather than assign() so the back button returns to wherever
       the visitor came from instead of bouncing them into the intro again. */
    window.setTimeout(function () { window.location.replace(DEST); }, EXIT_MS + 60);
  }

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                   */
  /* ---------------------------------------------------------------------- */

  function boot() {
    outro = d.$("#outro");
    exit = d.$("#exit");

    lenis = initLenis();
    TOSS.gate.init();

    requestAnimationFrame(frame);

    /* A page restored from the back/forward cache keeps its old scroll
       position, which on this page means landing on the outro and being
       redirected straight back out again. Send it to the top instead. */
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      done = false;
      document.body.style.overflow = "";
      if (exit) exit.classList.remove("is-on");
      window.scrollTo(0, 0);
      if (lenis) { lenis.start(); lenis.scrollTo(0, { immediate: true }); }
    });
  }

  /* The browser restoring a scroll position on reload would drop the visitor
     halfway through the sequence, or past its end. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
