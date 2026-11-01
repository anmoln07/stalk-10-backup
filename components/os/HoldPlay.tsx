"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BAYER } from "./eye";
import { useVisible } from "./visible";

/**
 * HOLD TO STALK: the Play button (after evilbuttons.com's Hold + Dither buttons).
 * Press and hold: a green ordered-dither wave fills the black pill in ~0.9 s while the background eye widens
 * (it listens to "stalk10:charge"). Let go early: it shakes and drains ("too soon"). Fill it: the pill bursts into
 * pixels, then the classic Mac zoom-rectangles + a pixel loading bar, then the game.
 * Enter (or the "stalk10:launch" event from the nav/footer) auto-fills it fast, so the stall never waits.
 * Reduced motion: a plain click starts the game.
 */
const HOLD_MS = 900;
const CELL = 4; // dither cell, CSS px

export default function HoldPlay({ onPlay, testId }: { onPlay: () => void; testId?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const prog = useRef(0);
  const holding = useRef(false);
  const auto = useRef(false);
  const [p, setP] = useState(0);
  const [state, setState] = useState<"idle" | "hold" | "soon" | "done">("idle");
  const [burst, setBurst] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [load, setLoad] = useState(-1);
  const still = useRef(false);
  const vis = useVisible(btn);

  const emit = (v: number) => window.dispatchEvent(new CustomEvent("stalk10:charge", { detail: v }));

  const finish = useCallback(() => {
    if (state === "done") return;
    setState("done");
    emit(1);
    const r = btn.current?.getBoundingClientRect();
    if (still.current || !r) return onPlay();
    setBurst({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [onPlay, state]);

  // The fill + dither wave, drawn every frame
  useEffect(() => {
    still.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    let raf = 0, last = performance.now(), shown = -1;
    const frame = (now: number) => {
      const dt = now - last; last = now;
      if (!vis.current && !holding.current && !auto.current) { raf = requestAnimationFrame(frame); return; }
      const w = Math.ceil(c.clientWidth / CELL), h = Math.ceil(c.clientHeight / CELL);
      if (!w || !h) { raf = requestAnimationFrame(frame); return; }
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      // progress
      const speed = auto.current ? 3.2 : 1;
      if (holding.current || auto.current) prog.current = Math.min(1, prog.current + (dt / HOLD_MS) * speed);
      else prog.current = Math.max(0, prog.current - dt / 260);
      const pr = prog.current;
      if (pr !== shown) { shown = pr; setP(pr); emit(pr); }
      if (pr >= 1 && (holding.current || auto.current)) { holding.current = false; auto.current = false; finish(); }
      // draw: green dither where the wave is "on", only inside the filled part (+ a breathing peek at idle)
      const img = g.createImageData(w, h);
      const peek = pr > 0 ? 0 : 0.05 + 0.025 * Math.sin(now / 400);
      const edge = Math.max(pr, peek) * w;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const wave = Math.sin(x * 0.35 - now / 120 + Math.sin(y * 0.5 + now / 300) * 1.4) * 0.5 + 0.5;
        const front = Math.max(0, 1 - (edge - x) / 6); // denser right at the leading edge
        // solid green behind the label; the dither wave only lives in a band at the leading edge
        const band = edge - x;
        const v = x >= edge ? 0 : band > 10 ? 1 : 0.15 + wave * 0.45 + front * 0.4;
        const on = v > BAYER[(y & 3) * 4 + (x & 3)];
        const i = (y * w + x) * 4;
        if (on) { img.data[i] = 60; img.data[i + 1] = 207; img.data[i + 2] = 122; img.data[i + 3] = 255; }
      }
      g.putImageData(img, 0, 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [finish, vis]);

  const down = (e: React.PointerEvent) => {
    if (state === "done") return;
    if (still.current) return finish();
    e.currentTarget.setPointerCapture(e.pointerId);
    holding.current = true;
    setState("hold");
  };
  const up = () => {
    if (!holding.current) return;
    holding.current = false;
    if (prog.current < 1) { setState("soon"); window.setTimeout(() => setState((s) => (s === "soon" ? "idle" : s)), 650); }
  };

  // Enter / nav "Play now" / footer: auto-fill quickly
  useEffect(() => {
    const go = () => { if (state !== "done") { if (still.current) finish(); else { auto.current = true; setState("hold"); } } };
    window.addEventListener("stalk10:launch", go);
    return () => window.removeEventListener("stalk10:launch", go);
  }, [state, finish]);

  // burst → zoom rects → loading bar → play
  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setLoad(0), 650);
    return () => window.clearTimeout(t);
  }, [burst]);
  useEffect(() => {
    if (load < 0) return;
    if (load >= 12) { const t = window.setTimeout(onPlay, 100); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => setLoad((n) => n + 1), 38);
    return () => window.clearTimeout(t);
  }, [load, onPlay]);

  const label = state === "soon" ? "Too soon!" : state === "hold" ? (p > 0.6 ? "Almost…" : "Keep holding…") : state === "done" ? "Target acquired" : "Hold to stalk";
  const secs = Math.max(0, Math.ceil((1 - p) * 10));

  return (
    <>
      <div className="relative">
        <span aria-hidden className="hold-hint font-pixel">press &amp; hold</span>
        <button
          ref={btn}
          type="button"
          data-testid={testId}
          aria-label="Play Stalk 10 (press and hold, or press Enter)"
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={up}
          onLostPointerCapture={up}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); window.dispatchEvent(new Event("stalk10:launch")); } }}
          onContextMenu={(e) => e.preventDefault()}
          className={`hold-btn relative block h-[92px] w-[min(440px,calc(100vw-40px))] select-none overflow-hidden rounded-full bg-[#0b0b0b] text-white outline-none sm:h-[104px] ${state === "soon" ? "shake" : ""} ${state === "hold" ? "is-hold" : ""} ${state === "done" ? "is-done" : ""}`}
          style={{ touchAction: "none", WebkitTouchCallout: "none" }}
        >
          <canvas ref={cv} aria-hidden className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          {/* white label, then the same label in black clipped to the filled part */}
          <span aria-hidden className="hold-label">{label}<span className="hold-secs">{secs}s</span></span>
          <span aria-hidden className="hold-label text-black" style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)` }}>{label}<span className="hold-secs">{secs}s</span></span>
        </button>
        <p className="mt-2 text-center font-plex text-[11px] text-black/55">
          <span className="[@media(hover:hover)]:hidden">Press and hold the button</span>
          <span className="hidden [@media(hover:hover)]:inline">Hold the button, or just press ↵ Enter</span>
        </p>
      </div>

      {burst && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[80]">
          {/* pixel shards flying out of the pill */}
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.2, dist = 120 + ((i * 53) % 160);
            return (
              <span key={`s${i}`} className="shard" style={{
                left: burst.x + burst.w / 2 + Math.cos(a) * burst.w * 0.35, top: burst.y + burst.h / 2 + Math.sin(a) * burst.h * 0.35,
                ["--dx" as string]: `${Math.cos(a) * dist}px`, ["--dy" as string]: `${Math.sin(a) * dist}px`,
                background: i % 3 ? "#0b0b0b" : "#3ccf7a", width: 6 + (i % 4) * 3, height: 6 + (i % 4) * 3,
              }} />
            );
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const k = (i + 1) / 9, vw = window.innerWidth, vh = window.innerHeight;
            return (
              <span key={i} className="zoom-rect" style={{
                left: burst.x * (1 - k), top: burst.y * (1 - k), width: burst.w + (vw - burst.w) * k, height: burst.h + (vh - burst.h) * k,
                animationDelay: `${250 + i * 40}ms`,
              }} />
            );
          })}
          {load >= 0 && (
            <div className="absolute inset-0 grid place-items-center">
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
