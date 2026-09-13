# Toss Club

A multi-sport club website — pickleball, padel, badminton, table tennis,
basketball and football — with a working six-step court booking flow,
memberships, events, coaching, community matchmaking and a live availability
strip.

No build step, no dependencies. Open it and it runs.

---

## Running it

```bash
npm start
```

That starts the static server on port 8777, waits until it is actually
answering, and then opens the site in Chrome. The wait matters: launching the
browser at the same moment as the server lands on a connection-refused page
often enough to be annoying.

There is nothing to install first. `package.json` has no dependencies — the
launcher (`scripts/dev.mjs`) pulls `http-server` through `npx` on demand, and
falls back to the machine's default browser if Chrome is not installed where
it usually lives. `PORT=3000 npm start` moves the port. `npm run serve` starts
the same server without opening anything.

Opening the files directly from disk also works — the scripts are classic
`<script>` tags, not modules — but the OpenStreetMap embed on the Visit section
needs `http://` to load.

---

## How it is put together

```
index.html                  The intro. A scroll-scrubbed court tunnel, drawn
                            on a canvas, that hands off to home.html at the end.
home.html                   The site. Every section is independent.
scripts/dev.mjs             Dev server: serves, waits, opens Chrome.
assets/css/
  tokens.css                Colour, type, space, motion. The only file with raw values.
  base.css                  Reset, type scale, layout scaffolding, reveal + reduced motion.
  components.css            Buttons, chips, availability states, fields, nav, court plates.
  sections.css              One block per section, in page order.
  prologue.css              The cover and the three chapters of the front page.
  story.css                 Name bands, statement, chapter index, footer motto.
  intro.css                 The intro page: skip link, handoff panel, exit wash.
  gate.css                  The intro's drawn sequence: the pinned stage and its type.
assets/js/
  data/catalog.js           Club details, six sports, courts, facilities, gallery.
  data/programs.js          Memberships, events, coaching programmes, coaches.
  data/social.js            Players, leaderboards, groups, testimonials, FAQ.
  services/api.js           The service layer. Everything goes through it.
  lib/dom.js                Small DOM helpers, money formatting, icons, toasts.
  lib/courts.js             Generates the court drawings as SVG.
  app/ui.js                 Nav, drawer, scroll progress, reveals, counters, lightbox.
  app/prologue.js           The cover and its chapter backdrops.
  app/story.js              The looping name bands and the vertical scroll cue.
  app/gate.js               The intro sequence, drawn rather than filmed.
  app/intro.js              The intro page: smooth scroll, frame loop, handoff.
  app/discover.js           Live availability, sports selector, facilities, gallery.
  app/booking.js            The booking flow.
  app/programs.js           Memberships, events, coaching.
  app/community.js          Matchmaking, leaderboards, groups, reviews, FAQ, visit.
  main.js                   Boot.
```

Each view checks for its container and does nothing if it is absent, so
sections can be removed or reordered in `home.html` without breaking others.

---

## The front page

The front page is a cinematic prologue, modelled on collabcapitolium.fr: a
held cover, then one day at the club in three chapters — the outdoor courts at
06:10, the indoor hall at 17:40, the rig at 21:20 — before the live
availability strip hands over to the working sections below.

- The cover is filled edge to edge by the club's own court plans, cycling
  through all six sports and dilating as it is scrolled away. The motto is set
  in Bodoni Moda, which appears here and in the chapter titles and nowhere
  else; below about 2rem its hairlines stop holding on the pine ground.
- Chapter II cuts to the chalk ground. The tonal break is the point: the hall
  is lit, and a prologue that stayed dark throughout would read as one flat
  page rather than three places.
- The numbering is chronological, not decorative — the timestamps are the
  club's real hours, and the chapters run in the order the day does.

