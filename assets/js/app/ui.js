/* ==========================================================================
   TOSS CLUB — Shell behaviour
   Navigation, drawer, scroll progress, reveals, counters, lightbox.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  function initNav() {
    var nav = $(".nav");
    var progress = $(".progress");
    var burger = $(".burger");
    var drawer = $(".drawer");
    var mobilebook = $(".mobilebook");
    var hero = $("#hero");
    var links = $$(".nav__link");
    var releaseTrap = null;
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        nav.classList.toggle("is-stuck", y > 24);
        if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
        if (mobilebook && hero) {
          mobilebook.classList.toggle("is-up", y > hero.offsetHeight * 0.7);
        }
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Drawer */
    function setDrawer(open) {
      if (!drawer || !burger) return;
      drawer.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("is-locked", open);
      /* The smoothing loop owns the scroll position, so it has to be told to
         let go while an overlay is up. */
      if (TOSS.scroll) { if (open) TOSS.scroll.stop(); else TOSS.scroll.start(); }
      if (open) {
        releaseTrap = d.trapFocus(drawer);
        var first = $(".drawer__link", drawer);
        if (first) first.focus();
      } else if (releaseTrap) {
        releaseTrap();
        releaseTrap = null;
        burger.focus();
      }
    }

    if (burger) burger.addEventListener("click", function () {
      setDrawer(burger.getAttribute("aria-expanded") !== "true");
    });

    if (drawer) {
      $$(".drawer__link, .drawer__foot .btn", drawer).forEach(function (a) {
        a.addEventListener("click", function () { setDrawer(false); });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false);
    });

    /* Current section marker in the nav */
    var targets = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    if (targets.length && "IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle("is-current", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      targets.forEach(function (t) { spy.observe(t); });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Reveals and counters                                                   */
  /* ---------------------------------------------------------------------- */

  function initReveals() {
    var blocks = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      blocks.forEach(function (b) { b.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        $$("[data-count]", entry.target).forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    blocks.forEach(function (b) { io.observe(b); });
  }

  /* Counts a number up once, when its block first comes into view. */
  function countUp(node) {
    if (node.dataset.counted) return;
    node.dataset.counted = "1";
    var target = parseFloat(node.dataset.count);
    var suffix = node.dataset.suffix || "";
    if (d.reducedMotion.matches) {
      node.textContent = target + suffix;
      return;
    }
    var start = performance.now();
    var dur = 1100;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------------- */
  /* Lightbox                                                               */
  /* ---------------------------------------------------------------------- */

  var lb = { root: null, items: [], index: 0, release: null, opener: null };

  function buildLightbox() {
    if (lb.root) return lb.root;
    var frame = el("div", { class: "lightbox__frame" });
    var cap = el("p", { class: "lightbox__cap" });
    var close = el("button", { class: "lightbox__close", type: "button", "aria-label": "Close gallery" });
    close.appendChild(d.icon("close"));
    var prev = el("button", { class: "lightbox__nav lightbox__nav--prev", type: "button", "aria-label": "Previous image" });
    prev.appendChild(d.icon("chevronLeft"));
    var next = el("button", { class: "lightbox__nav lightbox__nav--next", type: "button", "aria-label": "Next image" });
    next.appendChild(d.icon("chevronRight"));

    var inner = el("div", { style: "position:relative;width:min(1080px,100%)" }, [frame, prev, next, cap]);
    lb.root = el("div", {
      class: "lightbox", role: "dialog", "aria-modal": "true", "aria-label": "Club gallery"
    }, [close, inner]);

    close.addEventListener("click", closeLightbox);
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    lb.root.addEventListener("click", function (e) { if (e.target === lb.root) closeLightbox(); });

    lb.frame = frame;
    lb.cap = cap;
    document.body.appendChild(lb.root);
    return lb.root;
  }

  function paintLightbox() {
    var item = lb.items[lb.index];
    if (!item) return;
    TOSS.court.paint(lb.frame, item.plan, item.surface, item.photo, item.caption);
    lb.cap.textContent = item.caption + "  (" + (lb.index + 1) + " of " + lb.items.length + ")";
  }

  function step(delta) {
    lb.index = (lb.index + delta + lb.items.length) % lb.items.length;
    paintLightbox();
  }

  function onLightboxKey(e) {
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  }

  function openLightbox(items, index, opener) {
    buildLightbox();
    lb.items = items;
    lb.index = index;
    lb.opener = opener || null;
    paintLightbox();
    lb.root.classList.add("is-open");
    document.body.classList.add("is-locked");
    if (TOSS.scroll) TOSS.scroll.stop();
    lb.release = d.trapFocus(lb.root);
    document.addEventListener("keydown", onLightboxKey);
    $(".lightbox__close", lb.root).focus();
  }

  function closeLightbox() {
    if (!lb.root) return;
    lb.root.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (TOSS.scroll) TOSS.scroll.start();
    document.removeEventListener("keydown", onLightboxKey);
    if (lb.release) { lb.release(); lb.release = null; }
    if (lb.opener) { lb.opener.focus(); lb.opener = null; }
  }

  /* ---------------------------------------------------------------------- */

  TOSS.ui = {
    initNav: initNav,
    initReveals: initReveals,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox
  };
})();
