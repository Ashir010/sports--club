/* ==========================================================================
   TOSS CLUB — The prologue
   --------------------------------------------------------------------------
   The cover and the three chapters of the day. This file only paints the
   court drawings and keeps the chapter bookmark honest; the pinning is CSS
   position: sticky and the scrubbing is the `--t` / `--f` variables that
   the scroll loop writes onto each scene.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;

  /* ---------------------------------------------------------------------- */
  /* Cover — the six court plans, dissolving into one another               */
  /* ---------------------------------------------------------------------- */

  function initCover() {
    var stage = $("#coverArt");
    var nameOut = $("#coverPlanName");
    if (!stage) return;

    var sports = TOSS.sports || [];
    if (!sports.length) return;

    /* Two layers alternating, so a plan is always fully drawn before the
       one under it is taken away. */
    var layers = [
      el("div", { class: "cover__art", "aria-hidden": "true" }),
      el("div", { class: "cover__art", "aria-hidden": "true" })
    ];
    layers.forEach(function (layer) { stage.appendChild(layer); });

    var index = 0;
    var front = 0;
    var timer = null;

    function show(i) {
      index = (i + sports.length) % sports.length;
      var sport = sports[index];
      var next = (front + 1) % 2;

      TOSS.court.paint(layers[next], sport.plan, sport.surface, "", "", { veil: false });
      layers[next].classList.add("is-on");
      layers[front].classList.remove("is-on");
      front = next;

      if (nameOut) nameOut.textContent = sport.name;
    }

    show(0);
    /* The first paint has to land in the front layer too, or the opening
       frame is a single drawing fading in over nothing. */
    layers[(front + 1) % 2].classList.remove("is-on");

    if (d.reducedMotion.matches) return;

    function start() {
      if (timer) return;
      timer = window.setInterval(function () { show(index + 1); }, 4600);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    start();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Chapter backdrops                                                      */
  /* ---------------------------------------------------------------------- */
  /* Each chapter names its own court plan in the markup, so the story can
     be reordered in index.html without touching this file.                 */

  function initBackdrops() {
    $$("[data-plan]").forEach(function (node) {
      TOSS.court.paint(node, node.dataset.plan, node.dataset.surface, "", "", { veil: false });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Chapter bookmark                                                       */
  /* ---------------------------------------------------------------------- */

  function initBookmark() {
    var chapters = $$(".chapter");
    if (!chapters.length) return;
    if (d.reducedMotion.matches) return;

    var num = el("span", { class: "bookmark__num" });
    var name = el("span", { class: "bookmark__name" });
    var mark = el("div", { class: "bookmark", "aria-hidden": "true" }, [num, name]);
    document.body.appendChild(mark);

    var current = null;

    /* The scroll loop already knows which scene is live and how far through
       it we are; the bookmark just reads that off. */
    TOSS.scroll.onScene = function (scene) {
      var node = scene && scene.node;
      var isChapter = node && node.classList.contains("chapter");

      mark.classList.toggle("is-on", !!isChapter);
      if (!isChapter) { current = null; return; }
      if (node === current) return;

      current = node;
      num.textContent = node.dataset.num || "";
      name.textContent = node.dataset.name || "";
      mark.classList.toggle("is-onlight", node.classList.contains("chapter--light"));
    };
  }

  function init() {
    initCover();
    initBackdrops();
    initBookmark();
  }

  TOSS.prologue = { init: init };
})();
