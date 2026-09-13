# Thalassa

A scroll-scrubbed cinematic hero for a Greek cliffside restaurant, built with Next.js
15 (App Router), React 19 and Framer Motion 11.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Status: the hero footage is a placeholder

**Step 1 of the brief could not be carried out.** The Runway MCP server connected to
this project exposes only management and read tools — `list_models`, `get_task`,
avatars, model routers. There is **no `text_to_video` (or any generation) tool**
available to call, and `get_credit_balance` reports **0 credits**, so a generation
request would fail even if the tool were present.

Rather than leave the hero empty, `scripts/make-placeholder-hero.mjs` synthesises a
10s / 24fps / 1920×1080 plate that follows the same beat structure as the brief —
exterior cliffside push-in, interior fly-through, exit through a doorway, pull back
over the sea — in the specified warm sunset palette. It is procedural, not
photoreal, and is meant to be replaced.

Everything downstream of it is real: the ffprobe/ffmpeg extraction, the 240 JPEG
frames, the frame count, the canvas scrub, and all verification.

### Swapping in the real render

1. Put the genuine `hero.mp4` in the project root.
2. `npm run frames`

That script re-probes the video, re-extracts every frame at 1920px wide, counts the
files **actually written to disk**, copies them to `public/frames/`, copies the video
to `public/hero.mp4`, and rewrites `FRAME_COUNT` in
`app/components/ScrollHero.tsx` to match. No manual edit is needed, and the count
never comes from ffprobe's `nb_frames` estimate.

`ExperienceSection` references `/frames/frame_0072.jpg` as its supporting image —
point that at a frame that suits the new footage.

## The scroll hero

`app/components/ScrollHero.tsx` — a 500vh container with a sticky 100vh stage. No
`<video>` element, and no scroll event listener: a single `requestAnimationFrame`
loop reads `getBoundingClientRect()`, computes progress once, and publishes it to a
Framer Motion `MotionValue`. The canvas frame index and all four text beats derive
from that one value.

### Two failure modes it is built to avoid

**The text overlay is never gated on image loading.** The overlay wrapper carries no
`opacity: loaded ? 1 : 0` condition. Each block's visibility comes only from its own
scroll-driven motion value, so text is never held hostage by 240 preloading JPEGs.
The single exception is the identity block's one-time mount entrance, which is
deliberately time-based because it has to play before any scroll input exists.

**The frame tracker never advances past an image that has not loaded.** `draw()`
returns a boolean — `true` only when a real bitmap was painted, `false` when all it
managed was the cream fallback. Two separate values are kept: `wanted.index` (what
the loop is aiming at) and `current.index` (what was actually painted). The rAF loop
retries its target on every tick while the draw keeps failing, and each image's
`onload` also attempts a draw if its index still matches `wanted`. Whichever happens
first wins, so a slow frame 0 cannot strand the canvas on a blank cream background.

Verified under a 1.5 Mbps / 300 ms throttle: `frame_0001.jpg` finished downloading at
4187 ms and the canvas painted it in the same interval, with no scroll input.

### The four beats

| Scroll progress | Beat |
|---|---|
| 0 → 0.14 | Identity block (label, h1, paragraph, CTA) fades out and lifts |
| 0.18 → 0.50 | Right-hand paragraph enters from +40px, holds, leaves |
| 0.54 → 0.87 | Left-hand paragraph enters from −40px, holds, leaves |
| 0.88 → 1.0 | Closing title + booking CTA rises in and **holds** to the end |

Each beat clears completely before the next begins. The closing block is the only
one that does not fade back out — it is the last thing on screen before the sticky
stage releases.

## Layout

`app/page.tsx` renders ScrollHero → Experience → Menu → Story → ClosingCTA. The
hero's sticky behaviour ends with its 500vh container; the rest of the page is
ordinary document flow on warm cream `#F4EFE7`.

Design tokens live in `app/tokens.ts`.

## Notes

- `postcss` is pinned via an `overrides` entry to a patched 8.5.x. Next 15.5.25
  depends on 8.4.31, which carries two advisories; the only npm-suggested fix was a
  major bump to Next 16, which the brief rules out. The override clears both with no
  major-version change — `npm audit` reports 0 vulnerabilities.
- ffmpeg is resolved by `scripts/ffmpeg-path.mjs`, which falls back to the winget
  install location when a shell's PATH predates the install.
- `public/frames/` and `hero.mp4` are gitignored — they are build artifacts of
  `npm run frames`.
