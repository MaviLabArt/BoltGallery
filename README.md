# BoltGallery

A minimal gallery companion for BoltCanvas. It mirrors the BoltCanvas items (even the hidden ones) and turn them into an art gallery.

## Quick start
1. Copy envs from the single template:
   - `cp .env.example .env` (keep as reference)
   Then edit `.env` according to your setup.

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

4. Visit http://127.0.0.1:5174
