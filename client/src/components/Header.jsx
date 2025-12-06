import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSettings } from "../store/settings.jsx";

export default function Header() {
  const { settings } = useSettings();
  const loc = useLocation();
  const theme = settings?.themeChoice || "dark";

  const heroLogo = useMemo(() => {
    if (!settings) return "";
    const choice = theme === "auto" ? "dark" : theme;
    if (choice === "light") return settings.logoLight || settings.logo || settings.logoDark || "";
    return settings.logoDark || settings.logo || settings.logoLight || "";
  }, [settings, theme]);

  const title = settings?.titleLine || settings?.storeName || "Bolt Gallery";
  const subtitle = settings?.subtitleLine || "Curated art from Lightning Shop.";

  return (
    <header className="sticky top-0 z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {heroLogo ? (
            <img src={heroLogo} alt="logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-slate-800 ring-1 ring-white/10" />
          )}
          <div>
            <div className="font-semibold leading-tight">{title}</div>
            <div className="text-sm text-white/60 line-clamp-1">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/"
            className={`px-3 py-2 rounded-xl ring-1 ring-white/10 hover:ring-white/30 ${loc.pathname === "/" ? "bg-white/10" : "bg-slate-900"}`}
          >
            Gallery
          </Link>
          <a
            href="/admin"
            className="px-3 py-2 rounded-xl ring-1 ring-white/10 bg-slate-900 hover:ring-white/30"
          >
            Admin
          </a>
        </div>
      </div>
    </header>
  );
}
