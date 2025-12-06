import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import cookieSession from "cookie-session";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import {
  getSettings,
  setSettings,
  upsertProducts,
  listAdminProducts,
  saveVisibility,
  listPublic,
  listCachedOnly
} from "./db.js";
import { makeCors } from "./middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// Env & base config
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT || 9090);
const DEV = process.env.NODE_ENV !== "production";
const SESSION_SECRET = process.env.SESSION_SECRET || "replace-me";
const ADMIN_PIN = process.env.GALLERY_ADMIN_PIN || "1234";
const LS_BASE = (process.env.LIGHTNING_SHOP_BASE || "http://127.0.0.1:8080").replace(/\/+$/, "");
const LS_ADMIN_PIN = process.env.LIGHTNING_SHOP_ADMIN_PIN || "";
const RAW_CORS = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

const SESSION_SAME_SITE = process.env.COOKIE_SAMESITE || (DEV ? "lax" : "none");
const SESSION_SECURE = (() => {
  if (process.env.COOKIE_SECURE !== undefined) {
    const raw = String(process.env.COOKIE_SECURE).toLowerCase();
    return ["1", "true", "yes", "on"].includes(raw);
  }
  return SESSION_SAME_SITE === "none";
})();

const jar = new CookieJar();
const lsClient = wrapper(axios.create({
  baseURL: LS_BASE,
  withCredentials: true,
  jar
}));
let lsLoggedIn = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const corsMiddleware = makeCors(RAW_CORS);

