/**
 * PLACEHOLDER FOOTAGE GENERATOR
 *
 * This exists only because the Runway MCP server available to this project exposes
 * no text_to_video generation tool (and the project credit balance is 0), so the
 * cinematic drone plate described in the brief could not be rendered.
 *
 * It synthesises a 10s / 24fps / 1920x1080 golden-hour Mediterranean sequence that
 * follows the same beat structure as the brief (exterior push-in, interior
 * fly-through, exit, pull back over the sea) so the scroll-scrub hero can be built
 * and verified against real frames.
 *
 * To swap in the genuine render: put hero.mp4 in the project root, run `npm run frames`.
 */
import { spawn } from 'node:child_process'
import { ffmpeg } from './ffmpeg-path.mjs'

const W = 1920
const H = 1080
const FPS = 24
const SECONDS = 10
const TOTAL = FPS * SECONDS

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const mix = (a, b, t) => a + (b - a) * t
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
const mixRGB = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]

// warm mediterranean sunset palette
const SKY_TOP = [92, 96, 118]
const SKY_MID = [201, 146, 122]
const SKY_LOW = [244, 196, 140]
const SUN_CORE = [255, 238, 206]
const SEA_NEAR_SUN = [222, 172, 122]
const SEA_MID = [60, 96, 116]
const SEA_DEEP = [30, 56, 76]
const ROCK_LIT = [206, 178, 141]
const ROCK_SHADE = [104, 84, 66]
const WASH_LIT = [246, 238, 226]
const WASH_SHADE = [198, 176, 158]
const TERRACOTTA = [184, 111, 75]
const OLIVE = [105, 112, 90]
const INT_WALL = [78, 58, 42]
const INT_FLOOR = [52, 38, 28]
const LAMP = [255, 206, 140]
const LINEN = [232, 221, 204]

