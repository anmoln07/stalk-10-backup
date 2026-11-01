"use client";
import { useEffect, useState } from "react";
import { STICKERS } from "./stickers";

/**
 * First-visit loader: a tiny 00 → 99 counter while Kitbitz stickers pile up along a curve, then it lifts away.
 * Once per tab (sessionStorage), never with reduced motion or in kiosk mode.
 */
export default function Loader({ skip }: { skip?: boolean }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"off" | "run" | "out">("off");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("stalk10-loaded") === "1"; sessionStorage.setItem("stalk10-loaded", "1"); } catch {}
    if (skip || seen || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPhase("run");
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / 1500);
      setN(Math.round(99 * (1 - Math.pow(1 - k, 2.2))));
      if (k < 1) raf = requestAnimationFrame(tick);
      else window.setTimeout(() => setPhase("out"), 180);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [skip]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => setPhase("off"), 700);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "off") return null;
  const shown = Math.floor((n / 99) * 12);
  return (
    <div aria-hidden className={`loader fixed inset-0 z-[60] bg-white ${phase === "out" ? "loader-out" : ""}`}>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-medium tabular-nums text-black">
        {String(n).padStart(2, "0")}
      </span>
      {Array.from({ length: shown }, (_, i) => {
        // An S-curve across the screen, like the sticker swarm on the reference site.
        const t = i / 11;
        const x = 10 + t * 80;
        const y = 50 + Math.sin(t * Math.PI * 2) * 22;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={STICKERS[i % STICKERS.length]} alt="" className="loader-sticker absolute w-[clamp(64px,9vw,120px)]"
            style={{ left: `${x}%`, top: `${y}%`, ["--r" as string]: `${(i * 37) % 30 - 15}deg` }} />
        );
      })}
    </div>
  );
}
