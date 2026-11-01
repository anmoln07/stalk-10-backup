"use client";
import { useEffect, useRef, useState } from "react";
import Window from "./Window";

/**
 * PLAY.app: the memorable Play button.
 * A 1-bit dithered pixel eye that follows the pointer and blinks. Hover makes the dither "boil" and the pupil widen.
 * Pressing it plays the classic Mac zoom-rectangles from the button to the full screen, a pixel loading bar fills,
 * then the game starts. Reduced motion: still eye, no zoom, starts straight away.
 */
const W = 84, H = 44; // eye canvas in "pixels" (scaled up with image-rendering: pixelated)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export default function PlayApp({ onPlay, testId, big = false }: { onPlay: () => void; testId?: string; big?: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const hover = useRef(false);
  const look = useRef({ x: 0, y: 0 });
  const [launch, setLaunch] = useState<null | { x: number; y: number; w: number; h: number }>(null);
  const [load, setLoad] = useState(-1);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    c.width = W; c.height = H;
    const img = g.createImageData(W, H);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, blinkAt = performance.now() + 1800, px = 0, py = 0, dil = 0;
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 420);
      look.current = { x: (dx / d) * k, y: (dy / d) * k };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const frame = (now: number) => {
      // ease toward the target
      px += (look.current.x - px) * 0.18; py += (look.current.y - py) * 0.18;
      dil += ((hover.current ? 1 : 0) - dil) * 0.15;
      // blink: lid closes over ~140ms every few seconds
      let lid = 1;
      const bt = now - blinkAt;
      if (bt > 0 && bt < 180) lid = Math.abs(bt - 90) / 90;
      if (bt >= 180) blinkAt = now + 2200 + Math.random() * 2600;
      const boil = hover.current && !still ? now / 60 : 0;
      const cx = W / 2, cy = H / 2, ew = W * 0.46, eh = H * 0.44 * Math.max(0.06, lid);
      const ix = cx + px * ew * 0.42, iy = cy + py * eh * 0.4, ir = H * 0.27, pr = ir * (0.38 + dil * 0.2);
      const d = img.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        // almond: |x|/ew + (y/eh)^2 style lens, made from two arcs
        const nx = (x - cx) / ew, ny = (y - cy) / eh;
        const lens = ny * ny + nx * nx * nx * nx * 0.9 + nx * nx * 0.1; // <1 inside the eye
        const edge = Math.abs(lens - 1) < 0.16 + (1 / eh) * 0.6;
        let v = 1; // 1 = white, 0 = black
        let green = false;
        if (lens < 1) {
          v = 0.92 - 0.5 * Math.max(0, lens - 0.45); // sclera, shaded at the edges
          const rx = x - ix, ry = (y - iy) * 1.05, r = Math.hypot(rx, ry);
          if (r < ir) {
            const ang = Math.atan2(ry, rx);
            v = 0.42 + 0.18 * Math.sin(ang * 9 + r) - (r / ir) * 0.2; // iris with streaks
            green = true;
            if (r < pr) { v = 0; green = false; }
            if (Math.hypot(rx + ir * 0.35, ry + ir * 0.35) < ir * 0.22) { v = 1; green = false; } // highlight
          }
        }
        if (edge && lens > 0.7) v = 0;
        const t = BAYER[((y + (boil | 0)) & 3) * 4 + ((x + ((boil * 3) | 0)) & 3)] + (boil ? (Math.random() - 0.5) * 0.25 : 0);
        const on = v < t; // black ink
        const i = (y * W + x) * 4;
        if (on) { d[i] = green ? 31 : 10; d[i + 1] = green ? 143 : 10; d[i + 2] = green ? 78 : 10; }
        else { d[i] = green ? 60 : 255; d[i + 1] = green ? 207 : 255; d[i + 2] = green ? 122 : 255; }
        d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);

  const go = () => {
    if (launch) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = btn.current?.getBoundingClientRect();
    if (still || !r) return onPlay();
    setLaunch({ x: r.left, y: r.top, w: r.width, h: r.height });
  };
  useEffect(() => {
    const on = () => go();
    window.addEventListener("stalk10:launch", on);
    return () => window.removeEventListener("stalk10:launch", on);
  });

  // Zoom rectangles (≈420ms) → loading bar (≈550ms) → play
  useEffect(() => {
    if (!launch) return;
    const t1 = window.setTimeout(() => setLoad(0), 420);
    return () => window.clearTimeout(t1);
  }, [launch]);
  useEffect(() => {
    if (load < 0) return;
    if (load >= 12) { const t = window.setTimeout(onPlay, 120); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => setLoad((n) => n + 1), 42);
    return () => window.clearTimeout(t);
  }, [load, onPlay]);

  return (
    <>
      <Window title="PLAY.app" className={`play-app max-w-[calc(100vw-48px)] ${big ? "w-[340px]" : "w-[280px]"}`}>
        <button
          ref={btn}
          type="button"
          onClick={go}
          onPointerEnter={() => (hover.current = true)}
          onPointerLeave={() => (hover.current = false)}
          onFocus={() => (hover.current = true)}
          onBlur={() => (hover.current = false)}
          data-testid={testId}
          aria-label="Play Stalk 10"
          className="play-hit group block w-full outline-none"
        >
          <canvas ref={cv} aria-hidden className="block w-full [image-rendering:pixelated]" style={{ aspectRatio: `${W} / ${H}` }} />
          <span className="play-label flex items-center justify-between border-t border-black px-3 py-2 font-pixel text-[32px] font-semibold leading-none">
            <span className="flex items-center gap-2"><span className="play-tri" aria-hidden>▶</span>PLAY</span>
            <span className="hidden font-plex text-[11px] font-normal text-black/50 [@media(hover:hover)]:inline">↵ Enter</span>
          </span>
        </button>
      </Window>

      {launch && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[80]">
          {Array.from({ length: 9 }, (_, i) => {
            const k = (i + 1) / 9;
            const vw = typeof window !== "undefined" ? window.innerWidth : 0, vh = typeof window !== "undefined" ? window.innerHeight : 0;
            return (
              <span key={i} className="zoom-rect" style={{
                left: launch.x * (1 - k), top: launch.y * (1 - k),
                width: launch.w + (vw - launch.w) * k, height: launch.h + (vh - launch.h) * k,
                animationDelay: `${i * 40}ms`,
              }} />
            );
          })}
          {load >= 0 && (
            <div className="absolute inset-0 grid place-items-center bg-white/0">
              <div className="os-win w-[280px]">
                <div className="os-title"><span className="os-title-text">Stalk 10</span></div>
                <div className="os-body bg-white px-3 py-3 font-pixel text-[15px]">
                  <p>Loading target…</p>
                  <div className="mt-2 flex h-4 gap-[2px] border border-black p-[2px]">
                    {Array.from({ length: 12 }, (_, i) => <span key={i} className={`flex-1 ${i < load ? "bg-black" : ""}`} />)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
