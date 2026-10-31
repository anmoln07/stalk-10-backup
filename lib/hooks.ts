"use client";
import { useEffect, useRef, useState } from "react";
import { parseParams, type GameParams } from "./params";

/** URL params, read on the client after mount (keeps pages static). */
export function useGameParams(): GameParams | null {
  const [p, setP] = useState<GameParams | null>(null);
  useEffect(() => setP(parseParams(window.location.search)), []);
  return p;
}

/** performance.now(), refreshed every animation frame while `active`. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

/** Latest-callback ref so effects don't re-run when handlers change. */
export function useLatest<T>(v: T) {
  const r = useRef(v);
  r.current = v;
  return r;
}

/** Global key handler. */
export function useKeys(handler: (e: KeyboardEvent) => void) {
  const h = useLatest(handler);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      h.current(e);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [h]);
}

/** Calls `onIdle` after `ms` with no pointer/key/touch activity while `active`. */
export function useIdle(active: boolean, ms: number, onIdle: () => void) {
  const cb = useLatest(onIdle);
  useEffect(() => {
    if (!active) return;
    let t = window.setTimeout(() => cb.current(), ms);
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => cb.current(), ms);
    };
    const evs = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"] as const;
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [active, ms, cb]);
}
