'use client'

import { tokens } from '../tokens'
import Reveal from './Reveal'

export default function ExperienceSection() {
  return (
    <section
      style={{
        background: tokens.bg,
        padding: 'clamp(6rem, 14vh, 10rem) clamp(1.5rem, 7vw, 7rem)',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <Reveal>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: tokens.accent,
              marginBottom: '2.5rem',
            }}
          >
            The Aegean Experience
          </p>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5rem)',
            alignItems: 'start',
          }}
        >
          <div>
            <Reveal index={1}>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontWeight: 400,
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.015em',
                  color: tokens.textPrimary,
                  marginBottom: '2rem',
                }}
              >
                Dinner begins when the rock turns gold.
              </h2>
            </Reveal>

            <Reveal index={2}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontWeight: 300,
                  fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
                  lineHeight: 1.85,
                  color: tokens.textBody,
                  marginBottom: '1.6rem',
                }}
              >
                We serve one sitting an evening, and we time it to the light. Guests
                arrive while the cliff still holds the afternoon heat, take the first
                plates on the terrace as the sun drops behind Sifnos, and finish by
                candle once the sea has gone dark and loud below.
              </p>
            </Reveal>

            <Reveal index={3}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontWeight: 300,
                  fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
                  lineHeight: 1.85,
                  color: tokens.textBody,
                  marginBottom: '2.8rem',
                }}
              >
                Almost everything on the table comes from within sight of it. Fish
                landed at the harbour that morning, tomatoes and capers from the
                terraces behind the kitchen, oil pressed from our own grove, and
                whatever the goats and the season have decided to offer that week.
              </p>
            </Reveal>

            <Reveal index={4}>
              <ul
                style={{
                  listStyle: 'none',
                  borderTop: `1px solid ${tokens.borderSubtle}`,
                }}
              >
                {[
                  ['Seating', 'Terrace, cliff edge, and the stone room'],
                  ['Hours', 'One sitting nightly, from 18:30'],
                  ['Kitchen', 'Wood fire, charcoal, and salt'],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1.5rem',
                      padding: '1.1rem 0',
                      borderBottom: `1px solid ${tokens.borderSubtle}`,
                      fontFamily: tokens.body,
                      fontWeight: 300,
                      fontSize: '0.92rem',
                      color: tokens.textBody,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: tokens.olive,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k}
                    </span>
                    <span style={{ textAlign: 'right' }}>{v}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal index={2}>
            <figure style={{ margin: 0 }}>
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: tokens.cream,
                  border: `1px solid ${tokens.borderSubtle}`,
                }}
              >
                {/* mid-sequence frame: the terrace, still in full sun */}
                <img
                  src="/frames/frame_0072.jpg"
                  alt="The cliffside terrace at Thalassa in late afternoon light"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '4 / 5',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <figcaption
                style={{
                  marginTop: '1.1rem',
                  fontFamily: tokens.body,
                  fontWeight: 300,
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: tokens.dim,
                  borderLeft: `2px solid ${tokens.accent}`,
                  paddingLeft: '0.9rem',
                }}
              >
                The west terrace, forty metres above the water. Eleven tables, and no
                second sitting.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
