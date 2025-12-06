import React from "react";
import { useSettings } from "../store/settings.jsx";

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  const name = settings?.storeName || "Bolt Gallery";
  const subtitle = settings?.subtitleLine || "";

  return (
    <footer className="mt-14 border-t border-white/10 bg-slate-950/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-white/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>© {year} {name}</div>
          {subtitle ? <div className="text-white/40">{subtitle}</div> : null}
        </div>
        <div className="flex items-center flex-wrap gap-2 text-white/70">
          <span>The code to self-host your store is open sourced here 👉</span>
          <a
            className="footer-badge"
            href="https://github.com/MaviLabArt/BoltCanvas"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.35c-2.01.44-2.53-.97-2.53-.97-.36-.92-.88-1.16-.88-1.16-.72-.49.05-.48.05-.48.8.06 1.22.83 1.22.83.71 1.21 1.87.86 2.33.66.07-.52.28-.86.5-1.06-1.6-.18-3.28-.8-3.28-3.55 0-.78.28-1.41.74-1.9-.07-.18-.32-.9.07-1.88 0 0 .6-.19 1.98.73a6.9 6.9 0 0 1 1.8-.24c.61 0 1.22.08 1.8.24 1.38-.92 1.98-.73 1.98-.73.39.98.14 1.7.07 1.88.46.49.74 1.12.74 1.9 0 2.76-1.69 3.37-3.3 3.55.29.24.54.73.54 1.48l-.01 2.19c0 .21.15.45.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="font-medium">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
