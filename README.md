# Scentinova — Heavenly Crafted Perfume

Luxury fragrance boutique frontend. Four house signatures · scroll-driven hero · mock shop + admin.

## Stack

- React + Vite (port **5173**)
- Tailwind CSS v4
- GSAP ScrollTrigger + Framer Motion
- React Router · API-backed catalog (MongoDB)

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:5173/**

## Products

1. Lunar Leather
2. Oud on the Petals
3. Masai-Mara
4. Seaweed

Transparent bottle assets: `public/images/products/{slug}/hero.png`

## Routes

| Path | Page |
|------|------|
| `/` | Home — cinematic hero, Four Signatures, journey, CTA |
| `/shop` | Catalog |
| `/product/:slug` | Product detail |
| `/cart` | Cart + mock checkout |
| `/about` | Maison story |
| `/admin` | Mock admin (localStorage) |
