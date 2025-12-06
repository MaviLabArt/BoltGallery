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
3. Dev:
   ```bash
   cd BoltGallery/server && npm run dev
   cd ../client && npm run dev
   ```
   The client proxies `/api` to the server by default (port 9090).

4. Prod (single process):
   ```bash
   cd BoltGallery/client && npm run build
   cd ../server && NODE_ENV=production npm start
   ```
   The server serves `client/dist` statically plus the API; PM2 config `ecosystem.config.cjs` runs just the server.

4. Visit http://127.0.0.1:5174
