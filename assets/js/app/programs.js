/* ==========================================================================
   TOSS CLUB — Memberships, events, coaching
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;
  var api = TOSS.api;

  /* ======================================================================
     MEMBERSHIPS
     ====================================================================== */

  function initMemberships() {
    var grid = $("#plans");
    var table = $("#compareTable");
    if (!grid) return;

    api.getMemberships().then(function (plans) {
      d.clear(grid);

      plans.forEach(function (plan) {
        var perks = el("ul", { class: "plan__perks" });
        plan.perks.forEach(function (p) {
          var li = el("li", { class: "plan__perk" });
          li.appendChild(d.icon("check"));
          li.appendChild(el("span", { text: p }));
          perks.appendChild(li);
        });

        var cta = el("button", {
          class: "btn " + (plan.featured ? "btn--primary" : "btn--ghost") + " btn--block plan__cta",
          type: "button",
          text: plan.price === 0 ? "Play without joining" : "Join as " + plan.name.split(" ")[0]
        });
        cta.addEventListener("click", function () {
          api.subscribe(plan.id, {}).then(function () {
            d.toast(plan.price === 0
              ? "No membership needed — pick a sport below and book a court."
              : plan.name + " selected. Membership sign-up opens when accounts go live; call " +
                TOSS.club.phone + " to join today.");
            if (plan.price === 0) TOSS.booking.startWith(null);
          });
        });

        grid.appendChild(el("article", {
          class: "plan" + (plan.featured ? " plan--featured" : "")
        }, [
          plan.flag ? el("span", { class: "plan__flag", text: plan.flag }) : null,
          el("h3", { class: "plan__name", text: plan.name }),
          el("p", { class: "plan__for", text: plan.for }),
          el("div", { class: "plan__price" }, [
            el("span", { class: "plan__amount num", text: plan.price === 0 ? "Free" : d.fmtMoney(plan.price) }),
            el("span", { class: "plan__cycle", text: plan.cycle })
          ]),
          perks,
          cta
        ]));
      });

      if (table) paintCompare(table, plans);
    });
  }

  function paintCompare(table, plans) {
    d.clear(table);

    var head = el("thead", {}, [
      el("tr", {}, [el("th", { scope: "col", text: "What you get" })].concat(
        plans.map(function (p) { return el("th", { scope: "col", text: p.name }); })
      ))
    ]);

    var body = el("tbody");
    TOSS.compareRows.forEach(function (row) {
      var tr = el("tr", {}, [el("th", { scope: "row", text: row.label })]);
      plans.forEach(function (p) {
        var v = p.compare[row.key];
        var td;
        if (v === true) {
          td = el("td", { class: "yes" });
          td.appendChild(d.icon("check"));
          td.appendChild(el("span", { class: "visually-hidden", text: "Included" }));
          td.firstChild.setAttribute("width", "18");
          td.firstChild.setAttribute("height", "18");
          td.firstChild.style.display = "inline-block";
        } else if (v === false) {
          td = el("td", { class: "no", text: "Not included" });
        } else {
          td = el("td", { text: v });
        }
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });

    table.appendChild(head);
    table.appendChild(body);
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */

  function initEvents() {
    var list = $("#eventList");
    var filters = $("#eventFilters");
    var countOut = $("#eventCount");
    if (!list) return;

    var active = "all";
    var all = [];

    function paint() {
      d.clear(list);
      var shown = all.filter(function (ev) {
        return active === "all" || ev.sport === active || (active === "all-sports" && ev.sport === "all");
      });

      if (!shown.length) {
        list.appendChild(el("p", {
          class: "prose",
          style: "padding:var(--s-7) 0",
          text: "Nothing scheduled for that sport yet. Tell us what you want to play and we will put it on — " +
                TOSS.club.email + "."
        }));
      }

      shown.forEach(function (ev) {
        var fill = ev.slotsLeft / ev.slots;
        var bar = el("div", {
          class: "slotsbar" + (ev.state === "closed" ? " slotsbar--closed" : (ev.state === "tight" ? " slotsbar--tight" : "")),
          style: "--fill:" + (ev.state === "closed" ? 1 : fill)
        }, [el("i")]);

        var cta = el("button", {
          class: "btn " + (ev.state === "closed" ? "btn--ink" : "btn--solid-ink") + " btn--sm",
          type: "button",
          text: ev.state === "closed" ? "Join the waiting list" : "Register"
        });
        cta.addEventListener("click", function () {
          api.registerForEvent(ev.id, {}).then(function () {
            d.toast(ev.state === "closed"
              ? "You are on the waiting list for " + ev.name + ". We will message you if a place opens."
              : "Place held for " + ev.name + ". Payment opens when the gateway is connected.");
          });
        });

        var facts = el("dl", { class: "eventrow__facts" }, [
          el("div", { class: "eventrow__fact" }, [
            el("dt", { text: "Entry" }),
            el("dd", { class: "num", text: d.fmtMoney(ev.fee) + " " + ev.feeNote })
          ]),
          el("div", { class: "eventrow__fact" }, [
            el("dt", { text: "Places left" }),
            el("dd", { class: "num", text: ev.slotsLeft + " of " + ev.slots })
          ])
        ]);

        list.appendChild(el("article", { class: "eventrow" }, [
          el("div", { class: "eventrow__date" }, [
            el("span", { class: "eventrow__day num", text: String(ev.day) }),
            el("span", { class: "eventrow__mon", text: ev.month + ", " + ev.weekday })
          ]),
          el("div", { class: "eventrow__main" }, [
            el("h3", { class: "eventrow__name", text: ev.name }),
            el("p", { class: "eventrow__note", text: ev.note }),
            el("div", { class: "eventrow__tags" }, [
              el("span", { class: "tag", text: ev.type }),
              el("span", { class: "tag", text: ev.sportName }),
              el("span", { class: "tag", text: ev.time }),
              el("span", { class: "tag", text: ev.venue })
            ])
          ]),
          el("div", { class: "eventrow__side" }, [
            facts,
            bar,
            d.statePill(ev.state, ev.state === "closed" ? "Full" : (ev.state === "tight" ? "Almost full" : "Places available")),
            cta
          ])
        ]));
      });

      if (countOut) {
        countOut.textContent = shown.length + (shown.length === 1 ? " event" : " events");
      }

      /* The section may already have revealed; make sure the new bars fill. */
      var section = list.closest("[data-reveal]");
      if (section && section.classList.contains("is-in")) {
        requestAnimationFrame(function () {
          $$(".slotsbar i", list).forEach(function (i) { i.style.transform = ""; });
        });
      }
    }

    if (filters) {
      var opts = [{ id: "all", name: "Everything" }]
        .concat(TOSS.sports.map(function (s) { return { id: s.id, name: s.name }; }))
        .concat([{ id: "all-sports", name: "Multi-sport" }]);

      opts.forEach(function (o) {
        var chip = el("button", {
          class: "chip", type: "button",
          "aria-pressed": String(o.id === active),
          text: o.name
        });
        chip.addEventListener("click", function () {
          active = o.id;
          $$(".chip", filters).forEach(function (c) {
            c.setAttribute("aria-pressed", String(c === chip));
          });
          paint();
        });
        filters.appendChild(chip);
      });
    }

    api.getEvents().then(function (events) { all = events; paint(); });
  }

  /* ======================================================================
     COACHING
     ====================================================================== */

  function initCoaching() {
    var progGrid = $("#programs");
    var coachGrid = $("#coaches");

    if (progGrid) {
      api.getPrograms().then(function (programs) {
        d.clear(progGrid);
        programs.forEach(function (p) {
          var level = el("span", {
            class: "program__level", role: "img",
            "aria-label": "Level " + p.level + " of 3"
          });
          for (var i = 1; i <= 3; i++) {
            level.appendChild(el("i", { class: i <= p.level ? "is-on" : "" }));
          }

          var cta = el("button", { class: "link", type: "button", text: "Book this programme" });
          cta.appendChild(d.icon("arrow"));
          cta.querySelector("svg").setAttribute("width", "16");
          cta.querySelector("svg").setAttribute("height", "16");
          cta.addEventListener("click", function () {
            api.bookCoachingSession(null, { programId: p.id }).then(function () {
              d.toast(p.name + " requested. A coach will call you within a day to place you.");
            });
          });

          progGrid.appendChild(el("article", { class: "program" }, [
            level,
            el("h3", { class: "program__name", text: p.name }),
            el("p", { class: "program__note", text: p.note }),
            el("div", { class: "program__foot" }, [
              el("span", { class: "dim", text: p.format }),
              el("span", { class: "program__price num", text: d.fmtMoney(p.price) + " " + p.cycle })
            ]),
            cta
          ]));
        });
      });
    }

    if (coachGrid) {
      api.getCoaches().then(function (coaches) {
        d.clear(coachGrid);
        var base = coachGrid.dataset.photoBase || "";
        coaches.forEach(function (c) {
          var plate = el("div", { class: "coach__plate" });
          var sportKey = c.sport.toLowerCase().indexOf("padel") >= 0 ? "padel"
                       : c.sport.toLowerCase().indexOf("badminton") >= 0 ? "badminton"
                       : c.sport.toLowerCase().indexOf("table") >= 0 ? "tabletennis"
                       : c.sport.toLowerCase().indexOf("basketball") >= 0 ? "basketball"
                       : c.sport.toLowerCase().indexOf("football") >= 0 ? "football"
                       : "pickleball";
          var surf = { padel: "#12435E", badminton: "#8A5A2B", tabletennis: "#14406B",
                       basketball: "#9A6224", football: "#1E5B2E", pickleball: "#0E5C63" }[sportKey];

          TOSS.court.paint(plate, sportKey, surf, base ? base + c.id + ".jpg" : "", "Coach " + c.name);
          plate.classList.remove("plate");
          plate.classList.add("coach__plate", "unmask", "unmask--md");
          plate.appendChild(el("span", { class: "coach__initials", text: d.initials(c.name) }));
          plate.appendChild(el("span", { class: "coach__badge", text: c.badge }));

          var cta = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Book a session" });
          cta.addEventListener("click", function () {
            api.bookCoachingSession(c.id, {}).then(function () {
              d.toast("Session requested with " + c.name + ". They will confirm a time with you directly.");
            });
          });

          coachGrid.appendChild(el("article", { class: "coach" }, [
            plate,
            el("div", {}, [
              el("h3", { class: "coach__name", text: c.name }),
              el("span", { class: "coach__role", text: c.sport })
            ]),
            el("p", { class: "coach__bio", text: c.bio }),
            el("div", { class: "coach__foot" }, [
              el("span", { class: "micro dim", text: c.years + " years coaching" }),
              cta
            ])
          ]));
        });
        if (TOSS.scroll) TOSS.scroll.refresh(coachGrid);
      });
    }
  }

  /* Namespaced as programsUI, not programs: TOSS.programs is the coaching
     programme data this module reads through the service layer. */
  TOSS.programsUI = {
    initMemberships: initMemberships,
    initEvents: initEvents,
    initCoaching: initCoaching
  };
})();
