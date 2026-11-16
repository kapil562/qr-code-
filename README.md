# QR Series Timer (React)

Series aur timer user input se set karke QR codes auto-switch karte hain.

## Features

- **Series Start / End** — user khud range daalta hai
- **Timer (ms)** — har kitne ms me page switch hoga
- **Start / Stop / Prev / Next** buttons + keyboard shortcuts
- **Loop** — last page ke baad shuru se dobara
- **Progress bar** + bada series number display
- Ek page par ek QR (fullscreen me scan-friendly)

## Keyboard

| Key | Action |
|-----|--------|
| Space | Start / Stop |
| ← → | Manual page change |
| F | Fullscreen |

## Local Run

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Is folder ko GitHub par push karo
2. [vercel.com](https://vercel.com) → **New Project** → import repo
3. Vercel automatically Vite detect karega → **Deploy**

Ya CLI se:

```bash
npm i -g vercel
vercel
```
