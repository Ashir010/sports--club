'use client'

import { tokens } from '../tokens'
import Reveal from './Reveal'

export default function StorySection() {
  return (
    <section
      style={{
        background: tokens.bg,
        padding: 'clamp(5rem, 12vh, 9rem) clamp(1.5rem, 7vw, 7rem)',
        borderTop: `1px solid ${tokens.borderSubtle}`,
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
            Our Story
          </p>
        </Reveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5.5rem)',
            alignItems: 'start',
          }}
        >
          <Reveal index={1}>
            <h2
              style={{
                fontFamily: tokens.display,
                fontWeight: 400,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                lineHeight: 1.12,
                letterSpacing: '-0.015em',
                color: tokens.textPrimary,
                maxWidth: '14ch',
              }}
            >
              Where the sea meets the table.
            </h2>
          </Reveal>

          <div>
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
                Thalassa began in 1987 as four tables outside a fisherman&rsquo;s
                house, run by a family who cooked whatever came back in the nets.
                The walls were whitewashed every spring, the wine came from the
                barrel in the back room, and the only menu was whatever Yiayia
                Eleni announced when you sat down.
              </p>
            </Reveal>

            <Reveal index={3}>
              <blockquote
                style={{
                  fontFamily: tokens.display,
                  fontWeight: 400,
                  fontSize: 'clamp(1.3rem, 2.3vw, 1.85rem)',
                  lineHeight: 1.45,
                  color: tokens.textPrimary,
                  borderLeft: `2px solid ${tokens.accent}`,
                  paddingLeft: 'clamp(1.2rem, 2.5vw, 2rem)',
                  margin: '2.4rem 0',
                }}
              >
                Three generations later the nets are the same, and so is the
                answer when you ask what is good tonight.
              </blockquote>
            </Reveal>

            <Reveal index={4}>
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
                The room above the cliff came later, cut into the rock rather than
                built onto it, so that the stone stays cool through August and the
                whole west wall can open to the water. Nothing about it is meant to
                compete with the view; the architecture is there to get out of its
                way.
              </p>
            </Reveal>

            <Reveal index={5}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontWeight: 300,
                  fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
                  lineHeight: 1.85,
                  color: tokens.textBody,
                }}
              >
                We still buy from the same three boats, still press oil from the
                grove on the hill behind, and still set the hour of dinner by the
                sun rather than the clock. Greek hospitality is not a service
                standard here. It is simply the habit of feeding people well in the
                place they came to see.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
