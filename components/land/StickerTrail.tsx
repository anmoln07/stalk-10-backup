"use client";
import { useEffect, useRef } from "react";
import { STICKERS } from "./stickers";

/**
 * Kitbitz stickers that pop out behind the pointer (and a finger dragging on phones), then shrink away.
 * One fixed layer, plain DOM nodes (no React state per sticker). Off for reduced motion.
 */
export default function StickerTrail() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = layer.current;
    if (!el) return;
    let lx = -999, ly = -999, i = Math.floor(Math.random() * STICKERS.length);
    const spawn = (x: number, y: number) => {
      const d = Math.hypot(x - lx, y - ly);
      if (d < 64) return;
      lx = x; ly = y;
      if (el.childElementCount > 26) el.firstElementChild?.remove();
      const img = document.createElement("img");
      img.src = STICKERS[i++ % STICKERS.length];
      img.alt = "";
      img.draggable = false;
      const size = 84 + Math.random() * 70;
      img.className = "sticker";
      img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;--r:${(Math.random() * 40 - 20).toFixed(1)}deg`;
      el.appendChild(img);
      window.setTimeout(() => img.remove(), 1500);
    };
    const onPointer = (e: PointerEvent) => spawn(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) spawn(t.clientX, t.clientY); };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden" />;
}
