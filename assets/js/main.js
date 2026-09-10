/* ==========================================================================
   TOSS CLUB — Boot
   Everything above waits for the DOM, then wires itself up. Each view fails
   quietly if its container is not on the page, so sections can be removed
   or reordered without breaking the rest.
   ========================================================================== */

(function () {
  "use strict";

  function boot() {
    TOSS.community.initClubFacts();

    TOSS.ui.initNav();
    TOSS.discover.initHero();
    TOSS.discover.initLiveBar();
    TOSS.discover.initSports();
    TOSS.discover.initFacilities();

    TOSS.booking.init();

    TOSS.programsUI.initMemberships();
    TOSS.programsUI.initEvents();
    TOSS.programsUI.initCoaching();

    TOSS.community.initMatchmaker();
    TOSS.community.initLeaderboard();
    TOSS.community.initGroups();
    TOSS.discover.initGallery();
    TOSS.community.initReviews();
    TOSS.community.initFaq();
    TOSS.community.initVisit();

    /* Reveals run last so every generated node is already in the document. */
    TOSS.ui.initReveals();

    /* Smooth scrolling, the chapter rail, parallax and unmasking. Started
       after the views so the rail can measure real section heights; a second
       pass once the async renders have landed catches anything late. */
    TOSS.scroll.init();
    window.setTimeout(function () { TOSS.scroll.refresh(); }, 900);
    window.addEventListener("load", function () { TOSS.scroll.refresh(); });

    /* Any control that should open the booking flow says so declaratively. */
    TOSS.dom.$$("[data-book]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        TOSS.booking.startWith(btn.dataset.book || null);
      });
    });

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
