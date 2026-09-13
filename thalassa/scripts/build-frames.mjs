/**
 * Step 2 of the build: probe hero.mp4, extract every frame as JPEG at 1920px wide,
 * count what actually landed on disk, publish to public/, and write that exact count
 * into ScrollHero.tsx.
 *
 * The count comes from readdir, never from ffprobe's nb_frames, which is an estimate
 * and is routinely off by one from what ffmpeg really writes.
 *
 * Usage: npm run frames            (uses ./hero.mp4)
 *        npm run frames -- path/to/other.mp4
 */
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { ffmpeg, ffprobe } from './ffmpeg-path.mjs'

const src = process.argv[2] || 'hero.mp4'
if (!existsSync(src)) {
  console.error(`${src} not found.`)
  process.exit(1)
}

console.log(`ffprobe ${src}`)
const probe = execFileSync(
  ffprobe,
  [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=r_frame_rate,duration,nb_frames',
    '-of', 'default=noprint_wrappers=1',
    src,
  ],
  { encoding: 'utf8' }
)
console.log(probe.trim().split('\n').map((l) => `  ${l}`).join('\n'))

rmSync('frames', { recursive: true, force: true })
mkdirSync('frames', { recursive: true })

console.log('extracting frames at fps=24, 1920px wide')
execFileSync(
  ffmpeg,
  [
    '-v', 'error',
    '-i', src,
    '-vf', 'fps=24,scale=1920:-1',
    '-q:v', '3',
    'frames/frame_%04d.jpg',
  ],
  { stdio: 'inherit' }
)

// authoritative count: the files that actually exist
const files = readdirSync('frames').filter((f) => /^frame_\d{4}\.jpg$/.test(f))
const FRAME_COUNT = files.length
if (FRAME_COUNT === 0) {
  console.error('no frames were extracted')
  process.exit(1)
}
console.log(`FRAME_COUNT = ${FRAME_COUNT} (counted on disk)`)

rmSync('public/frames', { recursive: true, force: true })
mkdirSync('public', { recursive: true })
cpSync('frames', 'public/frames', { recursive: true })
cpSync(src, 'public/hero.mp4')
console.log('copied -> public/frames and public/hero.mp4')

const heroPath = 'app/components/ScrollHero.tsx'
if (existsSync(heroPath)) {
  const before = readFileSync(heroPath, 'utf8')
  const after = before.replace(
    /const FRAME_COUNT = \d+/,
    `const FRAME_COUNT = ${FRAME_COUNT}`
  )
  if (after !== before) {
    writeFileSync(heroPath, after)
    console.log(`patched FRAME_COUNT in ${heroPath}`)
  } else if (!/const FRAME_COUNT = /.test(before)) {
    console.warn(`could not find FRAME_COUNT in ${heroPath} - set it to ${FRAME_COUNT} by hand`)
  } else {
    console.log(`${heroPath} already at ${FRAME_COUNT}`)
  }
}
