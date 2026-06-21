# Clackr — feel every keystroke

A mechanical-keyboard typing test with realistic switch sounds, live WPM/accuracy
stats, an on-screen Mac keyboard, themes, and a results graph. Built with React +
TypeScript + Vite + Tailwind.

## Features

- **Test modes** — `time` (15/30/60/120s), `words` (10/25/50/100), `quote`, `zen`
- **Modifiers** — punctuation and numbers (easy/hard)
- **Realistic sound** — a recorded mechanical keyboard sprite plays the precise
  press/release sound for each physical key, plus several synthesized switch
  profiles (MX Blue/Brown/Red, Thock, Cream, Holy Panda, Alpaca) and two
  typewriter voices with an authentic carriage-return bell on line wraps
- **Fash mode** — optional error sound on wrong keystrokes (buzzer or your own
  `faah` clip)
- **On-screen Mac keyboard** that lights up as you type (Mac / Compact / Minimal)
- **Live stats** + a results screen with a WPM-over-time chart, raw WPM,
  consistency, accuracy and a character breakdown
- **8 themes**, smooth caret, and personal bests — everything saved locally

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deploy

Deploys to Vercel with zero config (Vite preset):

- **Build command:** `npm run build`
- **Output directory:** `dist`

## Keyboard shortcuts

- `tab` then `enter` — restart / next test
- `⌥` / `⌘` + `delete` — remove the previous word
