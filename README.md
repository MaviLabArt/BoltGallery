# BoltGallery

A minimal gallery-only companion for Lightning Shop. It mirrors the Lightning Shop look but shows only artwork names + images, with a simple admin to pick what is visible.

## Quick start
1. Copy envs from the single template:
   - `cp .env.example .env` (keep as reference)
   - `cp .env.example server/.env`
   - `cp .env.example client/.env`
   Then edit `server/.env` for backend values (`LIGHTNING_SHOP_BASE`, `LIGHTNING_SHOP_ADMIN_PIN`, etc.) and `client/.env` for frontend (`VITE_API_URL`).
2. Install deps:
   ```bash
   cd BoltGallery/server && npm install
   cd ../client && npm install
   ```
3. Run dev:
   ```bash
   cd BoltGallery/server && npm run dev
   cd ../client && npm run dev
   ```
   The client proxies `/api` to the server by default (port 9090).

## Notes
- Admin at `/admin` (PIN from `GALLERY_ADMIN_PIN`).
- “Refresh from Lightning Shop” pulls every product (including hidden/unavailable) via the admin PIN and keeps image URLs pointing to Lightning Shop.
- Settings let you set title/subtitle, logos (dark/light), favicon, and theme (Dark Ink, Ember Night, Light Atelier, Auto, Custom tokens).
- CORS is permissive by default; Vite dev server is host-open and proxies `/api` to the configured base.
