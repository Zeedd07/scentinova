# Aurum — Luxury Perfume Boutique

Scroll-driven 240-frame hero (from master video) + full mock e-commerce shop.

## Stack

- React + Vite (port **5178**)
- Tailwind CSS v4
- GSAP ScrollTrigger + Framer Motion
- React Router · localStorage cart

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:5178/**

## Routes

| Path | Page |
|------|------|
| `/` | Home — scroll-scrub hero, story, collection teaser |
| `/shop` | Catalog with category filters + sort |
| `/product/:slug` | Product detail, notes, gallery, add to cart |
| `/cart` | Cart + mock checkout |
| `/about` | Maison story |

## Frame pipeline (hero scrub)

GIF-derived JPEGs introduce banding. Prefer a clean master:

```bash
./scripts/extract-frames.sh path/to/clean-master.mp4   # fps=30 → public/frames
./scripts/clean-frames.sh                              # hqdn3d + unsharp → public/frames-clean
./scripts/convert-webp.sh                              # → public/frames-webp
```

Or: `npm run frames:pipeline` (skips extract if no arg; denoise existing JPEGs).

Hero preload uses `/frames-webp/*.webp` with fallback to `/frames-clean/*.jpg` then `/frames/*.jpg`.
