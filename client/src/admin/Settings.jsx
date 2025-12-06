import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import AsyncButton from "../components/AsyncButton.jsx";

const DEFAULT_THEME_TOKENS = {
  accent: "#6366f1",
  accentSoft: "rgba(99, 102, 241, 0.16)",
  surface: "#0f172a",
  surfaceAlt: "#111827",
  text: "#e5e7eb",
  muted: "#94a3b8",
  border: "rgba(255, 255, 255, 0.08)"
};

async function fileToDataUrl(file) {
  const r = new FileReader();
  return new Promise((resolve, reject) => {
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function mergeThemeTokens(raw) {
  const base = { ...DEFAULT_THEME_TOKENS };
  if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim() !== "") base[k] = v;
    });
  }
  return base;
}

export default function Settings() {
  const [s, setS] = useState({
    storeName: "Gallery",
    titleLine: "Gallery",
    subtitleLine: "Curated art from BoltCanvas.",
    logoDark: "",
    logoLight: "",
    favicon: "",
    themeChoice: "dark",
    themeTokens: { ...DEFAULT_THEME_TOKENS }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then((r) => {
      const data = r.data || {};
      setS((prev) => ({
        ...prev,
        ...data,
        logoDark: data.logoDark || data.logo || "",
        logoLight: data.logoLight || "",
        themeTokens: mergeThemeTokens(data.themeTokens)
      }));
      setLoading(false);
    }).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeTokens = useMemo(() => mergeThemeTokens(s.themeTokens), [s.themeTokens]);

  async function save() {
    try {
      setSaving(true);
      await api.put("/admin/settings", s);
      setMessage("Saved");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function pick(key) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const data = await fileToDataUrl(file);
      setS((prev) => ({ ...prev, [key]: data }));
    };
    input.click();
  }

  if (loading) {
    return <div className="rounded-3xl bg-slate-900 ring-1 ring-white/10 p-4">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Store name</label>
          <input className="w-full px-4 py-3 rounded-2xl bg-slate-950 ring-1 ring-white/10" value={s.storeName}
            onChange={(e) => setS({ ...s, storeName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Title</label>
          <input className="w-full px-4 py-3 rounded-2xl bg-slate-950 ring-1 ring-white/10" value={s.titleLine}
            onChange={(e) => setS({ ...s, titleLine: e.target.value })} />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm text-white/70">Subtitle</label>
          <input className="w-full px-4 py-3 rounded-2xl bg-slate-950 ring-1 ring-white/10" value={s.subtitleLine}
            onChange={(e) => setS({ ...s, subtitleLine: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["logoDark", "Logo (dark / default)", "Used for dark, auto, ember, custom themes"],
          ["logoLight", "Logo (light theme)", "Used when theme is Light"]
        ].map(([key, label, help]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/70">
              <div>
                <div>{label}</div>
                <div className="text-xs text-white/50">{help}</div>
              </div>
              <button className="text-indigo-300" onClick={() => pick(key)}>Upload</button>
            </div>
            <div className="flex items-center gap-3">
              {s[key] ? (
                <img src={s[key]} alt={key} className="h-12 w-12 rounded-xl object-contain ring-1 ring-white/10" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-slate-900 ring-1 ring-white/10" />
              )}
              {s[key] ? (
                <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => setS((prev) => ({ ...prev, [key]: "" }))}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Favicon</span>
            <button className="text-indigo-300" onClick={() => pick("favicon")}>Upload</button>
          </div>
          <div className="flex items-center gap-3">
            {s.favicon ? (
              <img src={s.favicon} alt="favicon" className="h-12 w-12 rounded-xl object-contain ring-1 ring-white/10" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-slate-900 ring-1 ring-white/10" />
            )}
            {s.favicon ? (
              <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => setS((prev) => ({ ...prev, favicon: "" }))}>
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-lg font-semibold">Theme</div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {["dark", "ember", "light", "auto", "custom"].map((mode) => (
            <label key={mode} className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950 ring-1 ring-white/10 cursor-pointer">
              <input type="radio" name="themeChoice" value={mode} checked={s.themeChoice === mode}
                onChange={(e) => setS({ ...s, themeChoice: e.target.value })} />
              <span className="capitalize">{mode}</span>
            </label>
          ))}
        </div>

        {s.themeChoice === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(themeTokens).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <input type="color" value={/^#/.test(val) ? val : "#6366f1"} onChange={(e) => setS((prev) => ({
                    ...prev,
                    themeTokens: { ...(prev.themeTokens || {}), [key]: e.target.value }
                  }))} className="h-8 w-10 rounded-lg border border-white/20 bg-slate-950" />
                  <span className="capitalize">{key}</span>
                </label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 ring-1 ring-white/10"
                  value={val}
                  onChange={(e) => setS((prev) => ({
                    ...prev,
                    themeTokens: { ...(prev.themeTokens || {}), [key]: e.target.value }
                  }))}
                />
              </div>
            ))}
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10 sm:col-span-2 lg:col-span-3"
              onClick={() => setS((prev) => ({ ...prev, themeTokens: { ...DEFAULT_THEME_TOKENS } }))}
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <AsyncButton onClick={save} busyText="Saving…" disabled={saving}>Save settings</AsyncButton>
        {message ? <span className="text-emerald-300 text-sm">{message}</span> : null}
      </div>
    </div>
  );
}
