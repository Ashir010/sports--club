/* ==========================================================================
   TOSS CLUB — Community, testimonials, questions, visiting
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;
  var $ = d.$, $$ = d.$$, el = d.el;
  var api = TOSS.api;

  /* ======================================================================
     FIND PLAYERS
     ====================================================================== */

  function initMatchmaker() {
    var form = $("#matchForm");
    var results = $("#matchResults");
    if (!form || !results) return;

    var sportSel = $("#mmSport");
    var levelSel = $("#mmLevel");
    var whenSel = $("#mmWhen");

    TOSS.sports.forEach(function (s) {
      sportSel.appendChild(el("option", { value: s.id, text: s.name }));
    });

    function paint(players) {
      d.clear(results);

      if (!players.length) {
        results.appendChild(el("p", {
          class: "prose small",
          text: "Nobody matches that yet. Widen the search, or join a group below — " +
                "someone there is looking for exactly your game."
        }));
        return;
      }

      results.appendChild(el("p", {
        class: "micro dim",
        text: players.length + (players.length === 1 ? " player is" : " players are") +
              " looking for a game that matches yours."
      }));

      players.slice(0, 6).forEach(function (p) {
        var invite = el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Invite" });
        invite.addEventListener("click", function () {
          d.toast("Invite sent to " + p.name.split(" ")[0] + ". You will hear back in the app once accounts are live.");
        });

        results.appendChild(el("article", { class: "matchcard" }, [
          el("span", { class: "matchcard__avatar", "aria-hidden": "true", text: d.initials(p.name) }),
          el("div", {}, [
            el("span", { class: "matchcard__name", text: p.name }),
            el("span", {
              class: "matchcard__meta",
              text: p.level + ", " + p.when.toLowerCase() + ". " + p.games + " games. " + p.note + "."
            })
          ]),
          invite
        ]));
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      results.setAttribute("aria-busy", "true");
      api.findPlayers({
        sport: sportSel.value,
        level: levelSel.value,
        when: whenSel.value
      }).then(function (players) {
        results.removeAttribute("aria-busy");
        paint(players);
      });
    });

    api.findPlayers({}).then(paint);
  }

  /* ======================================================================
     LEADERBOARD
     ====================================================================== */

  function initLeaderboard() {
    var tabs = $("#ladderTabs");
    var table = $("#ladderTable");
    var caption = $("#ladderCaption");
    if (!tabs || !table) return;

    var active = TOSS.sports[0].id;

    function paint(rows) {
      d.clear(table);
      var isTeam = active === "football";

      table.appendChild(el("thead", {}, [
        el("tr", {}, [
          el("th", { scope: "col", text: "#" }),
          el("th", { scope: "col", text: isTeam ? "Side" : "Player" }),
          el("th", { scope: "col", text: "P" }),
          el("th", { scope: "col", text: "W" }),
          el("th", { scope: "col", style: "text-align:right", text: isTeam ? "Pts" : "Rating" }),
          el("th", { scope: "col", style: "text-align:right" }, [
            el("span", { class: "visually-hidden", text: "Movement" })
          ])
        ])
      ]));

      var body = el("tbody");
      rows.forEach(function (r) {
        var arrow = r.trend === "up" ? "▲" : (r.trend === "down" ? "▼" : "—");
        var word = r.trend === "up" ? "Up" : (r.trend === "down" ? "Down" : "No change");
        body.appendChild(el("tr", { class: r.rank <= 3 ? "is-top" : "" }, [
          el("td", { class: "rank num", text: String(r.rank) }),
          el("td", { text: r.name }),
          el("td", { class: "num", text: String(r.played) }),
          el("td", { class: "num", text: String(r.won) }),
          el("td", { class: "pts num", text: String(r.pts) }),
          el("td", { class: "trend trend--" + r.trend }, [
            el("span", { "aria-hidden": "true", text: arrow }),
            el("span", { class: "visually-hidden", text: word })
          ])
        ]));
      });
      table.appendChild(body);

      if (caption) {
        caption.textContent = isTeam
          ? "Sarjapur Sevens, season 4 — after 18 rounds."
          : "Club ladder, rolling 90 days. Beat someone above you and you take their rung.";
      }
    }

    TOSS.sports.forEach(function (s) {
      var chip = el("button", {
        class: "chip", type: "button",
        "aria-pressed": String(s.id === active),
        text: s.name
      });
      chip.addEventListener("click", function () {
        active = s.id;
        $$(".chip", tabs).forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        api.getLeaderboard(active).then(paint);
      });
      tabs.appendChild(chip);
    });

    api.getLeaderboard(active).then(paint);
  }

  /* ======================================================================
     GROUPS
     ====================================================================== */

  function initGroups() {
    var grid = $("#groups");
    if (!grid) return;
    api.getGroups().then(function (groups) {
      d.clear(grid);
      groups.forEach(function (g) {
        var join = el("button", { class: "link", type: "button", text: "Join this group" });
        join.addEventListener("click", function () {
          d.toast("You are on the list for " + g.name + ". The group host will add you before the next session.");
        });
        grid.appendChild(el("article", { class: "group" }, [
          el("h3", { class: "group__name", text: g.name }),
          el("p", { class: "group__note", text: g.note }),
          el("div", { class: "group__meta" }, [
            el("span", { text: g.members + " members" }),
            el("span", { text: g.meets })
          ]),
          join
        ]));
      });
    });
  }

  /* ======================================================================
     TESTIMONIALS
     ====================================================================== */

  function initReviews() {
    var grid = $("#quotes");
    if (!grid) return;
    api.getReviews().then(function (reviews) {
      d.clear(grid);
      reviews.forEach(function (r) {
        var rating = el("div", {
          class: "quote__rating", role: "img",
          "aria-label": r.rating + " out of 5"
        });
        for (var i = 1; i <= 5; i++) {
          rating.appendChild(el("span", { class: "quote__pip" + (i <= r.rating ? " is-on" : "") }));
        }
        rating.appendChild(el("span", { class: "quote__score", text: r.rating + " of 5" }));

        var avatar = el("span", { class: "quote__avatar", "aria-hidden": "true", text: d.initials(r.name) });
        if (r.photo) {
          var img = el("img", { src: r.photo, alt: "" });
          img.addEventListener("error", function () { img.remove(); });
          avatar.appendChild(img);
        }

        grid.appendChild(el("article", { class: "quote" }, [
          rating,
          el("blockquote", { class: "quote__text", text: "“" + r.text + "”" }),
          el("div", { class: "quote__who" }, [
            avatar,
            el("div", {}, [
              el("span", { class: "quote__name", text: r.name }),
              el("span", { class: "quote__meta", text: r.sport })
            ])
          ])
        ]));
      });
    });
  }

  /* ======================================================================
     FAQ
     ====================================================================== */

  function initFaq() {
    var list = $("#faqList");
    if (!list) return;
    api.getFaq().then(function (items) {
      d.clear(list);
      items.forEach(function (item, i) {
        var answerId = "faq-a-" + i;
        var btn = el("button", {
          class: "qa__q", type: "button",
          "aria-expanded": "false", "aria-controls": answerId
        }, [
          el("span", { text: item.q }),
          el("span", { class: "qa__sign", "aria-hidden": "true" })
        ]);
        var answer = el("div", { class: "qa__a", id: answerId }, [
          el("div", {}, [el("p", { text: item.a })])
        ]);
        btn.addEventListener("click", function () {
          var open = btn.getAttribute("aria-expanded") === "true";
          $$(".qa__q", list).forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
          btn.setAttribute("aria-expanded", String(!open));
        });
        list.appendChild(el("div", { class: "qa" }, [btn, answer]));
      });
    });
  }

  /* ======================================================================
     VISIT — hours, map, contact
     ====================================================================== */

  function initVisit() {
    var hours = $("#hours");
    var mapWrap = $("#mapFrame");
    var form = $("#contactForm");

    if (hours) {
      var today = new Date().toLocaleDateString("en-GB", { weekday: "long" });
      TOSS.club.hours.forEach(function (h) {
        hours.appendChild(el("div", {
          class: "hours__row" + (h.day === today ? " is-today" : "")
        }, [
          el("span", { text: h.day + (h.day === today ? " (today)" : "") }),
          el("span", { class: "num", text: h.open + " – " + h.close })
        ]));
      });
    }

    if (mapWrap) {
      var g = TOSS.club.geo;
      var pad = 0.008;
      var bbox = [g.lng - pad, g.lat - pad / 2, g.lng + pad, g.lat + pad / 2].join("%2C");
      var iframe = el("iframe", {
        title: "Map showing Toss Club on Sarjapur Main Road",
        loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade",
        src: "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox +
             "&layer=mapnik&marker=" + g.lat + "%2C" + g.lng
      });
      mapWrap.insertBefore(iframe, mapWrap.firstChild);
    }

    $$("[data-directions]").forEach(function (a) {
      var g = TOSS.club.geo;
      a.href = "https://www.google.com/maps/dir/?api=1&destination=" + g.lat + "," + g.lng;
      a.target = "_blank";
      a.rel = "noopener";
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = {};
        $$("input, textarea, select", form).forEach(function (f) { data[f.name] = f.value; });
        var nameField = form.querySelector('[data-field="cname"]');
        var mailField = form.querySelector('[data-field="cemail"]');
        var okName = data.cname && data.cname.trim().length > 1;
        var okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((data.cemail || "").trim());
        if (nameField) nameField.classList.toggle("is-invalid", !okName);
        if (mailField) mailField.classList.toggle("is-invalid", !okMail);
        if (!okName || !okMail) {
          var bad = form.querySelector(".field.is-invalid .input");
          if (bad) bad.focus();
          return;
        }
        api.sendMessage(data).then(function () {
          form.reset();
          d.toast("Message sent. The club replies within one working day.");
        });
      });
    }
  }

  /* ======================================================================
     Footer + club facts written from data, so one edit updates the page
     ====================================================================== */

  function initClubFacts() {
    var courts = TOSS.sports.reduce(function (n, s) { return n + s.courts.length; }, 0);
    $$("[data-fact]").forEach(function (node) {
      var key = node.dataset.fact;
      if (key === "courts") { node.dataset.count = courts; node.textContent = courts; }
      else if (key === "sports") { node.dataset.count = TOSS.sports.length; node.textContent = TOSS.sports.length; }
      else if (key === "address") node.textContent = TOSS.club.address.line1 + ", " + TOSS.club.address.line2;
      else if (key === "phone") { node.textContent = TOSS.club.phone; if (node.tagName === "A") node.href = "tel:" + TOSS.club.phone.replace(/\s/g, ""); }
      else if (key === "email") { node.textContent = TOSS.club.email; if (node.tagName === "A") node.href = "mailto:" + TOSS.club.email; }
      else if (key === "parking") node.textContent = TOSS.club.parking;
      else if (key === "access") node.textContent = TOSS.club.access;
      else if (key === "directions") node.textContent = TOSS.club.directions;
      else if (key === "year") node.textContent = new Date().getFullYear();
    });
  }

  TOSS.community = {
    initMatchmaker: initMatchmaker,
    initLeaderboard: initLeaderboard,
    initGroups: initGroups,
    initReviews: initReviews,
    initFaq: initFaq,
    initVisit: initVisit,
    initClubFacts: initClubFacts
  };
})();