app.use(corsMiddleware);
app.use((req, res, next) => {
  // Reflect origin to keep browsers happy when credentials=true
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(cookieSession({
  name: "bolt_gallery_session",
  keys: [SESSION_SECRET],
  maxAge: 1000 * 60 * 60 * 24 * 30,
  sameSite: SESSION_SAME_SITE,
  secure: SESSION_SECURE
}));

function requireAdmin(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

function absoluteLsUrl(url = "") {
  const src = String(url || "").trim();
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `http:${src}`;
  if (src.startsWith("/")) return `${LS_BASE}${src}`;
  return `${LS_BASE}/${src}`;
}

async function ensureLsLogin(force = false) {
  if (lsLoggedIn && !force) return true;
  if (!LS_ADMIN_PIN) {
    throw new Error("LIGHTNING_SHOP_ADMIN_PIN not set");
  }
  try {
    await lsClient.post("/api/admin/login", { pin: LS_ADMIN_PIN });
    lsLoggedIn = true;
    return true;
  } catch (err) {
    lsLoggedIn = false;
    throw err;
  }
}

async function fetchLsProducts() {
  try {
    await ensureLsLogin();
    const r = await lsClient.get("/api/admin/products?page=1&pageSize=9999");
    const raw = r.data?.items || r.data || [];
    return (Array.isArray(raw) ? raw : []).map((p) => {
      const thumb = absoluteLsUrl(p.mainImageThumbAbsoluteUrl || p.mainImageThumbUrl || p.mainImageThumb || "");
      const main = absoluteLsUrl(p.mainImageAbsoluteUrl || p.mainImageUrl || p.mainImage || "");
      return {
        ...p,
        mainImageThumbAbsoluteUrl: thumb,
        mainImageAbsoluteUrl: main
      };
    });
  } catch (err) {
    if (err?.response?.status === 401) {
      lsLoggedIn = false;
      await ensureLsLogin(true);
      return fetchLsProducts();
    }
    throw err;
  }
}

async function syncFromLightningShop() {
  const list = await fetchLsProducts();
  upsertProducts(list.map((p) => ({
    productId: p.id,
    lastTitle: p.title || "",
    lastImageThumb: p.mainImageThumbAbsoluteUrl || "",
    lastImage: p.mainImageAbsoluteUrl || ""
  })));
  return list;
}

function proxify(url = "") {
  const abs = absoluteLsUrl(url);
  if (!abs) return "";
  return `/api/gallery/proxy?u=${encodeURIComponent(abs)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/public/settings", (req, res) => {
  res.json(getSettings());
});

app.get("/api/public/gallery", (req, res) => {
  const list = listPublic().map((p) => ({
    ...p,
    mainImageThumbUrl: proxify(p.mainImageThumbUrl),
    mainImageUrl: proxify(p.mainImageUrl)
  }));
  res.json(list);
});

// Expose all images for a product (pulled from Lightning Shop admin API) so the gallery can show full view.
app.get("/api/gallery/:id/images", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ error: "Missing id" });
  try {
    await ensureLsLogin();
    const r = await lsClient.get(`/api/admin/products/${id}`);
    const data = r.data || {};
    const imgs = Array.isArray(data.images) ? data.images : [];
    // Normalize any absolute/thumb URLs from admin payload; otherwise derive from binary data URLs.
    const absUrls = (() => {
      if (Array.isArray(data.absImageUrls) && data.absImageUrls.length) return data.absImageUrls;
      if (Array.isArray(data.imageUrls) && data.imageUrls.length) return data.imageUrls.map((u) => absoluteLsUrl(u));
      // Fallback: if binary data URLs exist, keep them as-is
      if (imgs.length) return imgs.map((u) => absoluteLsUrl(u));
      return [];
    })();
    const title = data.title || "";
    res.json({ images: absUrls.map(proxify), title });
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: err?.message || "Unable to load images" });
  }
});

// Proxy Lightning Shop images to avoid mixed-content issues behind HTTPS
app.get("/api/gallery/proxy", async (req, res) => {
  const raw = String(req.query.u || "").trim();
  if (!raw) return res.status(400).json({ error: "Missing url" });
  const abs = absoluteLsUrl(raw);
  if (!abs) return res.status(400).json({ error: "Invalid url" });
  // Only allow proxying the configured Lightning Shop base
  if (!abs.startsWith(LS_BASE)) return res.status(403).json({ error: "Forbidden" });
  try {
    const rsp = await axios.get(abs, { responseType: "arraybuffer" });
    const ct = rsp.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(Buffer.from(rsp.data));
  } catch (err) {
    const status = err?.response?.status || 502;
    res.status(status).json({ error: "Proxy failed" });
  }
});

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------
app.post("/api/admin/login", (req, res) => {
  const { pin } = req.body || {};
  if (String(pin || "") !== String(ADMIN_PIN)) {
    return res.status(401).json({ ok: false, error: "Invalid PIN" });
  }
  req.session.admin = true;
  return res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  res.json({ loggedIn: !!req.session?.admin });
});

app.post("/api/admin/sync", requireAdmin, async (req, res) => {
  try {
    const list = await syncFromLightningShop();
    res.json({ ok: true, count: Array.isArray(list) ? list.length : 0 });
  } catch (err) {
    res.status(502).json({ ok: false, error: err?.message || "Sync failed" });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    let lsProducts = [];
    try {
      lsProducts = await syncFromLightningShop();
    } catch (err) {
      console.warn("[BoltGallery] Lightning Shop unreachable, returning cached products:", err?.message || err);
    }
    const list = Array.isArray(lsProducts) ? lsProducts : [];
    const merged = list.length > 0 ? listAdminProducts(list) : listCachedOnly();
    res.json({ items: merged, total: merged.length });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Unable to load products" });
  }
});

app.put("/api/admin/gallery", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const normalized = items
    .map((it, idx) => ({
      productId: String(it.productId || "").trim(),
      visible: !!it.visible,
      sortOrder: Number.isFinite(it.sortOrder) ? it.sortOrder : (Date.now() + (items.length - idx))
    }))
    .filter((it) => it.productId);
  saveVisibility(normalized);
  res.json({ ok: true, saved: normalized.length });
});

app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(getSettings());
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const next = setSettings(req.body || {});
  res.json(next);
});

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------
const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientDist, "index.html"));
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[BoltGallery] Server running on http://127.0.0.1:${PORT}`);
});
