/* ==========================================================================
   TOSS CLUB — Small DOM and formatting helpers
   No framework here. Everything the views need is in this file.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* Creates an element. Props are set as attributes except for a few that
     have to be assigned as properties to behave correctly. */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (key) {
      var v = p[key];
      if (v === null || v === undefined || v === false) return;
      if (key === "class") node.className = v;
      else if (key === "html") node.innerHTML = v;
      else if (key === "text") node.textContent = v;
      else if (key === "dataset") Object.assign(node.dataset, v);
      else if (key.slice(0, 2) === "on" && typeof v === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), v);
      } else node.setAttribute(key, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  var money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

  function fmtMoney(n) { return (TOSS.club ? TOSS.club.currency : "₹") + money.format(n); }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  function slugState(state) {
    return state === "open" ? "Available"
         : state === "tight" ? "Almost full"
         : "Unavailable";
  }

  /* A small inline icon set. SVG only — no emoji stands in for an icon. */
  var ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18 9 12l6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l16 16M20 4 4 20"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5A8.5 8.5 0 0 1 8.2 18.9L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.8 9.2c.3 2.4 3.6 5.7 6 6l1-1.6 2 .9-.5 1.6c-2.9.6-7.9-4.4-7.3-7.3l1.6-.5.9 2Z" fill="currentColor" stroke="none"/></svg>'
  };

  function icon(name, cls) {
    var span = document.createElement("span");
    span.className = cls || "";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = ICONS[name] || "";
    var svg = span.firstChild;
    return svg || span;
  }

  /* --- Availability pill, used identically everywhere --------------------- */
  function statePill(state, label) {
    return el("span", { class: "state state--" + state }, [
      el("span", { class: "state__dot" }),
      el("span", { text: label || slugState(state) })
    ]);
  }

  /* --- Toasts ------------------------------------------------------------ */
  var stack = null;
  function toast(message) {
    if (!stack) {
      stack = el("div", { class: "toast-stack", role: "status", "aria-live": "polite" });
      document.body.appendChild(stack);
    }
    var t = el("div", { class: "toast" }, [
      el("i", { class: "toast__bar" }),
      el("span", { text: message })
    ]);
    stack.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity 260ms ease, transform 260ms ease";
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      setTimeout(function () { t.remove(); }, 280);
    }, 4200);
  }

  /* --- Focus trap for the drawer and lightbox ---------------------------- */
  function trapFocus(container) {
    var sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    function onKey(e) {
      if (e.key !== "Tab") return;
      var items = $$(sel, container).filter(function (n) { return n.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", onKey);
    return function () { container.removeEventListener("keydown", onKey); };
  }

  /* The OS motion preference, with one documented override.
     --------------------------------------------------------------------
     Every animated module on the site reads this, so it is the single place
     the decision is made. `data-motion` on <html> overrides it:

         <html data-motion="always">    animate regardless of the OS setting
         <html data-motion="reduce">    behave as though reduced was asked for
         (absent)                       follow the OS, which is the default

     "always" overrides a stated accessibility preference, and that is a real
     trade — a visitor who turns animation off at the OS level is usually
     doing it for a reason. It exists because the setting is easy to have on
     without knowing: Windows enables it under Accessibility > Visual effects
     > Animation effects, and with it on this site loses Lenis smoothing, the
     parallax, the reveals and every scroll-scrubbed scene at once, which
     reads as a broken page rather than a calm one.

     Only `.matches` is read anywhere, but the listener methods are forwarded
     so a caller can still subscribe to OS-level changes. */
  var motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionForced = document.documentElement.getAttribute("data-motion");

  var reducedMotion = {
    get matches() {
      if (motionForced === "always") return false;
      if (motionForced === "reduce") return true;
      return motionMQ.matches;
    },
    get media() { return motionMQ.media; },
    addEventListener: function (t, fn) { motionMQ.addEventListener(t, fn); },
    removeEventListener: function (t, fn) { motionMQ.removeEventListener(t, fn); }
  };

  TOSS.dom = {
    $: $, $$: $$, el: el, clear: clear,
    fmtMoney: fmtMoney,
    initials: initials,
    slugState: slugState,
    icon: icon,
    statePill: statePill,
    toast: toast,
    trapFocus: trapFocus,
    reducedMotion: reducedMotion
  };
})();
