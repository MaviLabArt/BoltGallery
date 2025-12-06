import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "../services/api.js";

const SettingsContext = createContext({ settings: null, loading: true, error: null, refresh: () => {} });

const CACHE_KEY = "bolt-gallery-settings";
const DEFAULT_THEME_TOKENS = {
  accent: "#6366f1",
  accentSoft: "rgba(99, 102, 241, 0.16)",
  surface: "#0f172a",
  surfaceAlt: "#111827",
  text: "#e5e7eb",
  muted: "#94a3b8",
  border: "rgba(255, 255, 255, 0.08)"
};

function loadCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeTheme(raw) {
  const base = { ...DEFAULT_THEME_TOKENS };
  if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim() !== "") base[k] = v;
    });
  }
  return base;
}

function persist(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings || {}));
  } catch {}
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const cached = loadCache();
    if (!cached) return null;
    return { ...cached, themeTokens: mergeTheme(cached.themeTokens) };
  });
  const [loading, setLoading] = useState(!settings);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get("/public/settings");
      const merged = { ...r.data, themeTokens: mergeTheme(r.data?.themeTokens) };
      setSettings(merged);
      persist(merged);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = settings?.titleLine || settings?.storeName || "Bolt Gallery";
    if (title) document.title = title;
  }, [settings?.titleLine, settings?.storeName]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const rels = ["icon", "shortcut icon"];
    const href = typeof settings?.favicon === "string" ? settings.favicon.trim() : "";
    const selector = rels.map((rel) => `link[rel="${rel}"][data-managed="bg-favicon"]`).join(",");
    const ensure = (rel) => {
      const existing = document.querySelector(`link[rel="${rel}"][data-managed="bg-favicon"]`);
      if (existing) return existing;
      const el = document.createElement("link");
      el.setAttribute("rel", rel);
      el.setAttribute("data-managed", "bg-favicon");
      document.head.appendChild(el);
      return el;
    };
    document.querySelectorAll(selector).forEach((el) => el.remove());
    if (!href) return;
    rels.forEach((rel) => {
      const el = ensure(rel);
      el.setAttribute("href", href);
    });
  }, [settings?.favicon]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const choice = settings?.themeChoice || "dark";
    const tokens = mergeTheme(settings?.themeTokens);
    Object.entries(tokens).forEach(([k, v]) => {
      document.documentElement.style.setProperty(`--ct-${k}`, v);
    });
    const apply = (mode) => {
      if (mode === "auto") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.setAttribute("data-theme", "dark");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
        }
        return;
      }
      document.documentElement.setAttribute("data-theme", mode === "custom" ? "custom" : mode);
    };
    apply(choice);
    if (choice === "auto" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply("auto");
      mq.addEventListener?.("change", handler);
      return () => mq.removeEventListener?.("change", handler);
    }
    return undefined;
  }, [settings?.themeChoice, settings?.themeTokens]);

  const value = useMemo(() => ({ settings, loading, error, refresh: load }), [settings, loading, error, load]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
