/* ==========================================================================
   TOSS CLUB — Discovery views
   Hero (live courts + rotating court plan), sports selector, facilities,
   gallery.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;
  var api = TOSS.api;

  /* ======================================================================
     HERO
     ====================================================================== */

  function initHero() {
    var plate = $("#heroPlate");
    var nameOut = $("#heroPlateName");
    var dotsOut = $("#heroDots");
    var timer = null;
    var index = 0;

    if (!plate) return;

    function show(i, announce) {
      index = (i + TOSS.sports.length) % TOSS.sports.length;
      var sport = TOSS.sports[index];
      TOSS.court.paint(plate, sport.plan, sport.surface,
        plate.dataset.photoBase ? plate.dataset.photoBase + sport.id + ".jpg" : "",
        sport.name + " court at Toss Club");
      if (nameOut) nameOut.textContent = sport.name;
      $$(".hero__dot", dotsOut).forEach(function (dot, di) {
        dot.classList.toggle("is-on", di === index);
        dot.setAttribute("aria-selected", String(di === index));
      });
      if (announce && nameOut) nameOut.setAttribute("aria-live", "polite");
    }

    if (dotsOut) {
      TOSS.sports.forEach(function (sport, i) {
        dotsOut.appendChild(el("button", {
          class: "hero__dot", type: "button", role: "tab",
          "aria-label": "Show the " + sport.name + " court",
          onclick: function () { stop(); show(i, true); }
        }));
      });
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    show(0);

    if (!d.reducedMotion.matches) {
      timer = setInterval(function () {
        if (document.hidden) return;
        show(index + 1);
      }, 5200);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
      });
    }
  }

  /* --- Live availability strip ------------------------------------------ */

  function initLiveBar() {
    var list = $("#liveList");
    var at = $("#liveAt");
    var mobileFree = $("#mobileFree");
    if (!list) return;

    function paint(rows) {
      d.clear(list);
      var totalFree = 0;
      rows.forEach(function (row) {
        totalFree += row.free;
        var cell = el("button", {
          class: "livecell", type: "button",
          "aria-label": "Book " + row.sportName + ". " +
            row.free + " of " + row.total + " courts free right now.",
          onclick: function () { TOSS.booking.startWith(row.sportId); }
        }, [
          el("span", { class: "livecell__sport", text: row.sportName }),
          d.statePill(row.state,
            row.free > 0 ? row.free + " of " + row.total + " free"
                         : (row.tight > 0 ? "Almost full" : "Fully booked"))
        ]);
        cell.querySelector(".state").classList.add("livecell__free");
        list.appendChild(cell);
      });
      if (at && rows.length) at.textContent = rows[0].at;
      if (mobileFree) {
        mobileFree.textContent = totalFree > 0
          ? totalFree + " courts free right now"
          : "Next free slot this evening";
      }
    }

    api.getLiveAvailability().then(paint);

    /* Refresh on a slow cadence so the strip stays honest without hammering
       the endpoint. A websocket replaces this when real-time ships. */
    setInterval(function () {
      if (!document.hidden) api.getLiveAvailability().then(paint);
    }, 120000);
  }

  /* ======================================================================
     SPORTS — a selector: names on the left, the chosen court on the right
     ====================================================================== */

  /* The sports section is a scroll story: a court holds still on the left
     while the six chapters pass on the right, and the drawing redraws as
     each one takes over. Below 1024px the stage is dropped and every chapter
     carries its own court instead. */
  function initSports() {
    var steps = $("#sportSteps");
    var jump = $("#sportJump");
    var plate = $("#storyPlate");
    var nowOut = $("#storyNow");
    var rateOut = $("#storyRate");
    if (!steps || !plate) return;

    var base = plate.dataset.photoBase || "";
    var current = null;
    var stepNodes = [];

    /* Two stacked layers so a sport crossfades into the next instead of
       blinking through an empty frame. */
    var layers = [
      el("div", { class: "story__layer is-on" }),
      el("div", { class: "story__layer" })
    ];
    layers.forEach(function (l) { plate.appendChild(l); });
    var counter = el("span", { class: "story__counter num", id: "storyCount", text: "1 of 6" });
    plate.appendChild(counter);
    var front = 0;

    function paintStage(sport, index) {
      var back = front === 0 ? 1 : 0;
      TOSS.court.paint(layers[back], sport.plan, sport.surface,
        base ? base + sport.id + ".jpg" : "", sport.name + " court at Toss Club");
      layers[back].classList.remove("plate");
      layers[back].classList.add("story__layer");
      layers[back].classList.add("is-on");
      layers[front].classList.remove("is-on");
      front = back;

      counter.textContent = (index + 1) + " of " + TOSS.sports.length;
      if (nowOut) nowOut.textContent = sport.name;
      if (rateOut) rateOut.textContent = "from " + d.fmtMoney(sport.rate) + " / hour";
      if (TOSS.scroll) TOSS.scroll.refresh(layers[back]);
    }

    function setActive(id) {
      if (id === current) return;
      current = id;
      var index = 0;
      TOSS.sports.forEach(function (s, i) { if (s.id === id) index = i; });
      var sport = TOSS.sports[index];

      stepNodes.forEach(function (node) {
        node.classList.toggle("is-live", node.dataset.sport === id);
      });
      $$(".chip", jump).forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.sport === id));
      });
      paintStage(sport, index);
    }

    /* --- Chapters ------------------------------------------------------- */

    TOSS.sports.forEach(function (sport, i) {
      var art = el("div", { class: "story__stepart unmask unmask--lg" });

      var facts = el("dl", { class: "story__facts" });
      [
        ["Players", sport.players],
        ["Session", sport.duration],
        ["Courts", sport.courts.length + " " + (sport.courts.length === 1 ? "court" : "courts")],
        ["Off-peak", d.fmtMoney(sport.rate) + " " + sport.unit],
        ["Peak, 18:00–22:00", d.fmtMoney(sport.peakRate) + " " + sport.unit],
        ["Good for", sport.level]
      ].forEach(function (row) {
        facts.appendChild(el("div", { class: "story__fact" }, [
          el("dt", { text: row[0] }),
          el("dd", { text: row[1] })
        ]));
      });

      var kit = el("div", { class: "story__kit" });
      sport.facilities.forEach(function (f) {
        var row = el("div", { class: "story__kitrow" });
        row.appendChild(d.icon("check"));
        row.appendChild(el("span", { text: f }));
        kit.appendChild(row);
      });

      var book = el("button", {
        class: "btn btn--primary", type: "button",
        text: "Book " + sport.name.toLowerCase()
      });
      book.addEventListener("click", function () { TOSS.booking.startWith(sport.id); });

      var explore = el("a", {
        class: "btn btn--ghost", href: "#facilities",
        text: "Explore the courts"
      });

      var step = el("article", {
        class: "story__step" + (i === 0 ? " is-live" : ""),
        id: "sport-" + sport.id,
        dataset: { sport: sport.id }
      }, [
        art,
        el("h3", { class: "story__name", text: sport.name }),
        el("p", { class: "story__blurb", text: sport.blurb }),
        facts,
        kit,
        el("div", { class: "story__actions" }, [book, explore])
      ]);

      TOSS.court.paint(art, sport.plan, sport.surface,
        base ? base + sport.id + ".jpg" : "", sport.name + " court");
      art.classList.remove("plate");
      art.classList.add("story__stepart", "unmask", "unmask--lg");

      steps.appendChild(step);
      stepNodes.push(step);

      /* Jump chip */
      if (jump) {
        var chip = el("button", {
          class: "chip", type: "button",
          "aria-pressed": String(i === 0),
          text: sport.name,
          dataset: { sport: sport.id }
        });
        chip.addEventListener("click", function () {
          if (TOSS.scroll) TOSS.scroll.to(step, { offset: -(window.innerHeight * 0.22) });
          setActive(sport.id);
        });
        jump.appendChild(chip);
      }
    });

    /* --- Which chapter owns the stage ----------------------------------- */

    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.dataset.sport);
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      stepNodes.forEach(function (n) { spy.observe(n); });
    }

    setActive(TOSS.sports[0].id);

    TOSS.sportsView = { select: setActive };
  }

  /* ======================================================================
     FACILITIES
     ====================================================================== */

  function initFacilities() {
    var grid = $("#facGrid");
    if (!grid) return;

    TOSS.facilities.forEach(function (fac) {
      var art = el("div", { class: "fac__art" });

      var specs = el("div", { class: "fac__specs" });
      fac.specs.forEach(function (s) { specs.appendChild(el("span", { class: "tag", text: s })); });

      var card = el("button", {
        class: "fac fac--" + fac.size + " plate unmask unmask--lg",
        type: "button",
        "data-cursor": "Open",
        "aria-label": fac.name + ". " + fac.note
      }, [
        art,
        el("div", { class: "plate__veil" }),
        el("div", { class: "fac__body" }, [
          el("span", { class: "fac__kind", text: fac.kind }),
          el("h3", { class: "fac__name", text: fac.name }),
          el("p", { class: "fac__note", text: fac.note }),
          specs
        ])
      ]);

      TOSS.court.paint(art, fac.plan, fac.surface,
        grid.dataset.photoBase ? grid.dataset.photoBase + fac.id + ".jpg" : "", "",
        { veil: false });
      art.classList.remove("plate");
      art.classList.add("fac__art");

      card.addEventListener("click", function () {
        TOSS.ui.openLightbox([{
          plan: fac.plan, surface: fac.surface, caption: fac.name + " — " + fac.note,
          photo: grid.dataset.photoBase ? grid.dataset.photoBase + fac.id + ".jpg" : ""
        }], 0, card);
      });

      grid.appendChild(card);
    });

    if (TOSS.scroll) TOSS.scroll.refresh(grid);
  }

  /* ======================================================================
     GALLERY
     ====================================================================== */

  function initGallery() {
    var grid = $("#galleryGrid");
    if (!grid) return;
    var base = grid.dataset.photoBase || "";

    var items = TOSS.gallery.map(function (g) {
      return {
        plan: g.plan, surface: g.surface, caption: g.caption,
        photo: base ? base + g.id + ".jpg" : ""
      };
    });

    TOSS.gallery.forEach(function (g, i) {
      var art = el("div", { class: "shot__art" });
      var shot = el("button", {
        class: "shot unmask unmask--sm" + (g.size ? " shot--" + g.size : ""),
        type: "button",
        "data-cursor": "View",
        "aria-label": "Open image: " + g.caption
      }, [
        art,
        el("div", { class: "plate__veil" }),
        el("span", { class: "shot__cap", text: g.caption })
      ]);
      TOSS.court.paint(art, g.plan, g.surface, items[i].photo, "", { veil: false });
      art.classList.remove("plate");
      art.classList.add("shot__art");
      shot.addEventListener("click", function () { TOSS.ui.openLightbox(items, i, shot); });
      grid.appendChild(shot);
    });

    if (TOSS.scroll) TOSS.scroll.refresh(grid);
  }

  TOSS.discover = {
    initHero: initHero,
    initLiveBar: initLiveBar,
    initSports: initSports,
    initFacilities: initFacilities,
    initGallery: initGallery
  };
})();
