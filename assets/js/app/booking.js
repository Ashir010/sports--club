/* ==========================================================================
   TOSS CLUB — Court booking
   --------------------------------------------------------------------------
   Six steps: sport, court, date, time and length, your details, confirm.
   All availability and pricing comes from TOSS.api, so pointing the service
   layer at a live backend makes this flow real without touching this file.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, el = d.el;
  var api = TOSS.api;
  var H = api.helpers;

  var STEPS = [
    { id: "sport",    label: "Sport" },
    { id: "court",    label: "Court" },
    { id: "date",     label: "Date" },
    { id: "time",     label: "Time & length" },
    { id: "details",  label: "Your details" },
    { id: "confirm",  label: "Confirm & pay" }
  ];

  var DURATIONS = [
    { mins: 60,  label: "1 hour" },
    { mins: 90,  label: "1 hr 30" },
    { mins: 120, label: "2 hours" }
  ];

  var state = {
    step: 0,
    reached: 0,
    sportId: null,
    courtId: null,
    date: null,
    start: null,
    duration: 60,
    membership: "casual",
    details: { name: "", phone: "", email: "", players: "2", notes: "" },
    availability: null,
    dateWindow: null,
    quote: null,
    booking: null
  };

  var nodes = {};

  /* ---------------------------------------------------------------------- */
  /* Derived helpers                                                        */
  /* ---------------------------------------------------------------------- */

  function sport() {
    return TOSS.sports.filter(function (s) { return s.id === state.sportId; })[0] || null;
  }

  function court() {
    var s = sport();
    if (!s) return null;
    return s.courts.filter(function (c) { return c.id === state.courtId; })[0] || null;
  }

  /* A booking of 90 or 120 minutes needs every half-slot inside it free.
     The composite state is the worst state in the run. */
  function runState(startMins) {
    if (!state.availability) return "closed";
    var need = state.duration / H.step;
    var worst = "open";
    for (var i = 0; i < need; i++) {
      var slot = state.availability.slots.filter(function (s) {
        return s.start === startMins + i * H.step;
      })[0];
      if (!slot || slot.state === "closed") return "closed";
      if (slot.state === "tight") worst = "tight";
    }
    return worst;
  }

  function durationLabel() {
    var match = DURATIONS.filter(function (x) { return x.mins === state.duration; })[0];
    return match ? match.label : (state.duration + " min");
  }

  function endLabel() {
    if (state.start === null) return "";
    return H.minsToLabel(state.start + state.duration);
  }

  function stepValue(id) {
    switch (id) {
      case "sport":   return sport() ? sport().name : "";
      case "court":   return court() ? court().name : "";
      case "date":    return state.date ? formatDate(state.date) : "";
      case "time":    return state.start !== null
                        ? H.minsToLabel(state.start) + "–" + endLabel()
                        : "";
      case "details": return state.details.name || "";
      case "confirm": return state.booking ? state.booking.reference : "";
      default: return "";
    }
  }

  function formatDate(iso) {
    var dt = new Date(iso + "T00:00:00");
    return dt.toLocaleDateString(TOSS.club.locale, { weekday: "short", day: "numeric", month: "short" });
  }

  function canAdvance(from) {
    switch (STEPS[from].id) {
      case "sport":   return !!state.sportId;
      case "court":   return !!state.courtId;
      case "date":    return !!state.date;
      case "time":    return state.start !== null;
      case "details": return validateDetails(false);
      default: return true;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Stepper                                                                */
  /* ---------------------------------------------------------------------- */

  function paintStepper() {
    d.clear(nodes.stepper);
    STEPS.forEach(function (s, i) {
      var reachable = i <= state.reached;
      var btn = el("button", {
        class: "stepper__step" +
          (i === state.step ? " is-current" : "") +
          (i < state.reached && stepValue(s.id) ? " is-done" : ""),
        type: "button",
        role: "tab",
        "aria-selected": String(i === state.step),
        disabled: !reachable
      }, [
        el("span", { class: "stepper__n", text: "Step " + (i + 1) }),
        el("span", { class: "stepper__label", text: s.label }),
        el("span", { class: "stepper__value", text: stepValue(s.id) })
      ]);
      btn.addEventListener("click", function () { if (reachable) go(i); });
      nodes.stepper.appendChild(btn);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Steps                                                                  */
  /* ---------------------------------------------------------------------- */

  function stepHead(title, hint) {
    return el("div", { class: "bookstep__head" }, [
      el("h3", { class: "bookstep__title", text: title }),
      el("p", { class: "bookstep__hint", text: hint })
    ]);
  }

  function paintSportStep(wrap) {
    wrap.appendChild(stepHead(
      "Which sport are you playing?",
      "Rates shown are the off-peak hourly rate. Peak is 18:00 to 22:00."
    ));
    var grid = el("div", { class: "optgrid optgrid--wide" });
    TOSS.sports.forEach(function (s) {
      var opt = el("button", {
        class: "opt", type: "button",
        "aria-pressed": String(state.sportId === s.id)
      }, [
        el("span", { class: "opt__swatch", style: "background:" + s.surface }),
        el("span", { class: "opt__name", text: s.name }),
        el("span", { class: "opt__note", text: s.courts.length + " courts, " + s.players }),
        el("span", { class: "opt__price", text: "from " + d.fmtMoney(s.rate) + " / hour" })
      ]);
      opt.addEventListener("click", function () {
        state.sportId = s.id;
        state.courtId = null;
        state.start = null;
        state.availability = null;
        go(1);
      });
      grid.appendChild(opt);
    });
    wrap.appendChild(grid);
  }

  function paintCourtStep(wrap) {
    var s = sport();
    wrap.appendChild(stepHead(
      "Pick a court",
      s ? "All " + s.name.toLowerCase() + " courts share the same rate. Pick the one you like."
        : "Choose a sport first."
    ));
    if (!s) return;
    var grid = el("div", { class: "optgrid optgrid--wide" });
    s.courts.forEach(function (c) {
      var opt = el("button", {
        class: "opt", type: "button",
        "aria-pressed": String(state.courtId === c.id)
      }, [
        el("span", { class: "opt__name", text: c.name }),
        el("span", { class: "opt__note", text: c.note })
      ]);
      opt.addEventListener("click", function () {
        state.courtId = c.id;
        state.start = null;
        state.availability = null;
        go(2);
      });
      grid.appendChild(opt);
    });
    wrap.appendChild(grid);
  }

  function paintDateStep(wrap) {
    wrap.appendChild(stepHead(
      "Choose a day",
      "You can book 14 days out as a casual player, and up to 21 days as a Premium member."
    ));
    var rail = el("div", {
      class: "daterail", role: "group", "aria-label": "Booking dates", "data-lenis-prevent": true
    });
    wrap.appendChild(rail);

    function paint(days) {
      d.clear(rail);
      days.forEach(function (day) {
        var b = el("button", {
          class: "dayblock", type: "button",
          "aria-pressed": String(state.date === day.iso),
          "aria-label": day.dow + " " + day.day + " " + day.month
        }, [
          el("span", { class: "dayblock__dow", text: day.isToday ? "Today" : day.dow }),
          el("span", { class: "dayblock__num num", text: String(day.day) }),
          el("span", { class: "dayblock__mon", text: day.month })
        ]);
        b.addEventListener("click", function () {
          state.date = day.iso;
          state.start = null;
          state.availability = null;
          go(3);
        });
        rail.appendChild(b);
      });
    }

    if (state.dateWindow) paint(state.dateWindow);
    else api.getDateWindow(14).then(function (days) { state.dateWindow = days; paint(days); });
  }

  function paintTimeStep(wrap) {
    wrap.appendChild(stepHead(
      "How long, and when?",
      "Availability updates as you change the length of your booking."
    ));

    /* Length */
    var lengths = el("div", { class: "chiprow", role: "group", "aria-label": "Booking length" });
    DURATIONS.forEach(function (dur) {
      var c = el("button", {
        class: "chip", type: "button",
        "aria-pressed": String(state.duration === dur.mins),
        text: dur.label
      });
      c.addEventListener("click", function () {
        state.duration = dur.mins;
        if (state.start !== null && runState(state.start) === "closed") state.start = null;
        render();
      });
      lengths.appendChild(c);
    });
    wrap.appendChild(el("div", { class: "field" }, [
      el("span", { class: "field__label", text: "Length" }),
      lengths
    ]));

    /* Legend — states are named, not only coloured */
    var legend = el("div", { class: "slotlegend" }, [
      d.statePill("open", "Available"),
      d.statePill("tight", "Almost full"),
      d.statePill("closed", "Unavailable")
    ]);

    var grid = el("div", { class: "slotgrid", role: "group", "aria-label": "Start times" });
    var status = el("p", { class: "bookstep__hint", "aria-live": "polite" });

    wrap.appendChild(el("div", { class: "field" }, [
      el("span", { class: "field__label", text: "Start time" }),
      legend,
      grid,
      status
    ]));

    function paintSlots() {
      d.clear(grid);
      var open = 0;
      state.availability.slots.forEach(function (slot) {
        if (slot.start + state.duration > 24 * 60) return;
        var st = runState(slot.start);
        if (st !== "closed") open++;
        var b = el("button", {
          class: "slot slot--" + st, type: "button",
          "aria-pressed": String(state.start === slot.start),
          disabled: st === "closed",
          "aria-label": slot.label + " to " + H.minsToLabel(slot.start + state.duration) +
            ", " + d.slugState(st) + (slot.peak ? ", peak rate" : "")
        }, [
          el("span", { class: "slot__time num", text: slot.label }),
          el("span", { class: "slot__state", text: d.slugState(st) })
        ]);
        b.addEventListener("click", function () {
          state.start = slot.start;
          refreshQuote();
          render();
        });
        grid.appendChild(b);
      });
      var courtName = court() ? court().name.toLowerCase() : "this court";
      if (open === 0) {
        /* A fully booked day is a dead end unless we offer the way out of it. */
        status.textContent = "";
        var msg = el("div", { class: "receipt", style: "margin-top:var(--s-4)" }, [
          el("strong", { text: state.date === H.todayISO()
            ? "Nothing left on " + courtName + " today."
            : "Nothing left on " + courtName + " that day." }),
          el("p", {
            class: "bookstep__hint",
            text: "Try a shorter booking, another court, or the next day — the club runs from " +
                  "06:00 to midnight and mornings are usually wide open."
          })
        ]);
        var jump = el("button", { class: "btn btn--solid-ink btn--sm", type: "button", text: "Try the next day" });
        jump.addEventListener("click", function () {
          if (!state.dateWindow) return;
          var i = 0;
          state.dateWindow.forEach(function (day, di) { if (day.iso === state.date) i = di; });
          var next = state.dateWindow[Math.min(i + 1, state.dateWindow.length - 1)];
          state.date = next.iso;
          state.start = null;
          state.availability = null;
          render();
        });
        var other = el("button", { class: "btn btn--ink btn--sm", type: "button", text: "Pick another court" });
        other.addEventListener("click", function () { go(1); });
        msg.appendChild(el("div", { class: "chiprow" }, [jump, other]));
        grid.after(msg);
        return;
      }
      status.textContent = open + " start times available on " + courtName +
        " for a booking of " + durationLabel().toLowerCase() + ".";
    }

    if (state.availability && state.availability.courtId === state.courtId &&
        state.availability.date === state.date) {
      paintSlots();
    } else {
      status.textContent = "Checking availability…";
      api.getAvailability(state.courtId, state.date).then(function (data) {
        state.availability = data;
        paintSlots();
      });
    }
  }

  function paintDetailsStep(wrap) {
    wrap.appendChild(stepHead(
      "Who is playing?",
      "We send the booking code to this number and email. One name is enough — bring whoever you like."
    ));

    function field(name, label, opts) {
      var o = opts || {};
      var input = el(o.tag || "input", {
        class: o.tag === "textarea" ? "textarea" : (o.tag === "select" ? "select" : "input"),
        id: "bk-" + name,
        name: name,
        type: o.type || "text",
        inputmode: o.inputmode,
        autocomplete: o.autocomplete,
        placeholder: o.placeholder,
        value: state.details[name] || ""
      }, o.options || []);
      /* select and textarea take their value as a property, not an attribute. */
      input.value = state.details[name] || o.defaultValue || "";

      var wrapper = el("div", { class: "field", dataset: { field: name } }, [
        el("label", { class: "field__label", for: "bk-" + name, text: label }),
        input,
        o.hint ? el("span", { class: "field__hint", text: o.hint }) : null,
        el("span", { class: "field__error", role: "alert", text: o.error || "This is required." })
      ]);

      input.addEventListener("input", function () {
        state.details[name] = input.value;
        wrapper.classList.remove("is-invalid");
        paintSummary();
      });
      input.addEventListener("change", function () {
        state.details[name] = input.value;
        paintSummary();
      });
      return wrapper;
    }

    var s = sport();
    var playerOpts = [];
    var maxPlayers = s && s.id === "football" ? 14 : (s && s.id === "basketball" ? 10 : 4);
    for (var i = 1; i <= maxPlayers; i++) {
      playerOpts.push(el("option", { value: String(i), text: String(i) }));
    }

    wrap.appendChild(el("div", { class: "formgrid formgrid--2" }, [
      field("name", "Your name", { autocomplete: "name", placeholder: "Ananya Rao" }),
      field("phone", "Mobile number", {
        type: "tel", inputmode: "tel", autocomplete: "tel", placeholder: "+91 98450 00000",
        error: "Enter a number we can reach you on."
      })
    ]));

    wrap.appendChild(el("div", { class: "formgrid formgrid--2" }, [
      field("email", "Email", {
        type: "email", inputmode: "email", autocomplete: "email", placeholder: "you@example.com",
        error: "Enter a valid email address."
      }),
      field("players", "Players including you", { tag: "select", options: playerOpts, defaultValue: "2" })
    ]));

    /* Booking as — this is what applies the member discount to the quote. */
    var tierSelect = el("select", { class: "select", id: "bk-tier" },
      TOSS.memberships.map(function (m) {
        return el("option", { value: m.id, text: m.name + (m.price ? "" : " (no membership)") });
      })
    );
    tierSelect.value = state.membership;
    tierSelect.addEventListener("change", function () {
      state.membership = tierSelect.value;
      refreshQuote();
    });

    wrap.appendChild(el("div", { class: "field" }, [
      el("label", { class: "field__label", for: "bk-tier", text: "Booking as" }),
      tierSelect,
      el("span", { class: "field__hint", text: "Your membership discount is applied to the total before you pay." })
    ]));

    wrap.appendChild(field("notes", "Anything we should know?", {
      tag: "textarea",
      placeholder: "First visit, need rackets, arriving with a group of six…",
      hint: "Optional. Tell us about access needs here and a host will meet you at the entrance."
    }));
  }

  function validateDetails(showErrors) {
    var ok = true;
    var checks = [
      { name: "name",  valid: state.details.name.trim().length > 1 },
      { name: "phone", valid: /^[+\d][\d\s-]{7,}$/.test(state.details.phone.trim()) },
      { name: "email", valid: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.details.email.trim()) }
    ];
    checks.forEach(function (c) {
      if (!c.valid) ok = false;
      if (showErrors) {
        var f = nodes.panel.querySelector('[data-field="' + c.name + '"]');
        if (f) f.classList.toggle("is-invalid", !c.valid);
      }
    });
    if (showErrors && !ok) {
      var firstBad = nodes.panel.querySelector(".field.is-invalid .input");
      if (firstBad) firstBad.focus();
    }
    return ok;
  }

  function paintConfirmStep(wrap) {
    if (state.booking) {
      wrap.appendChild(stepHead(
        "Court held. One step left.",
        "Your slot is reserved for the next ten minutes while payment completes."
      ));
      wrap.appendChild(el("div", { class: "receipt" }, [
        el("span", { class: "bookstep__hint", text: "Booking reference" }),
        el("strong", { class: "receipt__ref num", text: state.booking.reference }),
        el("p", {
          class: "bookstep__hint",
          text: sport().name + " · " + court().name + " · " + formatDate(state.date) + " · " +
                H.minsToLabel(state.start) + "–" + endLabel()
        }),
        el("p", {
          class: "bookstep__hint",
          text: "Payment is not connected in this build. In production this hands off to the " +
                "gateway and returns here with a paid booking and a confirmation on WhatsApp."
        })
      ]));
      var again = el("button", { class: "btn btn--ink", type: "button", text: "Make another booking" });
      again.addEventListener("click", reset);
      wrap.appendChild(again);
      return;
    }

    wrap.appendChild(stepHead(
      "Check and pay",
      "Free cancellation up to 12 hours before your slot, or 2 hours as a Premium member."
    ));

    var rows = el("dl", { class: "summary__rows", style: "color:var(--ink)" });
    [
      ["Sport", sport() ? sport().name : "—"],
      ["Court", court() ? court().name : "—"],
      ["Date", state.date ? formatDate(state.date) : "—"],
      ["Time", state.start !== null ? H.minsToLabel(state.start) + " – " + endLabel() : "—"],
      ["Length", durationLabel()],
      ["Players", state.details.players || "2"],
      ["Name", state.details.name || "—"],
      ["Mobile", state.details.phone || "—"],
      ["Email", state.details.email || "—"]
    ].forEach(function (r) {
      var row = el("div", { class: "summary__row" }, [
        el("dt", { text: r[0], style: "color:var(--slate)" }),
        el("dd", { text: r[1] })
      ]);
      row.style.borderBottomColor = "var(--line-ink)";
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    if (state.details.notes) {
      wrap.appendChild(el("p", { class: "bookstep__hint", text: "Your note: " + state.details.notes }));
    }

    var pay = el("button", { class: "btn btn--solid-ink btn--lg", type: "button", text: "Pay and confirm" });
    pay.addEventListener("click", function () {
      pay.disabled = true;
      pay.textContent = "Holding your court…";
      api.createBooking({
        sportId: state.sportId,
        courtId: state.courtId,
        date: state.date,
        start: state.start,
        duration: state.duration,
        membership: state.membership,
        player: state.details,
        quote: state.quote
      }).then(function (booking) {
        state.booking = booking;
        return api.createPaymentIntent(booking.id, state.quote ? state.quote.total : 0);
      }).then(function (intent) {
        d.toast("Court held as " + state.booking.reference + ". " + intent.message);
        render();
      }).catch(function () {
        pay.disabled = false;
        pay.textContent = "Pay and confirm";
        d.toast("That did not go through. Try again, or call the club on " + TOSS.club.phone + ".");
      });
    });
    wrap.appendChild(pay);
  }

  /* ---------------------------------------------------------------------- */
  /* Summary rail                                                           */
  /* ---------------------------------------------------------------------- */

  function paintSummary() {
    var box = nodes.summary;
    d.clear(box);

    box.appendChild(el("h3", { class: "summary__title", text: "Your booking" }));

    var rows = el("dl", { class: "summary__rows" });
    [
      ["Sport", sport() ? sport().name : "Not chosen"],
      ["Court", court() ? court().name : "Not chosen"],
      ["Date", state.date ? formatDate(state.date) : "Not chosen"],
      ["Time", state.start !== null ? H.minsToLabel(state.start) + " – " + endLabel() : "Not chosen"],
      ["Length", (state.duration / 60) + " hours"]
    ].forEach(function (r) {
      rows.appendChild(el("div", { class: "summary__row" }, [
        el("dt", { text: r[0] }),
        el("dd", { text: r[1] })
      ]));
    });

    if (state.quote) {
      rows.appendChild(el("div", { class: "summary__row" }, [
        el("dt", { text: "Court hire" }),
        el("dd", { class: "num", text: d.fmtMoney(state.quote.subtotal) })
      ]));
      if (state.quote.discount) {
        rows.appendChild(el("div", { class: "summary__row" }, [
          el("dt", { text: state.quote.discountLabel }),
          el("dd", { class: "num", text: "−" + d.fmtMoney(state.quote.discount) })
        ]));
      }
      rows.appendChild(el("div", { class: "summary__row" }, [
        el("dt", { text: state.quote.taxLabel }),
        el("dd", { class: "num", text: d.fmtMoney(state.quote.tax) })
      ]));
    }
    box.appendChild(rows);

    var total = el("b", { class: "num", text: state.quote ? d.fmtMoney(state.quote.total) : "Not yet" });
    if (!state.quote) {
      total.style.color = "rgba(232,235,226,.42)";
      total.style.fontSize = "1.1rem";
    }
    box.appendChild(el("div", { class: "summary__total" }, [
      el("span", { text: "Total" }),
      total
    ]));

    box.appendChild(el("p", {
      class: "summary__note",
      text: state.start === null
        ? "Pick a time to see the price. Peak hours are 18:00 to 22:00."
        : "Includes taxes. Cancel free up to 12 hours before you play."
    }));
  }

  function refreshQuote() {
    if (!state.sportId || !state.courtId || !state.date || state.start === null) {
      state.quote = null;
      paintSummary();
      return Promise.resolve(null);
    }
    return api.getQuote({
      sportId: state.sportId,
      courtId: state.courtId,
      date: state.date,
      start: state.start,
      duration: state.duration,
      membership: state.membership
    }).then(function (q) {
      state.quote = q;
      paintSummary();
      return q;
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Render loop                                                            */
  /* ---------------------------------------------------------------------- */

  function render() {
    paintStepper();
    d.clear(nodes.panel);

    var wrap = el("div", { class: "bookstep is-active", role: "tabpanel" });
    var id = STEPS[state.step].id;

    if (id === "sport") paintSportStep(wrap);
    else if (id === "court") paintCourtStep(wrap);
    else if (id === "date") paintDateStep(wrap);
    else if (id === "time") paintTimeStep(wrap);
    else if (id === "details") paintDetailsStep(wrap);
    else paintConfirmStep(wrap);

    if (id !== "confirm" || !state.booking) {
      var back = el("button", {
        class: "btn btn--ink", type: "button", text: "Back",
        disabled: state.step === 0
      });
      back.addEventListener("click", function () { go(state.step - 1); });

      var next = el("button", {
        class: "btn btn--primary", type: "button",
        text: STEPS[state.step + 1] ? "Continue to " + STEPS[state.step + 1].label.toLowerCase() : "Continue"
      });
      next.addEventListener("click", function () {
        if (id === "details" && !validateDetails(true)) return;
        if (!canAdvance(state.step)) {
          d.toast("Choose a " + STEPS[state.step].label.toLowerCase() + " to carry on.");
          return;
        }
        go(state.step + 1);
      });

      if (id !== "confirm") wrap.appendChild(el("div", { class: "bookactions" }, [back, next]));
      else wrap.appendChild(el("div", { class: "bookactions" }, [back]));
    }

    nodes.panel.appendChild(wrap);
    paintSummary();
  }

  function go(index) {
    if (index < 0 || index >= STEPS.length) return;
    if (index > state.step && !canAdvance(state.step)) return;
    state.step = index;
    state.reached = Math.max(state.reached, index);
    if (STEPS[index].id === "time" || STEPS[index].id === "confirm") refreshQuote();
    render();
  }

  function reset() {
    state.step = 0;
    state.reached = 0;
    state.sportId = null;
    state.courtId = null;
    state.start = null;
    state.availability = null;
    state.quote = null;
    state.booking = null;
    render();
  }

  /* Entry point used by every "Book now" on the page. */
  function startWith(sportId) {
    var section = $("#booking");
    if (sportId) {
      state.sportId = sportId;
      state.courtId = null;
      state.start = null;
      state.availability = null;
      state.booking = null;
      state.step = 1;
      state.reached = Math.max(state.reached, 1);
    }
    render();
    if (!section) return;
    if (TOSS.scroll) TOSS.scroll.to(section);
    else section.scrollIntoView({ behavior: d.reducedMotion.matches ? "auto" : "smooth", block: "start" });
  }

  function init() {
    nodes.stepper = $("#stepper");
    nodes.panel = $("#bookPanel");
    nodes.summary = $("#bookSummary");
    if (!nodes.stepper || !nodes.panel || !nodes.summary) return;
    render();
  }

  TOSS.booking = { init: init, startWith: startWith, state: state };
})();
