import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { useSettings } from "../store/settings.jsx";
import GalleryCard from "../components/GalleryCard.jsx";
import Lightbox from "../components/Lightbox.jsx";
import { absoluteApiUrl } from "../services/api.js";

export default function Gallery() {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, item: null, images: [], loading: false });

  useEffect(() => {
    api.get("/public/gallery")
      .then((r) => { setItems(Array.isArray(r.data) ? r.data : []); setError(null); })
      .catch((err) => { setError(err); setItems([]); })
      .finally(() => setLoading(false));
  }, []);

  const heroLogo = useMemo(() => {
    if (!settings) return "";
    const choice = settings.themeChoice || "dark";
    // Match main project logic: light theme -> light logo; otherwise dark logo.
    if (choice === "light") {
      return settings.logoLight || settings.logoDark || "";
    }
    // auto/ember/dark/custom fall back to dark logo
    return settings.logoDark || settings.logoLight || "";
  }, [settings]);

  const titleRaw = settings?.titleLine ?? "";
  const subtitleRaw = settings?.subtitleLine ?? "";
  const title = titleRaw.trim();
  const subtitle = subtitleRaw.trim();

  useEffect(() => {
    if (!settings) return;
    const metaList = [
      ["og:title", title || settings.storeName || "Gallery"],
      ["og:description", subtitle || "Curated art"],
      ["twitter:title", title || settings.storeName || "Gallery"],
      ["twitter:description", subtitle || "Curated art"],
      ["twitter:card", "summary_large_image"]
    ];

    const img = absoluteApiUrl(heroLogo || settings.logoDark || settings.logoLight || "");
    if (img) {
      metaList.push(["og:image", img], ["twitter:image", img]);
    }

    metaList.forEach(([name, content]) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:") || name.startsWith("twitter:")) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    });
  }, [settings, title, subtitle, heroLogo]);

  async function openItem(item) {
    const main = absoluteApiUrl(item.mainImageUrl || item.mainImageThumbUrl || "");
    // Keep the lightbox closed until we have at least one image to avoid flash/flicker.
    let images = main ? [main] : [];
    try {
      const r = await api.get(`/gallery/${item.id}/images`);
      const imgs = Array.isArray(r.data?.images) ? r.data.images : [];
      if (imgs.length) images = imgs;
    } catch {
      // ignore fetch errors; we'll fall back to the main image if any
    }
    setLightbox({ open: true, item, images, loading: false });
  }

  return (
    <section className="pt-10">
      <div className="text-center mb-10">
        {heroLogo ? (
          <div className="mb-6 flex justify-center">
            <img src={heroLogo} alt="logo" className="h-20 sm:h-24 w-auto object-contain" />
          </div>
        ) : null}
        {title ? (
          <h1 className="heading text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="mt-3 text-white/70 max-w-2xl mx-auto text-base sm:text-lg">{subtitle}</p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel">
              <div className="skel-img skel-anim" />
              <div className="p-4 grid gap-2">
                <div className="skel-line skel-anim w-3/4" />
                <div className="skel-line skel-anim w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-rose-950/40 ring-1 ring-rose-400/40 p-4 text-rose-100">
          Could not load gallery. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-slate-900 ring-1 ring-white/10 p-6 text-white/70 text-center">
          No pieces are visible yet. Enable items from the admin.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="text-left"
              onClick={() => openItem(item)}
            >
              <GalleryCard item={item} />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={lightbox.open}
        title={lightbox.item?.title}
        images={lightbox.images}
        onClose={() => setLightbox({ open: false, item: null, images: [], loading: false })}
      />
    </section>
  );
}
