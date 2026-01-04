import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { absoluteApiUrl } from "../services/api.js";

export default function GalleryCard({ item }) {
  const reduce = useReducedMotion();
  const main = absoluteApiUrl(item.mainImageThumbUrl || item.mainImageUrl || "");

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={reduce ? {} : { opacity: 1, y: 0 }}
      whileHover={reduce ? {} : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-white/10 shadow-lg shadow-black/20"
    >
      <div className="aspect-[4/3] bg-black/20 relative group">
        {main ? (
          <img src={main} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/40">No image</div>
        )}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={false}
          animate={reduce ? { opacity: 1 } : {}}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-5">
            <motion.div
              initial={false}
              animate={reduce ? {} : { y: 4, opacity: 0 }}
              whileHover={reduce ? {} : { y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="inline-block"
            >
              <div className="backdrop-blur-xl bg-black/40 rounded-[20px] px-[18px] py-2 border border-white/10 shadow-2xl">
                <h3 className="font-normal text-[13px] tracking-[0.15em] uppercase text-white/95 leading-[1.4]" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
                  {item.title || "Untitled"}
                </h3>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
