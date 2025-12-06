import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import AsyncButton from "../components/AsyncButton.jsx";

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const r = await api.get("/admin/products");
      const list = Array.isArray(r.data?.items) ? r.data.items : [];
      // Ensure images go through our proxy when coming from Lightning Shop
      const mapped = list.map((p) => ({
        ...p,
        mainImageThumbAbsoluteUrl: p.mainImageThumbAbsoluteUrl
          ? `/api/gallery/proxy?u=${encodeURIComponent(p.mainImageThumbAbsoluteUrl)}`
          : p.mainImageThumbAbsoluteUrl,
        mainImageAbsoluteUrl: p.mainImageAbsoluteUrl
          ? `/api/gallery/proxy?u=${encodeURIComponent(p.mainImageAbsoluteUrl)}`
          : p.mainImageAbsoluteUrl
      }));
      setItems(mapped.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0)));
      setError("");
    } catch (err) {
      setError("Unable to load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleVisible(id) {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, visible: !p.visible } : p));
  }

  function move(id, delta) {
    setItems((prev) => {
      const list = prev.slice();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const target = idx + delta;
      if (target < 0 || target >= list.length) return prev;
      const [item] = list.splice(idx, 1);
      list.splice(target, 0, item);
      return list;
    });
  }

  function moveTop(id) {
    setItems((prev) => {
      const list = prev.slice();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const [item] = list.splice(idx, 1);
      list.unshift(item);
      return list;
    });
  }

  function moveBottom(id) {
    setItems((prev) => {
      const list = prev.slice();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const [item] = list.splice(idx, 1);
      list.push(item);
      return list;
    });
  }

  async function save() {
    const payload = items.map((p, idx) => ({
      productId: p.id,
      visible: !!p.visible,
      sortOrder: Date.now() + (items.length - idx)
    }));
    try {
      setSaving(true);
      await api.put("/admin/gallery", { items: payload });
      setMessage("Saved");
      setError("");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function refreshFromShop() {
    try {
      setLoading(true);
      await api.post("/admin/sync");
      await load();
    } catch (err) {
      setError("Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AsyncButton onClick={save} busyText="Saving…" disabled={saving || loading}>
          Save visibility & order
        </AsyncButton>
        <AsyncButton onClick={refreshFromShop} busyText="Syncing…" className="bg-slate-800 hover:bg-slate-700">
          Refresh from Lightning Shop
        </AsyncButton>
        {message ? <span className="text-emerald-300 text-sm">{message}</span> : null}
        {error ? <span className="text-rose-300 text-sm">{error}</span> : null}
        <div className="ml-auto text-white/60 text-sm">{items.length} products</div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-slate-900 ring-1 ring-white/10 h-52 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-slate-900 ring-1 ring-white/10 p-4 text-white/70">No products yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p, index) => (
            <div key={p.id} className="rounded-3xl bg-slate-900 ring-1 ring-white/10 overflow-hidden">
              <div className="aspect-[4/3] bg-black/20 relative">
                {p.mainImageThumbAbsoluteUrl ? (
                  <img src={p.mainImageThumbAbsoluteUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/40">No image</div>
                )}
                {(p.hidden || !p.available) && (
                  <div className="absolute inset-0 bg-black/50 grid place-items-center text-xs">
                    <div className="px-3 py-1 rounded-xl bg-white/10 ring-1 ring-white/20">
                      {p.hidden ? "Hidden in Lightning Shop" : "Unavailable"}
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 text-xs">#{index + 1}</div>
              </div>
              <div className="p-4 space-y-2">
                <div className="font-semibold line-clamp-2" title={p.title}>{p.title || "Untitled"}</div>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={!!p.visible} onChange={() => toggleVisible(p.id)} />
                  <span>Show in gallery</span>
                </label>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => moveTop(p.id)}>Top</button>
                  <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => move(p.id, -1)}>↑</button>
                  <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => move(p.id, 1)}>↓</button>
                  <button className="px-3 py-2 rounded-xl bg-slate-800 ring-1 ring-white/10" onClick={() => moveBottom(p.id)}>Bottom</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
