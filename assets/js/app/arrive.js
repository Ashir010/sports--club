/* ==========================================================================
   TOSS CLUB — Arrival
   --------------------------------------------------------------------------
   Lifts the --pine wash that assets/css/arrive.css paints over this page, so
   that arriving from the intro is one continuous fade rather than two pages
   cutting.

   Loaded before dom.js and before main.js, and deliberately standalone: it
   has to be able to clear the wash even if something further down the boot
   sequence throws. A transition that can strand a visitor behind an opaque
   layer is worse than no transition.
   ========================================================================== */

(function () {
  "use strict";

  var el = document.getElementById("arrive");
  if (!el) return;

  /* Was this an arrival from the intro, or did someone type the address?
     sessionStorage is set by the intro immediately before it navigates.
     Checking the referrer as well covers a visitor who follows the intro's
     "Enter the club" link in a context where storage is unavailable — a
     private window with site data blocked, for instance. */
  function cameFromIntro() {
    try {
      if (sessionStorage.getItem("toss:from-intro") === "1") {
        sessionStorage.removeItem("toss:from-intro");
        return true;
      }
    } catch (e) {
      /* Storage disabled. Fall through to the referrer. */
    }

    if (!document.referrer) return false;
    try {
      var r = new URL(document.referrer);
      if (r.origin !== window.location.origin) return false;
      /* The intro is the site root: "/", "/index.html", or a directory. */
      return /(^\/$|\/index\.html$|\/$)/.test(r.pathname);
    } catch (e) {
      return false;
    }
  }

  /* A direct visit never sees the wash. Removing the class rather than
     fading it means the page paints normally on the very first frame. */
  if (!cameFromIntro()) {
    el.parentNode.removeChild(el);
    return;
  }

  var lifted = false;

  function lift() {
    if (lifted) return;
    lifted = true;

    el.classList.add("is-off");

    /* Taken out of the tree once the fade has finished, so a full-screen
       fixed layer is not left holding a compositor layer for the life of the
       page. transitionend would not fire if the transition was cut short, so
       the timer is the one that has to be authoritative. */
    window.setTimeout(function () {
      el.classList.add("is-gone");
    }, 700);
  }

  /* Two frames after load: one for the browser to lay the page out, one for
     it to paint it. Lifting any earlier reveals a half-built page, which is
     precisely what the wash exists to hide. */
  function liftSoon() {
    requestAnimationFrame(function () {
      requestAnimationFrame(lift);
    });
  }

  if (document.readyState === "complete") {
    liftSoon();
  } else {
    window.addEventListener("load", liftSoon);
  }

  /* A hard ceiling. If `load` never fires — a stalled image, a font that
     never resolves, a script error upstream — the wash still comes off.
     Nobody should be left looking at a blank green screen. */
  window.setTimeout(lift, 2500);
})();
