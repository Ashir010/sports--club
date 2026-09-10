/* ==========================================================================
   TOSS CLUB — Service layer
   --------------------------------------------------------------------------
   Every piece of data the interface uses passes through TOSS.api. Nothing
   above this file touches TOSS.sports, TOSS.events and friends directly.

   To go live, set TOSS.api.config.mode = "live" and TOSS.api.config.baseUrl,
   then fill in the request() branch below. The method signatures, the shapes
   they resolve with, and the latency they simulate are all already what the
   interface expects, so no view code has to change.

   Endpoints this layer assumes on the backend:
     GET  /sports                         GET  /courts?sport=:id
     GET  /availability?court=:id&date=   GET  /quote?...
     POST /bookings                       POST /payments/intent
     GET  /memberships                    POST /memberships/:id/subscribe
     GET  /events                         POST /events/:id/registrations
     GET  /programs   GET /coaches        POST /coaching/sessions
     GET  /players?sport=&level=&when=    GET  /leaderboard?sport=
     GET  /reviews    GET /faq            POST /messages
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var config = {
    mode: "mock",                 // "mock" | "live"
    baseUrl: "/api/v1",
    latency: [140, 380],          // simulated round trip, ms
    token: null                   // set after auth; sent as Bearer
  };

  /* ---------------------------------------------------------------------- */
  /* Transport                                                              */
  /* ---------------------------------------------------------------------- */

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function simulate(value) {
    var lo = config.latency[0];
    var hi = config.latency[1];
    return wait(lo + Math.random() * (hi - lo)).then(function () { return value; });
  }

  function request(path, options) {
    // Live transport. Unused while mode === "mock".
    var opts = options || {};
    var headers = { "Content-Type": "application/json" };
    if (config.token) headers.Authorization = "Bearer " + config.token;

    return fetch(config.baseUrl + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error("Request failed: " + res.status + " " + path);
      return res.status === 204 ? null : res.json();
    });
  }

  function route(path, options, mockFn) {
    if (config.mode === "live") return request(path, options);
    return simulate(null).then(mockFn);
  }

  /* ---------------------------------------------------------------------- */
  /* Deterministic availability                                             */
  /* --------------------------------------------------------------------- */
  /* The mock has to stay stable: the same court on the same day must show
     the same slots every time it is rendered, or the calendar would reshuffle
     under the user. A small string hash gives us repeatable pseudo-noise.   */

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function noise(seed) { return (hash(seed) % 1000) / 1000; }

  var OPEN_MIN = 6 * 60;          // 06:00
  var CLOSE_MIN = 23 * 60 + 30;   // last start 23:30
  var STEP = 30;

  function minsToLabel(mins) {
    var h = Math.floor(mins / 60) % 24;
    var m = mins % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function isPeak(mins) { return mins >= 18 * 60 && mins < 22 * 60; }

  function slotState(courtId, dateISO, mins) {
    var n = noise(courtId + "|" + dateISO + "|" + mins);
    var pressure = isPeak(mins) ? 0.46 : 0.16;          // peak fills up
    var weekend = new Date(dateISO + "T00:00:00").getDay();
    if (weekend === 0 || weekend === 6) pressure += 0.12;
    if (n < pressure) return "closed";
    if (n < pressure + 0.2) return "tight";
    return "open";
  }

  function todayISO() {
    var d = new Date();
    return toISO(d);
  }

  function toISO(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function addDays(base, n) {
    var d = new Date(base.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function findSport(id) {
    for (var i = 0; i < TOSS.sports.length; i++) {
      if (TOSS.sports[i].id === id) return TOSS.sports[i];
    }
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Public API                                                             */
  /* ---------------------------------------------------------------------- */

  var api = {
    config: config,

    /* --- Catalogue ------------------------------------------------------ */

    getClub: function () {
      return route("/club", null, function () { return TOSS.club; });
    },

    getSports: function () {
      return route("/sports", null, function () { return TOSS.sports.slice(); });
    },

    getSport: function (id) {
      return route("/sports/" + id, null, function () { return findSport(id); });
    },

    getCourts: function (sportId) {
      return route("/courts?sport=" + sportId, null, function () {
        var s = findSport(sportId);
        return s ? s.courts.slice() : [];
      });
    },

    getFacilities: function () {
      return route("/facilities", null, function () { return TOSS.facilities.slice(); });
    },

    /* --- Availability & pricing ----------------------------------------- */

    /* Returns every 30-minute start between opening and last-booking, each
       tagged open | tight | closed. The booking UI never invents a state. */
    getAvailability: function (courtId, dateISO) {
      return route("/availability?court=" + courtId + "&date=" + dateISO, null, function () {
        var slots = [];
        var now = new Date();
        var isToday = dateISO === todayISO();
        var nowMins = now.getHours() * 60 + now.getMinutes();

        for (var m = OPEN_MIN; m <= CLOSE_MIN; m += STEP) {
          var state = slotState(courtId, dateISO, m);
          if (isToday && m <= nowMins + 30) state = "closed";   // past or too soon
          slots.push({ start: m, label: minsToLabel(m), state: state, peak: isPeak(m) });
        }
        return { courtId: courtId, date: dateISO, slots: slots };
      });
    },

    /* A rolling window of bookable dates for the date rail. */
    getDateWindow: function (days) {
      var n = days || 14;
      return route("/availability/window?days=" + n, null, function () {
        var base = new Date();
        var out = [];
        for (var i = 0; i < n; i++) {
          var d = addDays(base, i);
          out.push({
            iso: toISO(d),
            dow: d.toLocaleDateString(TOSS.club.locale, { weekday: "short" }),
            day: d.getDate(),
            month: d.toLocaleDateString(TOSS.club.locale, { month: "short" }),
            isToday: i === 0
          });
        }
        return out;
      });
    },

    /* Live count of free courts per sport, for the hero strip. */
    getLiveAvailability: function () {
      return route("/availability/live", null, function () {
        var date = todayISO();
        var now = new Date();
        var mins = Math.ceil((now.getHours() * 60 + now.getMinutes()) / STEP) * STEP;
        if (mins < OPEN_MIN) mins = OPEN_MIN;
        if (mins > CLOSE_MIN) mins = CLOSE_MIN;

        return TOSS.sports.map(function (sport) {
          var free = 0;
          var tight = 0;
          sport.courts.forEach(function (court) {
            var state = slotState(court.id, date, mins);
            if (state === "open") free++;
            else if (state === "tight") tight++;
          });
          return {
            sportId: sport.id,
            sportName: sport.name,
            total: sport.courts.length,
            free: free,
            tight: tight,
            state: free > 0 ? "open" : (tight > 0 ? "tight" : "closed"),
            at: minsToLabel(mins)
          };
        });
      });
    },

    /* Price for a slot. Peak multiplier and membership discount applied here
       so there is exactly one place that decides what a booking costs. */
    getQuote: function (params) {
      var q = "/quote?sport=" + params.sportId + "&court=" + params.courtId +
              "&date=" + params.date + "&start=" + params.start +
              "&duration=" + params.duration;
      return route(q, null, function () {
        var sport = findSport(params.sportId);
        if (!sport) return null;

        var hours = params.duration / 60;
        var halves = params.duration / STEP;
        var subtotal = 0;
        for (var i = 0; i < halves; i++) {
          var m = params.start + i * STEP;
          subtotal += (isPeak(m) ? sport.peakRate : sport.rate) / 2;
        }

        var tier = params.membership || "casual";
        var rates = { casual: 0, regular: 0.10, premium: 0.20, team: 0.25 };
        var discountRate = rates[tier] || 0;
        var discount = Math.round(subtotal * discountRate);
        var net = subtotal - discount;
        var tax = Math.round(net * 0.18);

        return {
          currency: TOSS.club.currency,
          hours: hours,
          subtotal: Math.round(subtotal),
          discountLabel: discountRate ? Math.round(discountRate * 100) + "% member discount" : null,
          discount: discount,
          tax: tax,
          taxLabel: "GST 18%",
          total: net + tax
        };
      });
    },

    /* --- Bookings ------------------------------------------------------- */

    createBooking: function (payload) {
      return route("/bookings", { method: "POST", body: payload }, function () {
        var ref = "TC-" + String(hash(JSON.stringify(payload)) % 100000).padStart(5, "0");
        return {
          id: ref,
          reference: ref,
          status: "reserved",
          holdExpiresInMinutes: 10,
          payment: { status: "pending", provider: null }
        };
      });
    },

    /* Hands off to the payment gateway. Swap the mock for a real intent:
       Razorpay order, Stripe PaymentIntent, or a hosted checkout redirect. */
    createPaymentIntent: function (bookingId, amount) {
      return route("/payments/intent", {
        method: "POST",
        body: { bookingId: bookingId, amount: amount }
      }, function () {
        return {
          bookingId: bookingId,
          amount: amount,
          provider: "not-connected",
          clientSecret: null,
          message: "Payment gateway is not connected in this build."
        };
      });
    },

    /* --- Memberships ---------------------------------------------------- */

    getMemberships: function () {
      return route("/memberships", null, function () { return TOSS.memberships.slice(); });
    },

    subscribe: function (planId, details) {
      return route("/memberships/" + planId + "/subscribe", {
        method: "POST", body: details
      }, function () {
        return { planId: planId, status: "pending-payment" };
      });
    },

    /* --- Events --------------------------------------------------------- */

    getEvents: function (filter) {
      var f = filter || {};
      return route("/events?sport=" + (f.sport || "all") + "&type=" + (f.type || "all"), null, function () {
        var base = new Date();
        return TOSS.events
          .map(function (ev) {
            var d = addDays(base, ev.inDays);
            return Object.assign({}, ev, {
              date: toISO(d),
              day: d.getDate(),
              month: d.toLocaleDateString(TOSS.club.locale, { month: "short" }),
              weekday: d.toLocaleDateString(TOSS.club.locale, { weekday: "long" }),
              state: ev.slotsLeft === 0 ? "closed"
                   : (ev.slotsLeft / ev.slots < 0.3 ? "tight" : "open")
            });
          })
          .sort(function (a, b) { return a.inDays - b.inDays; });
      });
    },

    registerForEvent: function (eventId, details) {
      return route("/events/" + eventId + "/registrations", {
        method: "POST", body: details
      }, function () {
        return { eventId: eventId, status: "pending-payment" };
      });
    },

    /* --- Coaching ------------------------------------------------------- */

    getPrograms: function () {
      return route("/programs", null, function () { return TOSS.programs.slice(); });
    },

    getCoaches: function (sportId) {
      return route("/coaches" + (sportId ? "?sport=" + sportId : ""), null, function () {
        return TOSS.coaches.slice();
      });
    },

    bookCoachingSession: function (coachId, details) {
      return route("/coaching/sessions", {
        method: "POST", body: Object.assign({ coachId: coachId }, details)
      }, function () {
        return { coachId: coachId, status: "requested" };
      });
    },

    /* --- Community ------------------------------------------------------ */

    findPlayers: function (criteria) {
      var c = criteria || {};
      var q = "/players?sport=" + (c.sport || "any") +
              "&level=" + (c.level || "any") + "&when=" + (c.when || "any");
      return route(q, null, function () {
        return TOSS.players.filter(function (p) {
          if (c.sport && c.sport !== "any" && p.sport !== c.sport) return false;
          if (c.level && c.level !== "any" && p.level !== c.level) return false;
          if (c.when && c.when !== "any" && p.when !== c.when) return false;
          return true;
        });
      });
    },

    getLeaderboard: function (sportId) {
      return route("/leaderboard?sport=" + sportId, null, function () {
        return TOSS.leaderboard[sportId] || [];
      });
    },

    getGroups: function () {
      return route("/groups", null, function () { return TOSS.groups.slice(); });
    },

    /* --- Content -------------------------------------------------------- */

    getReviews: function () {
      return route("/reviews", null, function () { return TOSS.testimonials.slice(); });
    },

    getFaq: function () {
      return route("/faq", null, function () { return TOSS.faq.slice(); });
    },

    getGallery: function () {
      return route("/gallery", null, function () { return TOSS.gallery.slice(); });
    },

    sendMessage: function (payload) {
      return route("/messages", { method: "POST", body: payload }, function () {
        return { status: "received" };
      });
    },

    /* --- Auth stubs — wired up when accounts ship ------------------------ */

    getCurrentUser: function () {
      return route("/me", null, function () { return null; });   // signed out
    },

    signIn: function (credentials) {
      return route("/auth/session", { method: "POST", body: credentials }, function () {
        throw new Error("Accounts are not enabled in this build.");
      });
    },

    /* --- Helpers shared with the views ---------------------------------- */

    helpers: {
      minsToLabel: minsToLabel,
      isPeak: isPeak,
      toISO: toISO,
      todayISO: todayISO,
      step: STEP
    }
  };

  TOSS.api = api;
})();