Each chapter is a tall shell wrapped around a sticky frame, so **CSS does the
pinning**. The scroll loop only publishes how far through the shell the page
has scrolled, as two custom properties on the shell: `--t`, 0 to 1 across the
travel, for scales and drifts; and `--f`, the arrival, which reaches 1 by the
time the frame settles and stays there. `--f` deliberately never falls — a
chapter that faded out before its frame released left the pin holding an empty
screen, so the text stays lit and slides away with its own frame while the
next chapter arrives underneath.

## The rest of the page

The same language runs to the foot of the page, so the site reads as one
piece rather than a cinematic front page bolted to an ordinary one.

- **Name bands.** Every section announces itself on a looping hairline band,
  the ball as the separator. A section asks for one by naming itself in
  markup — `<section data-marquee="Facilities">` — so the band is never a
  second copy of the heading that can drift out of sync with it. The band
  carries the section's short name and the heading beneath it says something
  else; three of them repeated their own heading at first, and adjacent
  duplication at that size reads as a bug rather than a device.
- **The statement** between the cover and the first chapter: one line, held.
- **The index** after the chapters: the three of them listed with their
  hours, as a recap and a way back into any part of the story.
- **The footer motto** hangs the cover's sentence across the foot of the page.
- **Bodoni** carries every section heading, not just the prologue's.

The working sections keep their working UI inside that frame. A booking flow
pinned like a chapter would look the part and be unusable, so the story
frames the tools rather than becoming them.

## Scroll

The scroll feel is Lenis smooth scrolling with no animation library behind it.
All of it lives in `assets/css/motion.css`, `assets/css/prologue.css` and
`assets/js/lib/scroll.js`, and it is entirely additive — with JavaScript off,
or reduced motion requested, the page falls back to ordinary native scrolling
with nothing hidden. Under reduced motion the shells collapse to their natural
height and the chapters become plain stacked sections.

- **Lenis** (vendored locally at `assets/js/vendor/lenis.min.js`, no CDN) gives
  the inertial, long-settling scroll. Anchors, the chapter rail and every
  "Book a court" jump route through it so they share the same easing.
- **Chapter rail** down the right edge on wide screens: progress fill, a dot
  per section, hover labels, and it inverts over the chalk chapters. The thin
  top progress line takes over below 1200px.
- **Unmask** — tiles are revealed by lifting a `clip-path` from the bottom
  edge rather than sliding up, so frames stay put and only the picture arrives.
- **Parallax** — the court drawing drifts inside its frame as the frame passes.
- **Scenes** — the pinned cover and chapters, scrubbed through `--t` / `--f`
  as described above. Scenes are clamped rather than skipped when off screen,
  so one the page has jumped clean over still settles on its end value.
- **Sports story** — a court holds still on the left while the six chapters
  pass on the right, redrawing as each takes over. Below 1024px the stage is
  dropped and every chapter carries its own court.
- **Cursor label** — a disc naming the action over openable media, on fine
  pointers only.
- **Name bands** — two identical runs side by side, the pair translated
  leftward, reset by exactly one run width when the first has left, so the
  seam never shows. Speed is a constant drift plus the scroll velocity, and
  the band never reverses, so the reading direction stays stable however the
  page is moved.

One frame loop drives the smoothing, the scenes, the rail, the parallax and
the unmasking; nothing else listens to `scroll`.

Two implementation notes worth keeping:

- The unmask is measured against scroll position rather than watched with an
  `IntersectionObserver`. A `clip-path` that collapses an element to zero
  height makes it report itself as *not* intersecting, so an observer would
  never fire and the mask could never lift itself.
- `overflow-x` is sealed on the root with `clip`, never on the body. Setting it
  on the body stops it propagating to the viewport, makes the body its own
  scroll container, and silently breaks every sticky element on the page.
  Wide children are contained where they live instead — see `contain: paint`
  on the comparison table's scroller.

## The visuals

Every image on the page is a **scale drawing of a real playing surface**,
generated as SVG in `lib/courts.js`. Line positions come from the actual
dimensions of each game — pickleball's 7 ft non-volley zone, padel's service
line 3 m from the back glass, badminton's doubles tramlines, basketball's
6.75 m arc that flattens into the corners. They render instantly, weigh
nothing, and never fail to load.

