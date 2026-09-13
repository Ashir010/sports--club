'use client'

import { useState } from 'react'
import { tokens } from '../tokens'
import Reveal from './Reveal'

const MENU = [
  {
    group: 'From the fire',
    items: [
      {
        name: 'Grilled Octopus',
        note: 'Charred over vine cuttings, split fava, caper leaf, lemon',
        price: '24',
      },
      {
        name: 'Aegean Sea Bass',
        note: 'Whole, salt-baked, dressed at the table with ladolemono',
        price: '38',
      },
      {
        name: 'Lamb Souvlaki',
        note: 'Shoulder from Sifnos, oregano, smoked aubergine, flatbread',
        price: '29',
      },
      {
        name: 'Charred Eggplant',
        note: 'Burnt skin, sheep yoghurt, pine nuts, thyme honey',
        price: '18',
      },
    ],
  },
  {
    group: 'From the garden & the sea',
    items: [
      {
        name: 'Greek Salad',
        note: 'Terrace tomatoes, barrel feta, cucumber, olives cured in-house',
        price: '16',
      },
      {
        name: 'Seafood Orzo',
        note: 'Prawn, mussel, saffron, tomato cooked down for six hours',
        price: '32',
      },
    ],
  },
  {
    group: 'To finish',
    items: [
      {
        name: 'Honey Baklava',
        note: 'Thirty-three layers, walnut, thyme honey, orange blossom',
        price: '12',
      },
      {
        name: 'Yogurt with Seasonal Fruit',
        note: 'Strained sheep yoghurt, spoon sweets, toasted almond',
        price: '11',
      },
    ],
  },
]

function Row({ name, note, price }: { name: string; note: string; price: string }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 'clamp(1rem, 3vw, 3rem)',
        padding: 'clamp(1.4rem, 2.4vw, 1.9rem) clamp(0rem, 1.2vw, 1rem)',
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        background: hover ? 'rgba(232,221,204,0.42)' : 'transparent',
        transition: 'background 500ms cubic-bezier(0.25,0,0,1)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontFamily: tokens.display,
            fontWeight: 400,
            fontSize: 'clamp(1.15rem, 1.9vw, 1.55rem)',
            lineHeight: 1.3,
            color: hover ? tokens.accent : tokens.textPrimary,
            transition: 'color 500ms cubic-bezier(0.25,0,0,1)',
            marginBottom: '0.5rem',
          }}
        >
          {name}
        </h3>
        <p
          style={{
            fontFamily: tokens.body,
            fontWeight: 300,
            fontSize: '0.92rem',
            lineHeight: 1.65,
            color: tokens.textBody,
            maxWidth: '52ch',
          }}
        >
          {note}
        </p>
      </div>
      <div
        style={{
          fontFamily: tokens.display,
          fontSize: 'clamp(1.05rem, 1.6vw, 1.35rem)',
          color: hover ? tokens.accent : tokens.dim,
          transition: 'color 500ms cubic-bezier(0.25,0,0,1)',
          whiteSpace: 'nowrap',
        }}
      >
        {price} €
      </div>
    </div>
  )
}

export default function MenuSection() {
  let i = 0
  return (
    <section
      style={{
        background: tokens.bg,
        padding: 'clamp(5rem, 12vh, 9rem) clamp(1.5rem, 7vw, 7rem)',
        borderTop: `1px solid ${tokens.borderSubtle}`,
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Reveal>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: tokens.accent,
              marginBottom: '2rem',
            }}
          >
            From Land &amp; Sea
          </p>
        </Reveal>

        <Reveal index={1}>
          <h2
            style={{
              fontFamily: tokens.display,
              fontWeight: 400,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              lineHeight: 1.12,
              letterSpacing: '-0.015em',
              color: tokens.textPrimary,
              marginBottom: '1.4rem',
            }}
          >
            A taste of the Mediterranean.
          </h2>
        </Reveal>

        <Reveal index={2}>
          <p
            style={{
              fontFamily: tokens.body,
              fontWeight: 300,
              fontSize: '1rem',
              lineHeight: 1.8,
              color: tokens.textBody,
              maxWidth: 520,
              marginBottom: 'clamp(3rem, 6vh, 4.5rem)',
            }}
          >
            The list changes with the boats and the terraces. This is how it reads
            this week.
          </p>
        </Reveal>

        {MENU.map((section) => (
          <div key={section.group} style={{ marginBottom: 'clamp(3rem, 6vh, 4.5rem)' }}>
            <Reveal index={(i += 1)}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: '0.65rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: tokens.olive,
                  paddingBottom: '1.1rem',
                  borderBottom: `1px solid ${tokens.borderSubtle}`,
                }}
              >
                {section.group}
              </p>
            </Reveal>
            {section.items.map((item) => (
              <Reveal key={item.name} index={(i += 1) % 6}>
                <Row {...item} />
              </Reveal>
            ))}
          </div>
        ))}

        <Reveal>
          <p
            style={{
              fontFamily: tokens.body,
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '0.88rem',
              color: tokens.dim,
            }}
          >
            Whole fish priced by weight on the evening. Please tell us about
            allergies when you book.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
