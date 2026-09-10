/* ==========================================================================
   TOSS CLUB — Court plans
   --------------------------------------------------------------------------
   Every visual on this site is a scale drawing of a real playing surface,
   generated as SVG. Line positions come from the actual dimensions of each
   game — the kitchen at 7 ft, padel's service line at 3 m from the back
   glass, the 6.75 m three-point arc — because that geometry is what makes
   each sport recognisable at a glance.

   These render instantly, weigh nothing, and never fail to load. Where a
   photograph exists it is layered over the drawing (see .plate__photo);
   drop files into assets/img/ and point data-photo at them.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var VB_W = 1000;
  var VB_H = 640;

  var CHALK = "rgba(255,255,255,.80)";
  var CHALK_SOFT = "rgba(255,255,255,.34)";
  var CHALK_FAINT = "rgba(255,255,255,.16)";

  var uidCounter = 0;
  function uid() { uidCounter += 1; return "cp" + uidCounter; }

  function line(x1, y1, x2, y2, stroke, w) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
           '" stroke="' + (stroke || CHALK) + '" stroke-width="' + (w || 3) + '"/>';
  }

  function rect(x, y, w, h, stroke, sw, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
           '" fill="' + (fill || "none") + '" stroke="' + (stroke || CHALK) +
           '" stroke-width="' + (sw || 3) + '"/>';
  }

  function circle(cx, cy, r, stroke, sw, fill) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
           '" fill="' + (fill || "none") + '" stroke="' + (stroke || CHALK) +
           '" stroke-width="' + (sw || 3) + '"/>';
  }

  function path(d, stroke, sw, fill) {
    return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' +
           (stroke || CHALK) + '" stroke-width="' + (sw || 3) + '"/>';
  }

  /* A net drawn as a run of posts and mesh, so it reads as a net rather
     than another chalk line. */
  function netVertical(x, y1, y2, id) {
    var s = '<g>';
    s += '<line x1="' + x + '" y1="' + (y1 - 14) + '" x2="' + x + '" y2="' + (y2 + 14) +
         '" stroke="rgba(255,255,255,.9)" stroke-width="4"/>';
    s += '<rect x="' + (x - 5) + '" y="' + y1 + '" width="10" height="' + (y2 - y1) +
         '" fill="url(#mesh' + id + ')" opacity=".85"/>';
    s += '<circle cx="' + x + '" cy="' + (y1 - 14) + '" r="6" fill="rgba(255,255,255,.9)"/>';
    s += '<circle cx="' + x + '" cy="' + (y2 + 14) + '" r="6" fill="rgba(255,255,255,.9)"/>';
    return s + '</g>';
  }

  function frame(id, surface, body, opts) {
    var o = opts || {};
    var surround = o.surround || "rgba(0,0,0,.34)";
    return '' +
      '<svg viewBox="0 0 ' + VB_W + ' ' + VB_H + '" preserveAspectRatio="xMidYMid slice" ' +
        'role="img" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="sky' + id + '" x1="0" y1="0" x2="0.3" y2="1">' +
          '<stop offset="0" stop-color="' + surface + '" stop-opacity="1"/>' +
          '<stop offset="1" stop-color="#04120F" stop-opacity=".92"/>' +
        '</linearGradient>' +
        '<radialGradient id="rig' + id + '" cx="0.5" cy="0.06" r="0.85">' +
          '<stop offset="0" stop-color="#FFFFFF" stop-opacity=".26"/>' +
          '<stop offset="0.5" stop-color="#FFFFFF" stop-opacity=".07"/>' +
          '<stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<pattern id="mesh' + id + '" width="6" height="6" patternUnits="userSpaceOnUse">' +
          '<path d="M0 0 L6 6 M6 0 L0 6" stroke="rgba(255,255,255,.55)" stroke-width="1"/>' +
        '</pattern>' +
        '<pattern id="weave' + id + '" width="26" height="26" patternUnits="userSpaceOnUse">' +
          '<path d="M0 13 H26 M13 0 V26" stroke="rgba(255,255,255,.05)" stroke-width="1"/>' +
        '</pattern>' +
      '</defs>' +
      '<rect width="' + VB_W + '" height="' + VB_H + '" fill="url(#sky' + id + ')"/>' +
      '<rect width="' + VB_W + '" height="' + VB_H + '" fill="' + surround + '"/>' +
      '<rect width="' + VB_W + '" height="' + VB_H + '" fill="url(#weave' + id + ')"/>' +
      '<rect width="' + VB_W + '" height="' + VB_H + '" fill="url(#rig' + id + ')"/>' +
      body +
      '</svg>';
  }

  /* ======================================================================
     Racket sports
     ====================================================================== */

  /* Pickleball — 44 x 20 ft. The 7 ft non-volley zone either side of the net
     is the shape everyone recognises. */
  function pickleball(id) {
    var L = 150, R = 850, T = 130, B = 510, MX = 500;
    var kitchen = (7 / 22) * (R - MX);          // 7 ft of the 22 ft half
    var g = '<g>';
    g += rect(L, T, R - L, B - T, CHALK, 3);
    g += line(MX - kitchen, T, MX - kitchen, B);
    g += line(MX + kitchen, T, MX + kitchen, B);
    g += line(L, (T + B) / 2, MX - kitchen, (T + B) / 2);
    g += line(MX + kitchen, (T + B) / 2, R, (T + B) / 2);
    g += rect(L - 46, T - 40, (R - L) + 92, (B - T) + 80, CHALK_FAINT, 2);
    g += netVertical(MX, T, B, id);
    g += '</g>';
    return g;
  }

  /* Padel — 20 x 10 m inside glass. Back and side glass is drawn as panels
     with mullions, which is what the court actually looks like from above. */
  function padel(id) {
    var L = 160, R = 840, T = 140, B = 500, MX = 500;
    var m = (R - L) / 20;                       // px per metre
    var svcL = L + 3 * m, svcR = R - 3 * m;
    var g = '<g>';
    // glass enclosure
    g += rect(L - 16, T - 16, (R - L) + 32, (B - T) + 32, "rgba(200,235,255,.42)", 5);
    g += line(L - 16, T - 16, L - 16, B + 16, "rgba(200,235,255,.3)", 5);
    for (var i = 1; i < 4; i++) {
      var y = T - 16 + ((B - T + 32) / 4) * i;
      g += line(L - 16, y, L - 4, y, "rgba(200,235,255,.5)", 3);
      g += line(R + 4, y, R + 16, y, "rgba(200,235,255,.5)", 3);
    }
    g += rect(L, T, R - L, B - T, CHALK, 3);
    g += line(svcL, T, svcL, B);
    g += line(svcR, T, svcR, B);
    g += line(svcL, (T + B) / 2, svcR, (T + B) / 2);
    g += netVertical(MX, T, B, id);
    g += '</g>';
    return g;
  }

  /* Badminton — 13.4 x 6.1 m with the doubles tramlines and both service
     lines, which is what separates it from every other racket court. */
  function badminton(id) {
    var L = 155, R = 845, T = 150, B = 490, MX = 500;
    var w = B - T, len = R - L;
    var singles = (0.46 / 6.1) * w;
    var shortSvc = (1.98 / 6.7) * (len / 2);
    var longSvc = (0.76 / 6.7) * (len / 2);
    var g = '<g>';
    g += rect(L, T, len, w, CHALK, 3);
    g += line(L, T + singles, R, T + singles, CHALK_SOFT, 2.5);
    g += line(L, B - singles, R, B - singles, CHALK_SOFT, 2.5);
    g += line(MX - shortSvc, T, MX - shortSvc, B);
    g += line(MX + shortSvc, T, MX + shortSvc, B);
    g += line(L + longSvc, T, L + longSvc, B, CHALK_SOFT, 2.5);
    g += line(R - longSvc, T, R - longSvc, B, CHALK_SOFT, 2.5);
    g += line(L, (T + B) / 2, MX - shortSvc, (T + B) / 2);
    g += line(MX + shortSvc, (T + B) / 2, R, (T + B) / 2);
    // sprung maple boards
    for (var x = 60; x < VB_W; x += 46) {
      g += line(x, 0, x, VB_H, "rgba(0,0,0,.13)", 1.5);
    }
    g += netVertical(MX, T - 10, B + 10, id);
    g += '</g>';
    return g;
  }

  /* Table tennis — the table, its centre line, the net, and the barriers
     that box the playing area in. */
  function tabletennis(id) {
    var L = 250, R = 750, T = 190, B = 450, MX = 500;
    var g = '<g>';
    g += rect(110, 70, VB_W - 220, VB_H - 140, CHALK_FAINT, 2);      // barriers
    g += '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) +
         '" fill="rgba(0,0,0,.22)" stroke="' + CHALK + '" stroke-width="4"/>';
    g += line(L, (T + B) / 2, R, (T + B) / 2, CHALK_SOFT, 2.5);      // doubles centre
    g += netVertical(MX, T - 12, B + 12, id);
    // legs, seen from above
    g += rect(L + 24, T + 20, 16, 16, CHALK_FAINT, 2, "rgba(0,0,0,.3)");
    g += rect(R - 40, T + 20, 16, 16, CHALK_FAINT, 2, "rgba(0,0,0,.3)");
    g += rect(L + 24, B - 36, 16, 16, CHALK_FAINT, 2, "rgba(0,0,0,.3)");
    g += rect(R - 40, B - 36, 16, 16, CHALK_FAINT, 2, "rgba(0,0,0,.3)");
    g += '</g>';
    return g;
  }

  /* ======================================================================
     Court and field sports
     ====================================================================== */

  /* Basketball — 28 x 15 m, with the key, the free-throw circle and the
     6.75 m arc that flattens into the corners. */
  function basketball() {
    var L = 150, R = 850, T = 130, B = 510, MX = 500, MY = 320;
    var mpx = (R - L) / 28;
    var keyW = 4.9 * mpx, keyL = 5.79 * mpx;
    var basket = 1.575 * mpx;
    var arcR = 6.75 * mpx;
    var straightY = 0.9 * mpx;
    var g = '<g>';
    // maple boards
    for (var x = 40; x < VB_W; x += 38) {
      g += line(x, 0, x, VB_H, "rgba(0,0,0,.12)", 1.5);
    }
    g += rect(L, T, R - L, B - T, CHALK, 3);
    g += line(MX, T, MX, B);
    g += circle(MX, MY, 1.8 * mpx);
    // left half
    g += rect(L, MY - keyW / 2, keyL, keyW, CHALK, 3);
    g += circle(L + keyL, MY, 1.8 * mpx);
    var lbx = L + basket;
    var dy = Math.sqrt(Math.max(arcR * arcR - Math.pow((B - T) / 2 - straightY, 2), 1));
    g += path("M" + L + "," + (T + straightY) + " L" + (lbx + dy) + "," + (T + straightY) +
              " A" + arcR + "," + arcR + " 0 0 1 " + (lbx + dy) + "," + (B - straightY) +
              " L" + L + "," + (B - straightY));
    g += circle(lbx, MY, 9, CHALK, 3, "rgba(255,255,255,.25)");
    // right half
    g += rect(R - keyL, MY - keyW / 2, keyL, keyW, CHALK, 3);
    g += circle(R - keyL, MY, 1.8 * mpx);
    var rbx = R - basket;
    g += path("M" + R + "," + (T + straightY) + " L" + (rbx - dy) + "," + (T + straightY) +
              " A" + arcR + "," + arcR + " 0 0 0 " + (rbx - dy) + "," + (B - straightY) +
              " L" + R + "," + (B - straightY));
    g += circle(rbx, MY, 9, CHALK, 3, "rgba(255,255,255,.25)");
    g += '</g>';
    return g;
  }

  /* Football — a seven-a-side turf: centre circle, penalty and goal areas,
     penalty spots, corner arcs, and mown stripes. */
  function football() {
    var L = 120, R = 880, T = 90, B = 550, MX = 500, MY = 320;
    var g = '<g>';
    for (var i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        g += '<rect x="' + (i * (VB_W / 10)) + '" y="0" width="' + (VB_W / 10) +
             '" height="' + VB_H + '" fill="rgba(255,255,255,.035)"/>';
      }
    }
    g += rect(L, T, R - L, B - T, CHALK, 3);
    g += line(MX, T, MX, B);
    g += circle(MX, MY, 74);
    g += circle(MX, MY, 6, CHALK, 3, CHALK);
    // left goal
    g += rect(L, MY - 112, 128, 224, CHALK, 3);
    g += rect(L, MY - 58, 54, 116, CHALK, 3);
    g += rect(L - 14, MY - 34, 14, 68, "rgba(255,255,255,.9)", 3);
    g += circle(L + 86, MY, 5, CHALK, 3, CHALK);
    g += path("M" + (L + 88) + "," + (MY - 46) + " A54,54 0 0 1 " + (L + 88) + "," + (MY + 46));
    // right goal
    g += rect(R - 128, MY - 112, 128, 224, CHALK, 3);
    g += rect(R - 54, MY - 58, 54, 116, CHALK, 3);
    g += rect(R, MY - 34, 14, 68, "rgba(255,255,255,.9)", 3);
    g += circle(R - 86, MY, 5, CHALK, 3, CHALK);
    g += path("M" + (R - 88) + "," + (MY - 46) + " A54,54 0 0 0 " + (R - 88) + "," + (MY + 46));
    // corners
    g += path("M" + (L + 18) + "," + T + " A18,18 0 0 1 " + L + "," + (T + 18), CHALK_SOFT, 2.5);
    g += path("M" + (R - 18) + "," + T + " A18,18 0 0 0 " + R + "," + (T + 18), CHALK_SOFT, 2.5);
    g += path("M" + (L + 18) + "," + B + " A18,18 0 0 0 " + L + "," + (B - 18), CHALK_SOFT, 2.5);
    g += path("M" + (R - 18) + "," + B + " A18,18 0 0 1 " + R + "," + (B - 18), CHALK_SOFT, 2.5);
    g += '</g>';
    return g;
  }

  /* ======================================================================
     Rooms — drawn in the same plan language as the courts, so the whole
     club reads as one set of drawings.
     ====================================================================== */

  function lounge() {
    var g = '<g>';
    g += rect(90, 70, 820, 500, CHALK_FAINT, 2);
    // seating clusters
    var clusters = [[200, 200], [500, 180], [790, 230], [260, 440], [560, 430], [810, 420]];
    clusters.forEach(function (c) {
      g += circle(c[0], c[1], 44, CHALK_SOFT, 2.5);
      g += circle(c[0], c[1], 16, CHALK_SOFT, 2.5);
      for (var a = 0; a < 4; a++) {
        var ang = (Math.PI / 2) * a + 0.4;
        g += rect(c[0] + Math.cos(ang) * 60 - 13, c[1] + Math.sin(ang) * 60 - 13, 26, 26, CHALK_FAINT, 2);
      }
    });
    g += line(90, 320, 910, 320, CHALK_FAINT, 1.5);
    g += rect(340, 78, 320, 26, CHALK_SOFT, 2.5);   // the score wall
    g += '</g>';
    return g;
  }

  function rooms() {
    var g = '<g>';
    g += rect(90, 70, 820, 500, CHALK_FAINT, 2);
    for (var i = 0; i < 6; i++) {
      var x = 120 + i * 132;
      g += rect(x, 100, 108, 170, CHALK_SOFT, 2.5);      // locker bays
      g += line(x, 185, x + 108, 185, CHALK_FAINT, 1.5);
      g += line(x + 54, 100, x + 54, 270, CHALK_FAINT, 1.5);
    }
    for (var j = 0; j < 5; j++) {
      var sx = 150 + j * 155;
      g += rect(sx, 350, 118, 160, CHALK_SOFT, 2.5);     // shower stalls
      g += circle(sx + 59, 400, 12, CHALK_FAINT, 2);
    }
    g += line(90, 310, 910, 310, CHALK_SOFT, 2.5);
    g += '</g>';
    return g;
  }

  function terrace() {
    var g = '<g>';
    g += rect(70, 60, 860, 520, CHALK_FAINT, 2);
    for (var r = 0; r < 4; r++) {
      var y = 130 + r * 76;
      g += line(110, y, 890, y, CHALK_SOFT, 2.5);        // tiered seating
      for (var s = 0; s < 12; s++) {
        g += line(110 + s * 71, y - 22, 110 + s * 71, y, CHALK_FAINT, 1.5);
      }
    }
    g += rect(110, 452, 780, 96, CHALK_SOFT, 2.5);       // the rail and the view
    g += line(110, 500, 890, 500, CHALK_FAINT, 1.5);
    g += '</g>';
    return g;
  }

  function kitchen() {
    var g = '<g>';
    g += rect(90, 70, 820, 500, CHALK_FAINT, 2);
    g += rect(140, 120, 720, 96, CHALK_SOFT, 2.5);       // the counter
    for (var i = 0; i < 9; i++) {
      g += circle(190 + i * 80, 168, 17, CHALK_FAINT, 2);
    }
    var tables = [[220, 350], [400, 340], [590, 360], [770, 345], [300, 490], [520, 495], [730, 485]];
    tables.forEach(function (t) {
      g += circle(t[0], t[1], 34, CHALK_SOFT, 2.5);
      g += rect(t[0] - 52, t[1] - 12, 20, 24, CHALK_FAINT, 2);
      g += rect(t[0] + 32, t[1] - 12, 20, 24, CHALK_FAINT, 2);
    });
    g += '</g>';
    return g;
  }

  var PLANS = {
    pickleball: pickleball,
    padel: padel,
    badminton: badminton,
    tabletennis: tabletennis,
    "table-tennis": tabletennis,
    basketball: basketball,
    football: football,
    lounge: lounge,
    rooms: rooms,
    terrace: terrace,
    kitchen: kitchen
  };

  TOSS.court = {
    /* Returns an SVG string for a plan key. Unknown keys fall back to the
       lounge plan rather than rendering nothing. */
    svg: function (key, surface, opts) {
      var id = uid();
      var fn = PLANS[key] || lounge;
      return frame(id, surface || "#0E5C63", fn(id), opts);
    },

    /* Paints a plan into an element, optionally with a photograph over it.
       The photo only becomes visible once it has actually decoded, so a
       missing file leaves the drawing in place instead of a broken image. */
    paint: function (el, key, surface, photo, alt, opts) {
      if (!el) return;
      var o = opts || {};
      var art = document.createElement("div");
      art.className = "plate__art";
      art.innerHTML = TOSS.court.svg(key, surface);

      el.classList.add("plate");
      el.innerHTML = "";
      el.appendChild(art);

      if (photo) {
        var img = document.createElement("img");
        img.className = "plate__photo";
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = alt || "";
        img.addEventListener("load", function () { img.classList.add("is-loaded"); });
        img.addEventListener("error", function () { img.remove(); });
        img.src = photo;
        el.appendChild(img);
      }

      /* Callers that supply their own veil (so it does not scale with a
         hover zoom on the art) pass { veil: false }. */
      if (o.veil !== false) {
        var veil = document.createElement("div");
        veil.className = "plate__veil";
        el.appendChild(veil);
      }
      return el;
    },

    keys: Object.keys(PLANS)
  };
})();