// cliff top profile in world space
function cliffTop(wx) {
  return (
    0.52 +
    0.16 * Math.sin(wx * 2.1 - 0.6) +
    0.05 * Math.sin(wx * 5.3 + 1.2) +
    0.02 * Math.sin(wx * 11.7)
  )
}

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function frame(t, buf) {
  // camera: one continuous move, eased at both ends
  const fly = smooth(0, 1, t)
  const zoom = mix(1.0, 2.35, smooth(0, 0.52, t)) * mix(1, 0.62, smooth(0.82, 1, t))
  const camX = mix(-0.08, 0.16, fly) + 0.03 * Math.sin(t * Math.PI * 1.3)
  const camY = mix(0.0, 0.1, smooth(0, 0.5, t)) - 0.12 * smooth(0.84, 1, t)

  // interior occupancy: enters through the terrace, exits through a far doorway
  const inside = smooth(0.34, 0.46, t) * (1 - smooth(0.68, 0.79, t))

  const sunY = mix(0.4, 0.455, t)
  const sunX = 0.63

  for (let y = 0; y < H; y++) {
    const v = y / H
    for (let x = 0; x < W; x++) {
      const u = x / W
      // screen -> world
      const wx = (u - 0.5) / zoom + camX + 0.5
      const wy = (v - 0.5) / zoom + camY + 0.5

      let r, g, b

      // ---------- EXTERIOR ----------
      const horizon = 0.5
      if (wy < horizon) {
        const sky = clamp(wy / horizon)
        let c =
          sky < 0.55
            ? mixRGB(SKY_TOP, SKY_MID, smooth(0, 0.55, sky))
            : mixRGB(SKY_MID, SKY_LOW, smooth(0.55, 1, sky))
        // sun disc + bloom
        const dx = (wx - sunX) * 1.9
        const dy = wy - sunY
        const d = Math.sqrt(dx * dx + dy * dy)
        c = mixRGB(c, SUN_CORE, 0.85 * (1 - smooth(0.012, 0.05, d)))
        c = mixRGB(c, SUN_CORE, 0.5 * (1 - smooth(0.04, 0.34, d)))
        // soft cloud banding
        const band = 0.06 * Math.sin(wy * 42 + wx * 3 + 1.7) * smooth(0.1, 0.45, sky)
        r = c[0] + band * 60
        g = c[1] + band * 40
        b = c[2] + band * 24
      } else {
        const sea = clamp((wy - horizon) / (1 - horizon))
        let c = mixRGB(
          mixRGB(SEA_NEAR_SUN, SEA_MID, smooth(0, 0.28, sea)),
          SEA_DEEP,
          smooth(0.28, 1, sea)
        )
        // specular sun column
        const col = 1 - smooth(0.0, 0.16, Math.abs(wx - sunX) * (0.4 + sea * 2.6))
        const ripple = 0.5 + 0.5 * Math.sin(wy * 260 + Math.sin(wx * 34 + t * 5) * 2.2 + t * 9)
        const spec = col * ripple * (1 - smooth(0.5, 1, sea)) * 0.85
        c = mixRGB(c, SUN_CORE, spec * 0.7)
        // wave texture
        const w = 0.5 + 0.5 * Math.sin(wy * 150 + Math.sin(wx * 18) * 1.4 + t * 3)
        r = c[0] + w * 10 * sea
        g = c[1] + w * 10 * sea
        b = c[2] + w * 12 * sea
      }

      // cliff mass
      const top = cliffTop(wx)
      if (wy > top) {
        const depth = clamp((wy - top) / 0.55)
        const face = 0.5 + 0.5 * Math.sin(wx * 90 + wy * 30)
        const strata = 0.5 + 0.5 * Math.sin(wy * 70 + Math.sin(wx * 8) * 3)
        let c = mixRGB(ROCK_LIT, ROCK_SHADE, clamp(depth * 1.25 + face * 0.12 + strata * 0.1))
        // sun-warmed rim along the cliff edge
        c = mixRGB(c, SUN_CORE, 0.55 * (1 - smooth(0, 0.02, wy - top)))
        r = c[0]
        g = c[1]
        b = c[2]
      }

      // whitewashed restaurant volume sitting on the cliff
      const bx0 = 0.3
      const bx1 = 0.78
      const bTop = 0.505
      const bBot = 0.6
      if (wx > bx0 && wx < bx1 && wy > bTop && wy < bBot) {
        const lx = (wx - bx0) / (bx1 - bx0)
        const ly = (wy - bTop) / (bBot - bTop)
        let c = mixRGB(WASH_LIT, WASH_SHADE, clamp(ly * 0.85 + 0.15 * Math.sin(lx * 60)))
        // terrace openings (arched bays)
        const bay = Math.abs(((lx * 7) % 1) - 0.5)
        if (ly > 0.34 && bay < 0.26) {
          const glow = 1 - smooth(0.34, 1.0, ly)
          c = mixRGB(mixRGB(INT_WALL, LAMP, 0.42 + 0.3 * glow), c, 0.12)
        }
        // terracotta cap
        if (ly < 0.12) c = mixRGB(TERRACOTTA, SUN_CORE, 0.25)
        r = c[0]
        g = c[1]
        b = c[2]
      }

      // olive foliage clumps along the terrace edge
      const fx = (wx * 9) % 1
      const fCentre = 0.6 + 0.06 * Math.sin(Math.floor(wx * 9) * 21.3)
      if (wy > 0.585 && wy < 0.655 && Math.abs(fx - 0.5) < 0.3) {
        const d = Math.hypot((fx - 0.5) * 1.5, (wy - fCentre) * 6)
        if (d < 0.5) {
          const leaf = 0.5 + 0.5 * Math.sin(wx * 340 + wy * 210)
          const c = mixRGB(OLIVE, [138, 146, 118], leaf * 0.55 * (1 - d))
          const k = 1 - smooth(0.34, 0.5, d)
          r = mix(r, c[0], k)
          g = mix(g, c[1], k)
          b = mix(b, c[2], k)
        }
      }

      // ---------- INTERIOR ----------
      if (inside > 0.001) {
        const ix = u
        const iy = v
        // warm room: wall into floor
        let c = mixRGB(INT_WALL, INT_FLOOR, smooth(0.42, 1, iy))
        // ceiling beams
        if (iy < 0.3) {
          const beam = Math.abs(((ix * 6 + 0.5) % 1) - 0.5)
          c = mixRGB(c, [96, 68, 46], 1 - smooth(0.06, 0.13, beam))
        }
        // hanging lamps
        for (let l = 0; l < 4; l++) {
          const lxp = 0.16 + l * 0.23 + 0.035 * Math.sin(t * 1.6 + l)
          const lyp = 0.27 + 0.02 * Math.sin(t * 2.1 + l * 2)
          const d = Math.hypot(ix - lxp, (iy - lyp) * 1.78)
          c = mixRGB(c, LAMP, 0.95 * (1 - smooth(0.006, 0.022, d)))
          c = mixRGB(c, LAMP, 0.38 * (1 - smooth(0.02, 0.2, d)))
        }
        // linen-topped tables receding into the room
        for (let tb = 0; tb < 5; tb++) {
          const sc = 0.55 + tb * 0.2
          const txp = 0.5 + (tb - 2) * 0.19 * sc
          const typ = 0.58 + tb * 0.075
          const d = Math.hypot((ix - txp) / (0.085 * sc), (iy - typ) / (0.03 * sc))
          if (d < 1) {
            const lit = 1 - smooth(0.3, 1, d)
            c = mixRGB(c, mixRGB(LINEN, LAMP, 0.35), 0.9 * lit)
            // candle
            const cd = Math.hypot(ix - txp, (iy - typ + 0.016 * sc) * 1.78)
            c = mixRGB(c, [255, 228, 170], 1 - smooth(0.002, 0.012, cd))
          }
        }
        // the doorway the drone exits through, opening onto the sea
        const dw = smooth(0.55, 0.78, t)
        const dcx = mix(0.86, 0.5, dw)
        const dhw = mix(0.05, 0.62, dw)
        const dhh = mix(0.16, 0.75, dw)
        const dd = Math.max(Math.abs(ix - dcx) / dhw, Math.abs(iy - 0.5) / dhh)
        if (dd < 1) {
          const seaGlow = mixRGB(SUN_CORE, SEA_NEAR_SUN, smooth(0.4, 0.62, iy))
          const k = 1 - smooth(0.86, 1.0, dd)
          c = mixRGB(c, seaGlow, k * 0.96)
        }
        r = mix(r, c[0], inside)
        g = mix(g, c[1], inside)
        b = mix(b, c[2], inside)
      }

      // grade: warm lift, vignette, fine grain
      const vig = 1 - 0.42 * Math.pow(Math.hypot((u - 0.5) * 1.06, (v - 0.5) * 1.02) * 1.42, 2.1)
      r *= vig
      g *= vig
      b *= vig
      r = r * 1.035 + 9
      g = g * 1.005 + 5
      b = b * 0.965 + 2
      const grain = (hash(x * 0.37 + t * 13.1, y * 0.61) - 0.5) * 7
      const i = (y * W + x) * 3
      buf[i] = clamp(r + grain, 0, 255)
      buf[i + 1] = clamp(g + grain, 0, 255)
      buf[i + 2] = clamp(b + grain, 0, 255)
    }
  }
}

const out = process.argv[2] || 'hero.mp4'
const ff = spawn(
  ffmpeg,
  [
    '-y',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', `${W}x${H}`,
    '-r', String(FPS),
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    out,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] }
)

const buf = Buffer.allocUnsafe(W * H * 3)
let n = 0

function pump() {
  while (n < TOTAL) {
    frame(n / (TOTAL - 1), buf)
    n++
    if (n % 24 === 0) process.stderr.write(`  frame ${n}/${TOTAL}\n`)
    if (!ff.stdin.write(Buffer.from(buf))) {
      ff.stdin.once('drain', pump)
      return
    }
  }
  ff.stdin.end()
}
pump()

ff.on('close', (code) => {
  console.log(code === 0 ? `\nwrote ${out} (${TOTAL} frames @ ${FPS}fps)` : `\nffmpeg exited ${code}`)
  process.exit(code ?? 1)
})
