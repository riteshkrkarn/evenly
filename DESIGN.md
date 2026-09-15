# Design System

## Visual Theme

Timetable Board — Swiss public-information design for Evenly. Cool paper ground, near-black ink, signal-red for primary actions and “owed to you.” Enamel panels, hairline rules, tabular amounts. Light and dark both ship. Numbers first; chrome stays quiet.

## Color

OKLCH tokens. Light default; dark via `.dark`.

| Role | Light | Dark | Use |
|---|---|---|---|
| bg | `oklch(0.975 0.002 250)` | `oklch(0.14 0.01 250)` | App canvas |
| surface | `oklch(1 0 0)` | `oklch(0.18 0.012 250)` | Rails, panels |
| ink | `oklch(0.18 0.01 250)` | `oklch(0.96 0.005 250)` | Body / titles |
| muted | `oklch(0.52 0.015 250)` | `oklch(0.68 0.015 250)` | Secondary text |
| primary | `oklch(0.55 0.22 25)` | `oklch(0.62 0.2 25)` | CTAs, brand rule, owed |
| accent | same as primary | same as primary | Owed-to-you / links |
| danger | `oklch(0.42 0.06 250)` | `oklch(0.72 0.04 250)` | You owe (cool steel, not alarm red) |
| border | `oklch(0.88 0.008 250)` | `oklch(0.28 0.012 250)` | Hairlines |
| owed-wash | primary @ 8% | primary @ 14% | Featured balance row |

Text on primary fills: near-white.

Semantic money: **owed to you** → accent/primary + label; **you owe** → danger + label; **settled** → muted.

## Typography

- **Archivo** — UI and display (wide black for brand)
- **Azeret Mono** — money amounts (`tabular-nums`)

Scale: label-caps ~0.6875rem / 0.14em tracking; body 0.875–1rem; brand ~3rem extrabold.

## Components

- Radius: `0.25rem` (sm) — transit panels, not soft SaaS pills
- Buttons: solid signal-red primary; quiet secondary borders
- Forms: 44px min height, visible focus ring
- Lists / tables over card grids; cards only for interactive containers
- Brand mark: word + short signal-red underline rule

## Layout

- Landing: ~32% wayfinding rail / ~68% live balance board
- App: sticky top nav, max content ~64rem
- Page padding: 1–1.5rem → denser on board tables
- Module snap: whole sections, not fractional card crumbs

## Motion

- 150ms ease-out hover/focus
- Settlement signature (future): staged board-row clear, not toast
- `prefers-reduced-motion: reduce` respected

## Imagery

No hero illustration. The balance board is the proof. Demo data labeled synthetic.
