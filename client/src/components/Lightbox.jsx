import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { absoluteApiUrl } from "../services/api.js";

export default function Lightbox({ open, onClose, title, images = [] }) {
  const [idx, setIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [canZoomCursor, setCanZoomCursor] = useState(false);
  const zoomSteps = useMemo(() => [1, 2.4, 3.4], []);

  useEffect(() => {
    if (open) {
      setIdx(0);
      setZoomLevel(1);
      setZoomOrigin({ x: 50, y: 50 });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, images.length]);

  const safeImages = Array.isArray(images) ? images.map((u) => absoluteApiUrl(u)) : [];
  const hasMulti = safeImages.length > 1;
  const current = safeImages[idx] || "";
  const maxZoom = zoomSteps[zoomSteps.length - 1];
  const isMaxZoom = zoomLevel >= maxZoom;
  const zoomCursor = isMaxZoom ? "zoom-out" : "zoom-in";

  function cycleZoom() {
    const i = zoomSteps.findIndex((z) => z === zoomLevel);
    const next = zoomSteps[(i + 1) % zoomSteps.length];
    setZoomLevel(next);
  }

  const next = () => {
    if (!hasMulti) return;
    setIdx((prev) => (prev + 1) % safeImages.length);
    setZoomLevel(1);
  };
  const prev = () => {
    if (!hasMulti) return;
    setIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    setZoomLevel(1);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} />
          <div className="relative z-10 max-w-5xl w-full mx-auto space-y-3">
            <div className="flex items-center justify-between text-white/80">
              <div className="text-lg font-semibold truncate pr-3">{title || "Artwork"}</div>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm"
              >
                Close
              </button>
            </div>
            <div
              className="relative rounded-3xl overflow-hidden bg-black ring-1 ring-white/10 min-h-[300px]"
              onPointerMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const withinCenter = x > 35 && x < 65 && y > 35 && y < 65;
                setCanZoomCursor(withinCenter && zoomSteps.length > 1);
                if (zoomLevel <= 1) return;
                setZoomOrigin({ x, y });
              }}
              onPointerLeave={(e) => {
                // Reset zoom on desktop when leaving
                if (e.pointerType === "mouse" || e.pointerType === "pen" || !e.pointerType) {
                  setZoomLevel(1);
                }
                setCanZoomCursor(false);
              }}
            >
              {current ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  onClick={(e) => {
                    // Only trigger zoom toggle when clicking near the center to avoid arrow interference
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                    const withinCenter = xPct > 35 && xPct < 65 && yPct > 35 && yPct < 65;
                    if (!withinCenter) return;
                    setZoomOrigin({ x: xPct, y: yPct });
                    cycleZoom();
                  }}
                >
                  <motion.img
                    key={current}
                    src={current}
                    alt={title}
                    className="w-full h-full object-contain transition-transform duration-150 ease-out select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={
                      zoomLevel > 1
                        ? {
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                            cursor: canZoomCursor ? zoomCursor : "default",
                            maxHeight: "78vh"
                          }
                        : {
                            cursor: canZoomCursor ? zoomCursor : "default",
                            maxHeight: "78vh"
                          }
                    }
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-full h-[60vh] grid place-items-center text-white/50">No image</div>
              )}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-sm">
                {`${zoomLevel.toFixed(1).replace(/\\.0$/, "")}x`}
              </div>

              {hasMulti && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full bg-black/60 ring-1 ring-white/20 hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full bg-black/60 ring-1 ring-white/20 hover:bg-black/70"
                    aria-label="Next image"
                  >
                    →
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-xs text-white/80 ring-1 ring-white/15">
                    {idx + 1} / {safeImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
