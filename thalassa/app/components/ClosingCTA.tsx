'use client'

import { motion } from 'framer-motion'
import { tokens } from '../tokens'
import Reveal from './Reveal'

export default function ClosingCTA() {
  return (
    <section
      style={{
        position: 'relative',
        background: tokens.bg,
        borderTop: `1px solid ${tokens.borderSubtle}`,
        padding: 'clamp(6rem, 16vh, 11rem) clamp(1.5rem, 7vw, 7rem)',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* very subtle warm glow behind the call to action */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(1100px, 140%)',
          height: '120%',
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse, rgba(184,111,75,0.12) 0%, transparent 70%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
        <Reveal>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: tokens.accent,
              marginBottom: '2.2rem',
            }}
          >
            Join Us by the Aegean
          </p>
        </Reveal>

        <Reveal index={1}>
          <h2
            style={{
              fontFamily: tokens.display,
              fontWeight: 400,
              fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              color: tokens.textPrimary,
              marginBottom: '2rem',
            }}
          >
            Come for the view.
            <br />
            <em style={{ fontStyle: 'italic' }}>Stay for the experience.</em>
          </h2>
        </Reveal>

        <Reveal index={2}>
          <p
            style={{
              fontFamily: tokens.body,
              fontWeight: 300,
              fontSize: 'clamp(1rem, 1.3vw, 1.1rem)',
              lineHeight: 1.8,
              color: tokens.textBody,
              maxWidth: 480,
              margin: '0 auto 3rem',
            }}
          >
            Eleven tables, one sitting a night, and a sunset that does not wait.
            Reservations open sixty days ahead and we hold the cliff-edge two back
            for whoever asks first.
          </p>
        </Reveal>

        <Reveal index={3}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, backgroundColor: '#9E5C3C' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.25, 0, 0, 1] }}
            style={{
              border: 'none',
              cursor: 'pointer',
              background: tokens.accent,
              color: '#fff',
              fontFamily: tokens.body,
              fontWeight: 500,
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '1rem 3rem',
            }}
          >
            Reserve a Table
          </motion.button>
        </Reveal>

        <Reveal index={4}>
          <p
            style={{
              marginTop: '2.6rem',
              fontFamily: tokens.body,
              fontWeight: 300,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              color: tokens.dim,
            }}
          >
            Cliff Road, Kastro · Dinner from 18:30, Tuesday to Sunday
          </p>
        </Reveal>
      </div>
    </section>
  )
}
