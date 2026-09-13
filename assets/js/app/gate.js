/* ==========================================================================
   TOSS CLUB — The gate
   --------------------------------------------------------------------------
   The intro's opening sequence, drawn rather than filmed.

   This replaces a sixty-frame JPEG scrub. Those frames were stock footage
   with another club's logo, a fake call-to-action button and an AI
   watermark baked into the picture, none of which can be cropped away
   without also losing the subject they sit on top of. Drawing the scene
   instead costs about eight kilobytes rather than five and a half
   megabytes, is sharp at any pixel density, fits any viewport exactly
   because nothing is a fixed-size bitmap, and carries only this club's
   identity.

   The scene is a tunnel onto a floodlit court. An aperture opens toward the
   viewer as the page scrolls: the court beyond grows, the walls slide off
   the edges of the screen, and the light coming back through the gate takes
   over the frame. It is the same beat the footage was reaching for, told in
   the club's own palette.

   Structure mirrors assets/js/app/sequence.js on purpose, so the two are
   interchangeable from the page's point of view:

     · Nothing is drawn from a scroll event. The host page runs one
       requestAnimationFrame loop and calls through TOSS.scroll.onScroll,
       so painting can never outrun the display.
     · The work only happens while the shell is near the viewport, gated by
       an IntersectionObserver.
     · A frame is only redrawn when the scroll position actually moved.

   Markup contract:

     <section class="gate" data-gate data-gate-travel="400"></section>

   data-gate-travel is the shell height in vh and is the speed dial; the
   sticky stage inside it is always exactly one screen.
   ========================================================================== */

window.TOSS = window.TOSS || {};

