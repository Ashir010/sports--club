/* ==========================================================================
   TOSS CLUB — Story devices
   --------------------------------------------------------------------------
   The name bands that run across the head of every section, and the
   vertical scroll cue on the cover.

   A section asks for a band by naming itself in markup:

       <section data-marquee="Pick your game"> … </section>

   so the band is never a second copy of the heading that can drift out of
   sync with it in the source, and a section that should not have one
   simply does not carry the attribute.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;

  var bands = [];

  /* ---------------------------------------------------------------------- */
  /* Marquee                                                                */
  /* ---------------------------------------------------------------------- */

  function buildRun(text, copies) {
    var run = el("div", { class: "marquee__run" });
    for (var i = 0; i < copies; i++) {
      run.appendChild(el("span", { class: "marquee__word", text: text }));
      run.appendChild(el("i", { class: "marquee__dot" }));
    }
    return run;
  }

  function buildMarquee(section) {
    var text = section.dataset.marquee;
    if (!text) return;

    /* Enough copies that one run is always at least as wide as the
       viewport, or the reset would leave a gap on a wide screen. */
    var copies = Math.max(3, Math.ceil(window.innerWidth / Math.max(text.length * 22, 160)) + 1);

    var track = el("div", { class: "marquee__track" });
    var a = buildRun(text, copies);
    var b = buildRun(text, copies);
    track.appendChild(a);
    track.appendChild(b);

    /* The band repeats the heading that follows it, so it is decoration to
       a screen reader, not a second announcement of the same section. */
    var band = el("div", { class: "marquee", "aria-hidden": "true" }, [track]);
    section.insertBefore(band, section.firstChild);

    bands.push({ track: track, run: a, x: 0, w: 0 });
  }

  function measureBands() {
    bands.forEach(function (band) {
      band.w = band.run.getBoundingClientRect().width || 1;
    });
  }

  /* Drift is constant; scrolling pushes it along. The band never reverses,
     so the reading direction stays stable however the page is moved. */
  function tickBands(dt, vel) {
    for (var i = 0; i < bands.length; i++) {
      var band = bands[i];
      if (!band.w) continue;

      band.x -= (dt * 0.022) + Math.abs(vel) * 0.35;
      /* One whole run has left; step back by exactly that and the seam
         between the two runs never becomes visible. */
      while (band.x <= -band.w) band.x += band.w;

      band.track.style.transform = "translate3d(" + band.x.toFixed(1) + "px,0,0)";
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Vertical scroll cue                                                    */
  /* ---------------------------------------------------------------------- */

  function buildVerticalCue() {
    $$("[data-vcue]").forEach(function (node) {
      var word = node.dataset.vcue || "Scroll";
      d.clear(node);
      node.classList.add("vcue");
      word.split("").forEach(function (ch) {
        node.appendChild(el("span", { text: ch }));
      });
    });
  }

  /* ---------------------------------------------------------------------- */

  function init() {
    buildVerticalCue();

    $$("[data-marquee]").forEach(buildMarquee);
    if (!bands.length) return;

    measureBands();
    /* Bodoni arrives after first paint and changes every run's width, so
       the measurement has to be taken again once it has. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureBands);
    }
    window.addEventListener("resize", measureBands, { passive: true });

    if (d.reducedMotion.matches) return;
    TOSS.scroll.onFrame = tickBands;
  }

  TOSS.story = { init: init, refresh: measureBands };
})();
