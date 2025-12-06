# BoltGallery

A minimal gallery companion for BoltCanvas. It mirrors the BoltCanvas items (even the hidden ones) and turn them into an art gallery.

## Quick start
1. Copy env from the single template (one .env for both server and client):
   - `cp .env.example .env`
   Then edit `.env` according to your setup 

2. Install deps:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Dev (two terminals):
   ```bash
   cd server && npm run dev
   cd ../client && npm run dev
   ```
4. Prod (single process):
   ```bash
   cd client && npm run build
   cd ../server && NODE_ENV=production npm start
   ```
   The server serves `client/dist` statically plus the API; PM2 config `ecosystem.config.cjs` runs just the server.

5. Prod with PM2:
   ```bash
   cd client && npm run build && cd ..
   # start via pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

6. Visit http://127.0.0.1:9090 
