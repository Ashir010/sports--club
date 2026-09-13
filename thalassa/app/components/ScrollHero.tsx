'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { tokens } from '../tokens'

/**
 * Counted from the files actually present in public/frames, not from ffprobe's
 * nb_frames estimate. `npm run frames` rewrites this line after every extraction.
 */
const FRAME_COUNT = 240

const framePath = (i: number) =>
  `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`

// soft ease-out used by every beat in this hero
const EASE_OUT = [0.16, 1, 0.3, 1] as const

export default function ScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /**
   * Scroll progress is produced by the rAF loop below and published here, so the
   * canvas frame index and every text beat read from one single source. No scroll
   * event listener anywhere.
   */
  const progress = useMotionValue(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const images: HTMLImageElement[] = new Array(FRAME_COUNT)
    const size = { w: 0, h: 0 }

    /**
     * The frame the loop currently *wants* on screen, and the frame actually
     * painted. These are deliberately separate: the rAF loop ticks every ~16ms
     * while an image takes far longer to arrive over the network, so claiming an
     * index before its bitmap exists would strand the canvas on the cream
     * fallback forever. `current` only advances on a draw that really painted.
     */
    const wanted = { index: 0 }
    const current = { index: -1 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      size.w = w
      size.h = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /**
     * Cover-fit draw. Returns true only when a loaded bitmap was painted, false
     * when all that landed was the warm cream fallback — the caller uses that
     * answer to decide whether the frame may be marked as handled.
     */
    const draw = (index: number): boolean => {
      const { w, h } = size
      if (w === 0 || h === 0) return false

      ctx.fillStyle = tokens.bg
      ctx.fillRect(0, 0, w, h)

      const img = images[index]
      if (!img || !img.complete || img.naturalWidth === 0) return false

      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const scale = Math.max(w / iw, h / ih)
      const dw = iw * scale
      const dh = ih * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      return true
    }

    resize()

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.decoding = 'async'
      // Whichever happens first — this image finishing its download, or the next
      // rAF tick — paints the frame. Neither depends on the other's timing.
      img.onload = () => {
        if (i === wanted.index && draw(i)) current.index = i
      }
      img.src = framePath(i)
      images[i] = img
    }

    let raf = 0
    const tick = () => {
      const range = container.offsetHeight - window.innerHeight
      const top = container.getBoundingClientRect().top
      const p = range > 0 ? Math.max(0, Math.min(1, -top / range)) : 0
      progress.set(p)

      const target = Math.round(p * (FRAME_COUNT - 1))
      wanted.index = target
      // Retried every tick while the draw keeps failing, so a slow frame 0 is
      // picked up the moment it lands.
      if (target !== current.index && draw(target)) current.index = target

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      resize()
      if (!draw(wanted.index)) current.index = -1
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      for (const img of images) if (img) img.onload = null
    }
  }, [progress])

  // ---- beat 1: identity block scrolls away ----
  const identityOpacity = useTransform(progress, [0, 0.14], [1, 0])
  const identityY = useTransform(progress, [0, 0.14], [0, -64])
  const gradientOpacity = useTransform(progress, [0, 0.16], [1, 0])

  // ---- beat 2: right-hand paragraph ----
  const rightOpacity = useTransform(progress, [0.18, 0.27, 0.43, 0.5], [0, 1, 1, 0])
  const rightX = useTransform(progress, [0.18, 0.27, 0.43, 0.5], [40, 0, 0, 28])
  const rightY = useTransform(progress, [0.43, 0.5], [0, -30])

  // ---- beat 3: left-hand paragraph ----
  const leftOpacity = useTransform(progress, [0.54, 0.63, 0.8, 0.87], [0, 1, 1, 0])
  const leftX = useTransform(progress, [0.54, 0.63, 0.8, 0.87], [-40, 0, 0, -28])
  const leftY = useTransform(progress, [0.8, 0.87], [0, -26])

  // ---- beat 4: closing title + booking CTA, holds to the end ----
  const closingBackdrop = useTransform(progress, [0.86, 0.96], [0, 1])
  const closingOpacity = useTransform(progress, [0.88, 0.96], [0, 1])
  const closingY = useTransform(progress, [0.88, 0.96], [36, 0])

  return (
    <div ref={containerRef} style={{ height: '500vh', position: 'relative' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          background: tokens.bg,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/*
          No loading gate of any kind on this wrapper. Each block's visibility is
          owned solely by its own scroll-driven motion value.
        */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* warm cinematic scrim behind the opening text */}
          <motion.div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              opacity: gradientOpacity,
              background:
                'linear-gradient(to top, rgba(32,25,18,0.68) 0%, rgba(32,25,18,0.20) 45%, transparent 100%)',
            }}
          />

          {/* ---------- beat 1 ---------- */}
          <motion.div
            style={{
              position: 'absolute',
              left: 'clamp(1.5rem, 6vw, 6rem)',
              right: 'clamp(1.5rem, 6vw, 6rem)',
              bottom: 'clamp(3rem, 11vh, 7rem)',
              opacity: identityOpacity,
              y: identityY,
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.05, ease: EASE_OUT }}
              style={{
                fontFamily: tokens.body,
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: tokens.accentHover,
                // the mandated scrim is at its weakest this far up the frame, and
                // this label can land over bright limestone
                textShadow: '0 1px 16px rgba(32,25,18,0.9), 0 0 3px rgba(32,25,18,0.7)',
                marginBottom: '1.5rem',
              }}
            >
              Aegean Dining · Since 1987
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3, delay: 0.2, ease: EASE_OUT }}
              style={{
                fontFamily: tokens.display,
                fontWeight: 400,
                fontSize: 'clamp(2.8rem, 7vw, 6.5rem)',
                lineHeight: 1.02,
                letterSpacing: '-0.015em',
                color: '#F8F2E8',
                textShadow: '0 2px 40px rgba(32,25,18,0.55)',
                marginBottom: '1.6rem',
              }}
            >
              Thalassa
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.4, ease: EASE_OUT }}
              style={{
                fontFamily: tokens.body,
                fontWeight: 300,
                fontSize: 'clamp(0.95rem, 1.35vw, 1.08rem)',
                lineHeight: 1.7,
                color: '#F4EFE7',
                textShadow: '0 1px 22px rgba(32,25,18,0.75)',
                maxWidth: 460,
                marginBottom: '2.4rem',
              }}
            >
              A table cut into the cliff above the Aegean, where the fire is lit at
              five and the last hour of sun is the only clock we keep.
            </motion.p>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.55, ease: EASE_OUT }}
              whileHover={{ scale: 1.04, backgroundColor: tokens.accentHover }}
              whileTap={{ scale: 0.98 }}
              style={{
                pointerEvents: 'auto',
                border: 'none',
                cursor: 'pointer',
                background: tokens.accent,
                color: '#fff',
                fontFamily: tokens.body,
                fontWeight: 500,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '0.9rem 2.6rem',
              }}
            >
              Discover the Restaurant
            </motion.button>
          </motion.div>

          {/* ---------- beat 2 ---------- */}
          <motion.div
            style={{
              position: 'absolute',
              right: 'clamp(1.5rem, 6vw, 6.5rem)',
              left: 'clamp(1.5rem, 30vw, 50%)',
              top: '50%',
              translateY: '-50%',
              textAlign: 'right',
              opacity: rightOpacity,
              x: rightX,
              y: rightY,
            }}
          >
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: tokens.accentHover,
                textShadow: '0 1px 16px rgba(32,25,18,0.9), 0 0 3px rgba(32,25,18,0.7)',
                marginBottom: '1.2rem',
              }}
            >
              The Terrace
            </p>
            <p
              style={{
                fontFamily: tokens.display,
                fontWeight: 400,
                fontSize: 'clamp(1.35rem, 2.6vw, 2.2rem)',
                lineHeight: 1.34,
                color: '#F8F2E8',
                marginLeft: 'auto',
                maxWidth: 420,
                textShadow: '0 2px 28px rgba(32,25,18,0.55)',
              }}
            >
              Forty metres of limestone between your chair and the water.
            </p>
          </motion.div>

          {/* ---------- beat 3 ---------- */}
          <motion.div
            style={{
              position: 'absolute',
              left: 'clamp(1.5rem, 6vw, 6.5rem)',
              right: 'clamp(1.5rem, 30vw, 50%)',
              top: '50%',
              translateY: '-50%',
              opacity: leftOpacity,
              x: leftX,
              y: leftY,
            }}
          >
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: tokens.accentHover,
                textShadow: '0 1px 16px rgba(32,25,18,0.9), 0 0 3px rgba(32,25,18,0.7)',
                marginBottom: '1.2rem',
              }}
            >
              The Room
            </p>
            <p
              style={{
                fontFamily: tokens.display,
                fontWeight: 400,
                fontSize: 'clamp(1.35rem, 2.6vw, 2.2rem)',
                lineHeight: 1.34,
                color: '#F8F2E8',
                maxWidth: 420,
                textShadow: '0 2px 28px rgba(32,25,18,0.55)',
              }}
            >
              Inside, whitewash and olive wood hold the heat of the day until
              midnight.
            </p>
          </motion.div>

          {/* ---------- beat 4: holds at full opacity through the end ---------- */}
          <motion.div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              opacity: closingBackdrop,
              background:
                'radial-gradient(ellipse at center, rgba(32,25,18,0.6) 0%, rgba(32,25,18,0.25) 50%, transparent 78%)',
            }}
          />
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 clamp(1.5rem, 6vw, 5rem)',
              opacity: closingOpacity,
              y: closingY,
            }}
          >
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: tokens.accentHover,
                textShadow: '0 1px 16px rgba(32,25,18,0.9), 0 0 3px rgba(32,25,18,0.7)',
                marginBottom: '1.5rem',
              }}
            >
              Limited Seating · Golden Hour
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontWeight: 400,
                fontSize: 'clamp(2.4rem, 6vw, 5.2rem)',
                lineHeight: 1.06,
                letterSpacing: '-0.015em',
                color: '#F8F2E8',
                textShadow: '0 2px 34px rgba(32,25,18,0.6)',
                maxWidth: '18ch',
                marginBottom: '2.4rem',
              }}
            >
              The sunset table is yours.
            </h2>
            <motion.button
              type="button"
              whileHover={{ scale: 1.04, backgroundColor: tokens.accentHover }}
              whileTap={{ scale: 0.98 }}
              style={{
                pointerEvents: 'auto',
                border: 'none',
                cursor: 'pointer',
                background: tokens.accent,
                color: '#fff',
                fontFamily: tokens.body,
                fontWeight: 500,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '0.9rem 2.6rem',
              }}
            >
              Reserve Your Table
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
