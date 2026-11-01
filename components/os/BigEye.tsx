"use client";
import { useEffect, useRef } from "react";
import { drawEye } from "./eye";
import { isScrolling, useVisible } from "./visible";

/**
 * A huge, faint dithered eye behind the hero. It follows the pointer, blinks now and then, and reacts to the
 * Play button: holding it ("stalk10:charge", detail 0..1) widens the eye and turns the iris green.
 */
export default function BigEye({ className = "" }: { className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const vis = useVisible(cv);
  useEffect(() => {
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = 150, H = 64;
    c.width = W; c.height = H;
    const img = g.createImageData(W, H);
    let tx = 0, ty = 0, px = 0, py = 0, charge = 0, ch = 0, blinkAt = performance.now() + 2500, raf = 0, lastDraw = 0;
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
    };
    const onCharge = (e: Event) => { charge = (e as CustomEvent<number>).detail; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("stalk10:charge", onCharge);
    const frame = (now: number) => {
      // off screen: do nothing; on screen: ~30 fps is plenty for a dithered eye
      if (!still && (!vis.current || now - lastDraw < 32 || isScrolling())) { raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      px += (tx - px) * 0.14; py += (ty - py) * 0.08; ch += (charge - ch) * 0.25;
      let lid = 0.82 + ch * 0.18;
      const bt = now - blinkAt;
      if (bt > 0 && bt < 220 && ch < 0.05) lid *= Math.abs(bt - 110) / 110;
      if (bt >= 220) blinkAt = now + 3000 + Math.random() * 3000;
      const k = ch; // grey → green as the button charges
      drawEye(img, {
        px: ch > 0.02 ? px * (1 - ch) : px, py: ch > 0.02 ? py * (1 - ch) + ch * 0.6 : py,
        lid, dil: 0.2 + ch * 0.8, boil: ch > 0.02 && !still ? now / 50 : 0,
        clearPaper: true,
        ink: [Math.round(200 - 190 * k), Math.round(200 - 190 * k), Math.round(200 - 190 * k)], paper: [255, 255, 255],
        iris: [Math.round(160 - 129 * k), Math.round(200 - 57 * k), Math.round(175 - 97 * k)], irisPaper: [Math.round(230 - 170 * k), Math.round(245 - 38 * k), Math.round(236 - 114 * k)],
      });
      g.putImageData(img, 0, 0);
      raf = still ? 0 : requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    if (still) window.addEventListener("stalk10:charge", () => requestAnimationFrame(frame));
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); window.removeEventListener("stalk10:charge", onCharge); };
  }, [vis]);
  return <canvas ref={cv} aria-hidden className={`pointer-events-none [image-rendering:pixelated] ${className}`} style={{ aspectRatio: "150 / 64" }} />;
}
