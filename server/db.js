import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "gallery.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

const DEFAULT_THEME_TOKENS = {
  accent: "#6366f1",
  accentSoft: "rgba(99, 102, 241, 0.16)",
  surface: "#0f172a",
  surfaceAlt: "#111827",
  text: "#e5e7eb",
  muted: "#94a3b8",
  border: "rgba(255, 255, 255, 0.08)"
};

function hasColumn(table, name) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === name);
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_products (
      productId TEXT PRIMARY KEY,
      visible INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      lastTitle TEXT DEFAULT '',
      lastImageThumb TEXT DEFAULT '',
      lastImage TEXT DEFAULT '',
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  if (!hasColumn("gallery_products", "createdAt")) {
    db.exec(`ALTER TABLE gallery_products ADD COLUMN createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))`);
  }
}

ensureSchema();

const sGet = db.prepare(`SELECT value FROM settings WHERE key=?`);
const sSet = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value=excluded.value
`);

export function getSettings() {
  const keys = [
    "storeName",
    "titleLine",
    "subtitleLine",
    "logo",
    "logoDark",
    "logoLight",
    "favicon",
    "themeChoice",
    "themeTokens"
  ];
  const map = {};
  keys.forEach((k) => {
    const row = sGet.get(k);
    map[k] = row?.value ?? null;
  });

  const themeTokens = (() => {
    if (!map.themeTokens) return { ...DEFAULT_THEME_TOKENS };
    try {
      const parsed = JSON.parse(map.themeTokens);
      return { ...DEFAULT_THEME_TOKENS, ...(parsed || {}) };
    } catch {
      return { ...DEFAULT_THEME_TOKENS };
    }
  })();

  return {
    storeName: map.storeName ?? "Gallery",
    titleLine: map.titleLine ?? "",
    subtitleLine: map.subtitleLine ?? "",
    logo: map.logo || "",
    logoDark: map.logoDark || "",
    logoLight: map.logoLight || "",
    favicon: map.favicon || "",
    themeChoice: map.themeChoice || "dark",
    themeTokens
  };
}

export function setSettings(patch = {}) {
  const apply = (key, val) => {
    if (val === undefined) return;
    const stringVal =
      key === "themeTokens" ? JSON.stringify(val || {}) : String(val || "");
    sSet.run(key, stringVal);
  };

  apply("storeName", patch.storeName);
  apply("titleLine", patch.titleLine);
  apply("subtitleLine", patch.subtitleLine);
  apply("logo", patch.logo);
  apply("logoDark", patch.logoDark);
  apply("logoLight", patch.logoLight);
  apply("favicon", patch.favicon);
  apply("themeChoice", patch.themeChoice);
  if (patch.themeTokens !== undefined) {
    apply("themeTokens", patch.themeTokens);
  }

  return getSettings();
}

export function upsertProducts(products = []) {
  const insert = db.prepare(`
    INSERT INTO gallery_products (productId, visible, sortOrder, lastTitle, lastImageThumb, lastImage, createdAt)
    VALUES (@productId, @visible, @sortOrder, @lastTitle, @lastImageThumb, @lastImage, @createdAt)
    ON CONFLICT(productId) DO UPDATE SET
      lastTitle=excluded.lastTitle,
      lastImageThumb=excluded.lastImageThumb,
      lastImage=excluded.lastImage,
      createdAt=COALESCE(gallery_products.createdAt, excluded.createdAt),
      sortOrder=CASE
        WHEN gallery_products.sortOrder = 0 THEN excluded.sortOrder
        ELSE gallery_products.sortOrder
      END
  `);

  const tx = db.transaction((list) => {
    const now = Math.floor(Date.now() / 1000);
    list.forEach((p, idx) => {
      const existing = db.prepare(`SELECT visible, sortOrder, createdAt FROM gallery_products WHERE productId=?`).get(p.productId);
      const payload = {
        productId: p.productId,
        lastTitle: p.lastTitle || "",
        lastImageThumb: p.lastImageThumb || "",
        lastImage: p.lastImage || "",
        visible: existing ? existing.visible : 0,
        sortOrder: existing ? existing.sortOrder : now + (list.length - idx),
        createdAt: existing?.createdAt || now
      };
      insert.run(payload);
    });
  });
  tx(products);
}

export function listAdminProducts(lsProducts = []) {
  const rows = db.prepare(`SELECT * FROM gallery_products`).all();
  const map = new Map(rows.map((r) => [r.productId, r]));

  return (lsProducts || []).map((p) => {
    const row = map.get(p.id);
    return {
      id: p.id,
      title: p.title || row?.lastTitle || "",
      hidden: !!p.hidden,
      available: !!p.available,
      mainImageThumbAbsoluteUrl: p.mainImageThumbAbsoluteUrl || row?.lastImageThumb || "",
      mainImageAbsoluteUrl: p.mainImageAbsoluteUrl || row?.lastImage || "",
      visible: !!row?.visible,
      sortOrder: Number.isFinite(row?.sortOrder) ? row.sortOrder : 0
    };
  });
}

export function listCachedOnly() {
  const rows = db.prepare(`SELECT * FROM gallery_products`).all();
  return rows.map((r) => ({
    id: r.productId,
    title: r.lastTitle,
    hidden: false,
    available: true,
    mainImageThumbAbsoluteUrl: r.lastImageThumb,
    mainImageAbsoluteUrl: r.lastImage,
    visible: !!r.visible,
    sortOrder: r.sortOrder
  }));
}

export function saveVisibility(items = []) {
  const stmt = db.prepare(`
    INSERT INTO gallery_products (productId, visible, sortOrder, lastTitle, lastImageThumb, lastImage, createdAt)
    VALUES (?, ?, ?, '', '', '', (strftime('%s','now')))
    ON CONFLICT(productId) DO UPDATE SET
      visible=excluded.visible,
      sortOrder=excluded.sortOrder
  `);
  const tx = db.transaction((list) => {
    list.forEach((item, idx) => {
      const order = Number.isFinite(item.sortOrder)
        ? item.sortOrder
        : (Date.now() + (list.length - idx));
      stmt.run(item.productId, item.visible ? 1 : 0, order);
    });
  });
  tx(items);
}

export function listPublic() {
  const rows = db
    .prepare(`
      SELECT * FROM gallery_products
      WHERE visible = 1
      ORDER BY sortOrder DESC, createdAt DESC
    `)
    .all();
  return rows.map((r) => ({
    id: r.productId,
    title: r.lastTitle,
    mainImageThumbUrl: r.lastImageThumb,
    mainImageUrl: r.lastImage
  }));
}