(function () {
  "use strict";

  var d = TOSS.dom;

  /* Device pixel ratio is capped. Past 2 the extra samples are invisible on
     a phone and the fill cost is real — this scene is almost entirely large
     gradient fills, which are bound by how many pixels get touched. */
  var MAX_DPR = 2;

  /* Time constant, in milliseconds, for the damping applied to scroll
     progress before anything is drawn from it.

     This is the second of two filters. Lenis smooths the scroll position
     itself (see initLenis in app/intro.js); this smooths what the picture
     is drawn from. Two gentle stages in series beat one heavy one: the
     response is second-order, so it rounds off the corners of a velocity
     change instead of merely delaying it, and it buys a given smoothness
     for less lag than a single filter would.

     Both numbers were picked by measurement rather than by feel. Averaged
     over three runs of identical wheel input, frame-to-frame jerk — the
     change in step size between consecutive painted frames, which is what
     actually reads as roughness — came out:

         Lenis alone, no damping here       0.216
         this stage at 60ms                 0.122
         this stage at 95ms                 0.102

     Ninety-five buys very little more and costs another 35ms of lag, so
     sixty it is. Every millisecond of smoothing is a millisecond the
     picture trails the wheel, and past roughly a fifth of a second the
     result stops reading as smooth and starts reading as detached. */
  var SMOOTH_MS = 60;

  /* Below this much change in progress there is nothing new to see, so the
     frame is skipped. Small enough to be invisible, large enough to stop the
     loop repainting forever on a value that is still settling in the ninth
     decimal place. */
  var EPSILON = 0.00012;

  /* Palette, lifted from assets/css/tokens.css. Canvas cannot read custom
     properties, so these are the one place in the codebase where the token
     values are repeated. If tokens.css changes, change them here too. */
  var C = {
    pine:     "#06201C",
    pineDeep: "#041815",
    moss:     "#0B2E28",
    chalk:    "#E8EBE2",
    bone:     "#F3F6EC",
    optic:    "#D8F24B",
    maple:    "#D9A441"
  };

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Ease used for the whole camera move.

     Mostly linear on purpose. On a scrub the visitor's own scroll is the
     timing, so a conventional ease-in-out works against the gesture: a
     cubic is so flat at both ends that the first and last tenth of the
     travel produce almost no visible change, and a screen that will not
     move while the wheel is turning reads as broken rather than as slow.
     A quarter of a cubic mixed into three quarters of a straight line keeps
     the arrival and departure from feeling mechanical while guaranteeing
     the picture always answers the scroll. */
  function easeInOut(t) {
    var cubic = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return t * 0.74 + cubic * 0.26;
  }

  /* Smootherstep: zero velocity *and* zero acceleration at both ends. Used
     for the type, where a linear fade is visibly abrupt — it starts and
     stops at full speed, so a line appears to flinch at the moment it begins
     moving and again at the moment it lands. The camera does not use this;
     see the note on easeInOut above for why a scrub wants something much
     closer to straight. */
  function smoother(t) {
    t = clamp01(t);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* ---------------------------------------------------------------------- */
  /* Static noise tile                                                      */
  /* ---------------------------------------------------------------------- */
  /* A flat gradient across a whole screen bands visibly on an 8-bit display,
     and this scene is almost nothing but flat gradients. A little grain
     breaks the banding up. Built once and reused as a pattern; deliberately
     not reseeded per frame, because noise that changes while the picture is
     held still reads as a dirty screen rather than as film. */

  var noiseTile = null;

  function buildNoise() {
    var size = 128;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var g = c.getContext("2d");
    var img = g.createImageData(size, size);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 118 + Math.random() * 34;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  /* ---------------------------------------------------------------------- */
  /* Dust                                                                   */
  /* ---------------------------------------------------------------------- */
  /* Motes hanging in the light coming back through the gate. Their depth is
     fixed at birth and only their position along it moves with the scroll,
     so they drift toward the viewer as the camera pushes in and give the
     move a sense of volume that gradients alone cannot. */

  function makeDust(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({
        a: Math.random() * Math.PI * 2,   /* angle around the vanishing point */
        r: 0.08 + Math.random() * 0.92,   /* radius, as a share of the frame  */
        z: Math.random(),                 /* position along the travel        */
        s: 0.4 + Math.random() * 1.5,     /* size in device-independent px    */
        o: 0.18 + Math.random() * 0.5     /* peak opacity                     */
      });
    }
    return out;
  }

  /* ---------------------------------------------------------------------- */
  /* One gate                                                               */
  /* ---------------------------------------------------------------------- */

  function Gate(section) {
    var ds = section.dataset;

    this.section = section;
    this.travel = parseInt(ds.gateTravel, 10) || 400;
    this.reduced = ds.gateMotion === "always" ? false : d.reducedMotion.matches;

    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.p = -1;          /* last painted progress; -1 forces a first paint */

    /* The damped value the picture is actually drawn from, and the clock the
       damping is measured against. null until the first tick, which then
       adopts the scroll position outright rather than easing up to it from
       zero — otherwise a page restored mid-sequence would play a little
       animation nobody asked for. */
    this.eased = null;
    this.time = 0;

    this.dust = makeDust(70);

    /* Text beats. Each one owns a window of the scroll and is driven from
       the same progress value the canvas uses, so type and picture can
       never disagree about where the page is. */
    this.beats = d.$$("[data-beat]", section).map(function (node) {
      var r = (node.dataset.beat || "0,1").split(",").map(parseFloat);
      return {
        node: node,
        inA: r[0], inB: r[1],
        outA: r[2], outB: r[3],   /* both undefined on a beat that holds */
        shown: null
      };
    });

    this.build();
  }

  Gate.prototype.build = function () {
    var section = this.section;

    section.style.setProperty("--gate-travel", this.travel + "vh");

    this.stage = d.el("div", { class: "gate__stage" });
    this.canvas = d.el("canvas", { class: "gate__canvas", "aria-hidden": "true" });
    this.stage.appendChild(this.canvas);

    /* The type lives inside the stage so it is pinned with the picture, and
       it is moved rather than re-created so that whatever the page already
       had in the markup keeps its position in the document order. */
    var layer = d.$(".gate__type", section);
    if (layer) this.stage.appendChild(layer);

    section.insertBefore(this.stage, section.firstChild);

    this.ctx = this.canvas.getContext("2d", { alpha: false });

    if (!noiseTile) noiseTile = buildNoise();
    this.noise = this.ctx.createPattern(noiseTile, "repeat");

    if (this.reduced) section.classList.add("gate--still");

    this.resize();
    section.classList.add("is-ready");
  };

  Gate.prototype.resize = function () {
    var rect = this.stage.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    if (w === this.w && h === this.h && dpr === this.dpr) return;

    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.p = -1;                   /* force a repaint at the new size */
  };

  /* ---------------------------------------------------------------------- */
  /* Progress                                                               */
  /* ---------------------------------------------------------------------- */
  /* How far the page has scrolled through the shell, 0 at the moment the
     stage pins and 1 as it releases. Read from the shell's own box rather
     than from a stored offset, so it stays correct when anything above it
     on the page changes height. */

  Gate.prototype.progress = function () {
    if (this.reduced) return 0.62;

    var rect = this.section.getBoundingClientRect();
    var range = this.section.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp01(-rect.top / range);
  };

  /* ---------------------------------------------------------------------- */
  /* The picture                                                            */
  /* ---------------------------------------------------------------------- */

  Gate.prototype.draw = function (p) {
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    var e = easeInOut(p);

    /* The vanishing point sits a little above centre, which puts more of the
       court floor in frame than sky and reads as standing on the ground
       rather than floating above it. It lifts fractionally as the camera
       pushes in. */
    var vx = w * 0.5;
    var vy = h * (0.505 - 0.03 * e);

    /* The aperture: the hole in the tunnel you are walking toward. It starts
       narrow and ends larger than the screen, at which point the walls have
       gone and the court owns the whole frame. */
    var ax = w * lerp(0.26, 1.18, e);
    var ay = h * lerp(0.30, 1.18, e);

    var aL = vx - ax, aR = vx + ax;
    var aT = vy - ay, aB = vy + ay;

    ctx.fillStyle = C.pineDeep;
    ctx.fillRect(0, 0, w, h);

    /* ---- everything beyond the gate, clipped to the opening ------------- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(aL, aT, aR - aL, aB - aT);
    ctx.clip();

    this.drawSky(ctx, w, h, vx, vy, e);
    this.drawFloor(ctx, w, h, vx, vy, p, e);
    this.drawGlow(ctx, w, h, vx, vy, e);
    this.drawDust(ctx, w, h, vx, vy, p, e);

    ctx.restore();

    /* ---- the tunnel itself --------------------------------------------- */
    this.drawWalls(ctx, w, h, aL, aR, aT, aB, e);
    this.drawRim(ctx, aL, aR, aT, aB, e);

    /* ---- grade ---------------------------------------------------------- */
    this.drawVignette(ctx, w, h, e);

    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = this.noise;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  /* Sky above the far horizon: pine at the top falling to the warm band the
     floodlights throw along the skyline. */
  Gate.prototype.drawSky = function (ctx, w, h, vx, vy, e) {
    var g = ctx.createLinearGradient(0, 0, 0, vy);
    g.addColorStop(0, C.pineDeep);
    g.addColorStop(0.55, C.pine);
    g.addColorStop(1, C.moss);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, vy + 1);

    /* Floodlight rig. Distant heads seen across a pitch: a small hot core
       with a tight falloff, not a wide soft blob. The blob version read as
       a smudge on the lens rather than as a lamp, and four of them turned
       the top third of the frame into green haze. */
    var lamps = [-0.66, -0.24, 0.24, 0.66];
    for (var i = 0; i < lamps.length; i++) {
      var lx = vx + lamps[i] * w * 0.74;
      var ly = vy - h * (0.19 + 0.035 * Math.abs(lamps[i]));
      var rad = h * (0.045 + 0.035 * e);

      var lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, rad);
      lg.addColorStop(0, rgba(C.bone, 0.62 + 0.2 * e));
      lg.addColorStop(0.16, rgba(C.bone, 0.26));
      lg.addColorStop(0.45, rgba(C.optic, 0.07));
      lg.addColorStop(1, rgba(C.optic, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(lx - rad, ly - rad, rad * 2, rad * 2);

      /* The horizontal streak a bright lamp leaves across a long lens. One
         thin band each, which is what makes them read as lights rather than
         as dots. */
      var sw = rad * 3.4;
      var sg = ctx.createLinearGradient(lx - sw, ly, lx + sw, ly);
      sg.addColorStop(0, rgba(C.bone, 0));
      sg.addColorStop(0.5, rgba(C.bone, 0.12 + 0.06 * e));
      sg.addColorStop(1, rgba(C.bone, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(lx - sw, ly - 1, sw * 2, 2);
    }
  };

  /* The court. Lines converge on the vanishing point; cross lines are spaced
     by depth so they bunch toward the horizon and open out underfoot. The
     whole floor scrolls toward the viewer as progress advances, which is
     what actually sells the forward travel. */
  Gate.prototype.drawFloor = function (ctx, w, h, vx, vy, p, e) {
    var floor = h - vy;
    if (floor <= 0) return;

    var g = ctx.createLinearGradient(0, vy, 0, h);
    g.addColorStop(0, C.moss);
    g.addColorStop(0.45, C.pine);
    g.addColorStop(1, C.pineDeep);
    ctx.fillStyle = g;
    ctx.fillRect(0, vy, w, floor);

    ctx.lineCap = "butt";

    /* Cross lines. z is depth; screen y is vy + floor / z, so z=1 is the
       bottom edge and large z crowds up against the horizon. Advancing the
       offset with progress walks the whole set toward the camera. */
    var offset = (p * 6) % 1;
    for (var i = 0; i < 26; i++) {
      var z = 1 + (i + offset) * 0.58;
      var y = vy + floor / z;
      if (y > h + 2 || y < vy) continue;

      /* Near lines are bright and thick, far ones fade into the horizon. */
      var near = clamp01(1 / z);
      var a = near * near * 0.5;
      if (a < 0.004) continue;

      ctx.strokeStyle = rgba(C.chalk, a);
      ctx.lineWidth = Math.max(0.6, near * 2.4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    /* Lane lines, drawn from the vanishing point out to the bottom edge. In
       a true perspective these are straight, so one line each is enough. */
    var lanes = [-2.6, -1.55, -0.72, -0.24, 0.24, 0.72, 1.55, 2.6];
    for (var j = 0; j < lanes.length; j++) {
      var spread = lanes[j] * w * 0.5;
      var edge = 1 - clamp01(Math.abs(lanes[j]) / 3.1);

      ctx.strokeStyle = rgba(C.chalk, 0.05 + edge * 0.16);
      ctx.lineWidth = 0.8 + edge * 1.5;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + spread, h);
      ctx.stroke();
    }

    /* The one optic line down the middle: the club's single accent, used
       here exactly as the token file asks — as signal, once. */
    ctx.strokeStyle = rgba(C.optic, 0.1 + 0.2 * e);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx, h);
    ctx.stroke();

    /* The centre circle, coming toward the viewer. A grid of lines alone is
       an abstraction; this is the mark that makes the floor unmistakably a
       court, and walking up to it is the whole point of the move. A circle
       lying on the ground plane projects to an ellipse, foreshortened hard
       because the camera is low. */
    var cz = 3.15 - p * 2.05;
    if (cz > 1.02) {
      var cy = vy + floor / cz;
      var cr = (w * 0.19) / cz;
      var near = clamp01(1 / cz);

      ctx.strokeStyle = rgba(C.chalk, 0.06 + near * 0.24);
      ctx.lineWidth = Math.max(0.7, near * 2.2);
      ctx.beginPath();
      ctx.ellipse(vx, cy, cr, cr * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      /* The halfway line it sits on. */
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    }

    /* A wet sheen along the front of the floor, so the near edge has some
       depth instead of ending on a flat fill. */
    var sh = ctx.createLinearGradient(0, h - floor * 0.42, 0, h);
    sh.addColorStop(0, rgba(C.optic, 0));
    sh.addColorStop(1, rgba(C.optic, 0.05 + 0.05 * e));
    ctx.fillStyle = sh;
    ctx.fillRect(0, h - floor * 0.42, w, floor * 0.42);
  };

  /* The light at the end of it. Grows and warms as the gate opens, and is
     what the eye is actually walking toward. */
  Gate.prototype.drawGlow = function (ctx, w, h, vx, vy, e) {
    /* Concentrated at the vanishing point rather than spread across the
       frame. A wide, strongly optic-tinted bloom turned the whole middle of
       the picture green and left nothing for the accent to signal against;
       the club's one accent colour works when it is the brightest thing in
       a restrained frame, not when it is the frame. */
    var rad = Math.max(w, h) * (0.22 + 0.32 * e);

    var g = ctx.createRadialGradient(vx, vy, 0, vx, vy, rad);
    g.addColorStop(0, rgba(C.bone, 0.34 + 0.30 * e));
    g.addColorStop(0.10, rgba(C.bone, 0.15 + 0.12 * e));
    g.addColorStop(0.27, rgba(C.optic, 0.09 + 0.07 * e));
    g.addColorStop(0.60, rgba(C.maple, 0.03));
    g.addColorStop(1, rgba(C.pine, 0));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(vx - rad, vy - rad, rad * 2, rad * 2);

    /* A thin band of haze sitting exactly on the horizon line separates the
       court from the sky without drawing an actual edge. */
    var band = h * 0.035;
    var bg = ctx.createLinearGradient(0, vy - band, 0, vy + band);
    bg.addColorStop(0, rgba(C.optic, 0));
    bg.addColorStop(0.5, rgba(C.optic, 0.06 + 0.06 * e));
    bg.addColorStop(1, rgba(C.optic, 0));
    ctx.fillStyle = bg;
    ctx.fillRect(0, vy - band, w, band * 2);
    ctx.restore();
  };

  Gate.prototype.drawDust = function (ctx, w, h, vx, vy, p, e) {
    var span = Math.max(w, h);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < this.dust.length; i++) {
      var m = this.dust[i];

      /* Walk each mote toward the camera and wrap it around, so the field
         never empties out however far the page is scrolled. */
      var z = (m.z + p * 0.85) % 1;
      var scale = 0.15 + z * 1.5;

      var x = vx + Math.cos(m.a) * m.r * span * 0.52 * scale;
      var y = vy + Math.sin(m.a) * m.r * span * 0.34 * scale;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;

      /* Fade in as it arrives and back out as it passes, so nothing ever
         pops on or off at the edge of the frame. */
      var a = m.o * Math.sin(z * Math.PI) * (0.45 + 0.55 * e);
      if (a <= 0.004) continue;

      ctx.fillStyle = rgba(C.bone, a);
      ctx.beginPath();
      ctx.arc(x, y, m.s * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  /* The tunnel walls: the frame left over between the screen and the
     aperture. Four quads, each shaded so the surface closest to the opening
     catches the light coming back through it. */
  Gate.prototype.drawWalls = function (ctx, w, h, aL, aR, aT, aB, e) {
    var quad = function (pts, grad) {
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
      ctx.fill();
    };

    var lit = 0.4 + 0.35 * e;

    if (aL > 0) {
      var lg = ctx.createLinearGradient(0, 0, aL, 0);
      lg.addColorStop(0, C.pineDeep);
      lg.addColorStop(0.72, "#071f1b");
      lg.addColorStop(1, rgba(C.moss, lit));
      quad([0, 0, aL, aT, aL, aB, 0, h], lg);
    }

    if (aR < w) {
      var rg = ctx.createLinearGradient(w, 0, aR, 0);
      rg.addColorStop(0, C.pineDeep);
      rg.addColorStop(0.72, "#071f1b");
      rg.addColorStop(1, rgba(C.moss, lit));
      quad([w, 0, aR, aT, aR, aB, w, h], rg);
    }

    if (aT > 0) {
      var tg = ctx.createLinearGradient(0, 0, 0, aT);
      tg.addColorStop(0, "#03110F");
      tg.addColorStop(1, rgba(C.pine, lit));
      quad([0, 0, w, 0, aR, aT, aL, aT], tg);
    }

    if (aB < h) {
      var bg = ctx.createLinearGradient(0, h, 0, aB);
      bg.addColorStop(0, "#03110F");
      bg.addColorStop(1, rgba(C.pine, 0.5 + 0.3 * e));
      quad([0, h, w, h, aR, aB, aL, aB], bg);
    }

    /* Gate slats down the side walls. They are what makes the walls read as
       a gate rather than as two dark rectangles, and because they converge
       on the aperture they also carry the forward travel. */
    if (aL > 2 || aR < w - 2) {
      ctx.save();
      ctx.strokeStyle = rgba(C.chalk, 0.05 + 0.03 * e);
      ctx.lineWidth = 1;
      for (var s = 1; s <= 7; s++) {
        var t = s / 8;
        if (aL > 2) {
          ctx.beginPath();
          ctx.moveTo(aL * t, lerp(0, aT, t));
          ctx.lineTo(aL * t, lerp(h, aB, t));
          ctx.stroke();
        }
        if (aR < w - 2) {
          var xr = w - (w - aR) * t;
          ctx.beginPath();
          ctx.moveTo(xr, lerp(0, aT, t));
          ctx.lineTo(xr, lerp(h, aB, t));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };

  /* Light spilling around the edge of the opening. A single hairline plus a
     soft bleed either side of it; this is the detail that makes the gate
     look lit from behind rather than cut out of paper. */
  Gate.prototype.drawRim = function (ctx, aL, aR, aT, aB, e) {
    var a = 0.34 + 0.34 * e;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = rgba(C.optic, 0.5);
    ctx.shadowBlur = 22 + 26 * e;
    ctx.lineWidth = 1.25;

    /* Four edges rather than one strokeRect, each fading out toward its
       ends. A rectangle of uniform brightness reads as a drawn border —
       corners and all — where light escaping around a door is strongest
       along the middle of each edge and dies at the corners. */
    var edge = function (x1, y1, x2, y2) {
      var g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, rgba(C.optic, 0));
      g.addColorStop(0.22, rgba(C.optic, a));
      g.addColorStop(0.78, rgba(C.optic, a));
      g.addColorStop(1, rgba(C.optic, 0));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    edge(aL, aT, aR, aT);
    edge(aL, aB, aR, aB);
    edge(aL, aT, aL, aB);
    edge(aR, aT, aR, aB);

    ctx.restore();
  };

  Gate.prototype.drawVignette = function (ctx, w, h, e) {
    var r = Math.hypot(w, h) * 0.62;
    var g = ctx.createRadialGradient(w / 2, h * 0.5, r * 0.34, w / 2, h * 0.5, r);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0," + (0.5 - 0.12 * e) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  /* ---------------------------------------------------------------------- */
  /* Type                                                                   */
  /* ---------------------------------------------------------------------- */
  /* Each beat fades and lifts across its own window of the same progress
     value that drives the canvas. A beat given only an in-range holds at
     full strength to the end of the shell, which is how the last one stays
     on screen while the outro arrives underneath it. */

  Gate.prototype.type = function (p) {
    for (var i = 0; i < this.beats.length; i++) {
      var b = this.beats[i];
      var o, shift;

      if (p < b.inA) {
        o = 0; shift = 26;
      } else if (p < b.inB) {
        var t = smoother((p - b.inA) / (b.inB - b.inA));
        o = t; shift = 26 * (1 - t);
      } else if (b.outA === undefined || p < b.outA) {
        o = 1; shift = 0;
      } else if (p < b.outB) {
        var u = smoother((p - b.outA) / (b.outB - b.outA));
        o = 1 - u; shift = -22 * u;
      } else {
        o = 0; shift = -22;
      }

      /* Quantised before comparing, so a beat that is simply sitting still
         does not touch the DOM sixty times a second.

         Finely, though. Rounding the offset to whole pixels meant the type
         could only ever land on twenty-six positions across its travel, and
         on a slow scroll that reads as the words stepping rather than
         gliding. A tenth of a pixel is past what anyone can see and still
         skips the vast majority of redundant writes. */
      var key = Math.round(o * 1000) + ":" + Math.round(shift * 10);
      if (key === b.shown) continue;
      b.shown = key;

      b.node.style.opacity = o.toFixed(3);
      b.node.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      /* Nothing under a fully faded beat should be clickable or reachable. */
      b.node.style.visibility = o < 0.02 ? "hidden" : "visible";
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Loop                                                                   */
  /* ---------------------------------------------------------------------- */

  /* Paint the picture at wherever the scroll is right now, with no easing.
     Used for the first frame and after a resize, where catching up smoothly
     from a stale value would just be a glitch. */
  Gate.prototype.update = function () {
    var p = this.progress();
    this.eased = p;
    if (p === this.p) return;
    this.p = p;
    this.draw(p);
    this.type(p);
  };

  /* Runs every frame while the shell is near the viewport, easing the drawn
     progress toward the scrolled one. */
  Gate.prototype.tick = function (time) {
    var target = this.progress();

    if (this.eased === null || this.reduced) {
      this.eased = target;
    } else {
      /* Frame-rate independent damping: the fraction caught up depends on
         how much time actually passed, so the motion is identical at 60Hz
         and 144Hz rather than being four times faster on the better screen.
         dt is clamped because a backgrounded tab hands back one enormous
         delta on its first frame, which would otherwise snap the picture. */
      var dt = this.time ? Math.min(64, time - this.time) : 16.7;
      this.eased += (target - this.eased) * (1 - Math.exp(-dt / SMOOTH_MS));

      /* Settle exactly, so the loop can go quiet instead of chasing an
         asymptote it never reaches. */
      if (Math.abs(target - this.eased) < EPSILON) this.eased = target;
    }

    this.time = time;

    if (Math.abs(this.eased - this.p) < EPSILON) return;
    this.p = this.eased;
    this.draw(this.eased);
    this.type(this.eased);
  };

  Gate.prototype.hook = function () {
    var self = this;

    /* Chain rather than replace, so a page running more than one
       scroll-driven piece keeps them all.

       This listens on the per-frame hook rather than the scroll one: the
       easing above has to keep running after the wheel has stopped in order
       to finish arriving, and an edge-triggered scroll callback stops firing
       the moment the page goes still. */
    var prev = TOSS.scroll && TOSS.scroll.onFrame;
    this.prevOnFrame = typeof prev === "function" ? prev : null;

    this.hooked = function (time) {
      if (self.prevOnFrame) self.prevOnFrame(time);
      if (self.live) self.tick(time);
    };

    TOSS.scroll.onFrame = this.hooked;
  };

  Gate.prototype.observe = function () {
    var self = this;

    if (!("IntersectionObserver" in window)) {
      this.live = true;
      return;
    }

    /* A generous margin, so the first paint has already happened by the time
       the stage reaches the screen. */
    new IntersectionObserver(function (entries) {
      self.live = entries[0].isIntersecting;
      if (self.live) self.update();
    }, { rootMargin: "120% 0px 120% 0px" }).observe(this.section);
  };

  /* ---------------------------------------------------------------------- */
  /* Boot                                                                   */
  /* ---------------------------------------------------------------------- */

  var instances = [];

  function init() {
    var nodes = d.$$("[data-gate]");
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      if (node.__gate) return;
      var g = new Gate(node);
      node.__gate = g;
      instances.push(g);
      g.hook();
      g.observe();
      g.update();
    });

    var t = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(t);
      t = window.setTimeout(function () {
        instances.forEach(function (g) { g.resize(); g.update(); });
      }, 120);
    }, { passive: true });

    /* A phone rotating changes both axes at once and fires resize before the
       new viewport has settled, so it gets a second pass. */
    window.addEventListener("orientationchange", function () {
      window.setTimeout(function () {
        instances.forEach(function (g) { g.resize(); g.update(); });
      }, 260);
    });
  }

  TOSS.gate = {
    init: init,
    refresh: function () {
      instances.forEach(function (g) { g.resize(); g.update(); });
    }
  };
})();