### Dropping in photographs

Photos layer on top of the drawings and fade in only once they have decoded, so
a missing file leaves the drawing in place rather than a broken image.

1. Put files in `assets/img/`.
2. Set the `data-photo-base` attribute on the relevant container in
   `home.html` to `assets/img/`.

The filename each container looks for:

| Container | Attribute location | Files it looks for |
|---|---|---|
| Sports panel | `#sportPlate` | same six sport ids |
| Facilities | `#facGrid` | `fac-padel.jpg`, `fac-pickle.jpg`, … (the `id` of each entry in `TOSS.facilities`) |
| Gallery | `#galleryGrid` | `g1.jpg` … `g10.jpg` |
| Coaches | `#coaches` | `co-1.jpg` … `co-6.jpg` |

Testimonial portraits are per-review: set `photo` on any entry in
`TOSS.testimonials`. Initials show if it is blank or fails to load.

---

## Connecting a backend

Nothing above `services/api.js` touches the data files directly. To go live:

```js
TOSS.api.config.mode = "live";
TOSS.api.config.baseUrl = "https://api.tossclub.in/v1";
TOSS.api.config.token = "<bearer token after sign-in>";
```

Every method then routes through `fetch` instead of the mock adapter. The
signatures and the shapes they resolve with do not change, so no view code
needs editing. The endpoints assumed:

```
GET  /club            GET  /sports            GET  /courts?sport=
GET  /facilities      GET  /availability?court=&date=
GET  /availability/window?days=   GET /availability/live
GET  /quote?...       POST /bookings          POST /payments/intent
GET  /memberships     POST /memberships/:id/subscribe
GET  /events          POST /events/:id/registrations
GET  /programs        GET  /coaches           POST /coaching/sessions
GET  /players?sport=&level=&when=   GET /leaderboard?sport=
GET  /groups  GET /reviews  GET /faq  GET /gallery  POST /messages
GET  /me              POST /auth/session
```

`getCurrentUser` already resolves to `null` (signed out) and `signIn` throws a
clear message, so the accounts work can start without touching the views.

### What the mock does honestly

- **Availability is deterministic.** A small string hash of
  `court + date + slot` gives repeatable pseudo-noise, so the same court on the
  same day always shows the same slots. Peak hours (18:00–22:00) and weekends
  are weighted fuller. Past slots on today are closed.
- **Pricing is computed in one place** (`getQuote`): per-half-hour peak/off-peak
  rate, membership discount, then 18% GST. Change the rule there and every
  surface follows.
- **Payment is not connected.** `createPaymentIntent` returns
  `provider: "not-connected"` and the confirmation screen says so plainly.
  Swap it for a Razorpay order or Stripe PaymentIntent.

---

## Still to wire up

`services/api.js` already has the seams; these need a backend behind them:
user accounts and authentication, real-time availability over a websocket
(the live strip currently polls every two minutes), payments, membership
subscriptions, event registration, player profiles and booking history,
notifications, and an admin surface for courts, pricing and events.

---

## Accessibility and responsiveness

- Verified with no horizontal scroll at 360px, 390px, 768px and 1024px.
- Availability never relies on colour alone: each of the three states has its
  own dot shape *and* a text label, everywhere it appears.
- Keyboard focus is visible throughout; the drawer and lightbox trap focus and
  close on Escape.
- `prefers-reduced-motion` stops the hero court rotation, the reveals and every
  transition.
- Tap targets meet the 24×24 CSS px minimum; primary actions are 44px or more.
- Mobile keeps a sticky booking bar with the live free-court count once you
  scroll past the hero.

---

## Content that is placeholder

The club is fictional. Address, phone, email, coach names, member reviews,
leaderboards and event listings are all realistic stand-ins. The location is
set to Sarjapur Road, Bengaluru — change `TOSS.club` in
`assets/js/data/catalog.js` and the address, map, directions, opening hours and
every footer link update together. Currency and number formatting follow
`TOSS.club.currency` and `TOSS.club.locale`.
