"use client";
import { useEffect, useRef, useState } from "react";
import { useVisible } from "./visible";

const still = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Value noise + fbm, small and dependency-free. */
function hash(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) { let v = 0, a = 0.5; for (let i = 0; i < 5; i++) { v += a * noise(x, y); x *= 2.02; y *= 2.02; a *= 0.5; } return v; }

/** Hero sky: soft drifting clouds in green + grey that fade into the white page (the reference's pink/blue sky). */
export function Sky({ className = "" }: { className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    const W = 160, H = 60;
    c.width = W; c.height = H;
    const img = g.createImageData(W, H);
    let raf = 0;
    const draw = (t: number) => {
      const s = t / 9000;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const n = fbm(x / 34 + s, y / 22 - s * 0.3);
        const m = fbm(x / 20 - s * 0.6 + 7, y / 16 + 3);
        const fade = Math.min(1, Math.max(0, 1 - y / (H * 0.95)));
        const i = (y * W + x) * 4;
        // grey base, green where the second field is high, white highlights
        const green = Math.max(0, m - 0.52) * 3.2 * fade;
        const grey = Math.max(0, n - 0.35) * 1.6 * fade;
        const r = 255 - grey * 120 - green * 200, gg = 255 - grey * 110 - green * 50, b = 255 - grey * 110 - green * 140;
        img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    };
    // Drawn once: a moving blurred canvas repaints the whole hero every frame and makes scrolling stutter.
    raf = requestAnimationFrame(() => draw(4000));
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={cv} aria-hidden className={`pointer-events-none block h-full w-full blur-[18px] ${className}`} />;
}

/** Halftone blobs: black dots on green whose size follows a few soft blobs (the reference's dithered spheres). */
export function Halftone({ className = "" }: { className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    const draw = () => {
      const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const blobs = [[0.92, 0.42, 0.2], [0.06, 0.8, 0.24], [0.52, 1.04, 0.28], [0.97, 0.97, 0.14]];
      const step = 6, R = Math.max(w, h);
      g.fillStyle = "#0b0b0b";
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        let v = 0;
        for (const [bx, by, br] of blobs) { const d = Math.hypot(x - bx * w, y - by * h) / (br * R); v += Math.max(0, 1 - d * d); }
        v += (fbm(x / 90, y / 90) - 0.5) * 0.35 + (Math.random() - 0.5) * 0.12;
        v *= Math.min(1, Math.max(0, (y - h * 0.12) / (h * 0.3))); // keep the heading area clear
        const r = Math.min(step * 0.62, Math.max(0, v) * step * 0.7);
        if (r > 0.45) { g.beginPath(); g.arc(x + step / 2, y + step / 2, r, 0, 6.283); g.fill(); }
      }
    };
    draw();
    const ro = new ResizeObserver(draw); ro.observe(c);
    return () => ro.disconnect();
  }, []);
  return <canvas ref={cv} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}

/** Conway's Game of Life with a glider, in a tiny window (like "Glider 1.1"). */
export function Glider() {
  const N = 10;
  const [grid, setGrid] = useState<number[]>(() => {
    const g = Array(N * N).fill(0);
    [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(([x, y]) => (g[y * N + x] = 1));
    return g;
  });
  useEffect(() => {
    if (still()) return;
    const t = window.setInterval(() => setGrid((g) => g.map((v, i) => {
      const x = i % N, y = (i / N) | 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += g[((y + dy + N) % N) * N + ((x + dx + N) % N)];
      return n === 3 || (v && n === 2) ? 1 : 0;
    })), 260);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="grid gap-[2px] p-1" style={{ gridTemplateColumns: `repeat(${N}, 8px)` }} aria-hidden>
      {grid.map((v, i) => <span key={i} className={`h-2 w-2 ${v ? "bg-black" : "bg-black/[.06]"}`} />)}
    </div>
  );
}

/** Live clock (like "Clock Tool 1.1"). */
export function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const f = () => setNow(new Date().toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    f();
    const t = window.setInterval(f, 1000);
    return () => window.clearInterval(t);
  }, []);
  return <span className="tabular-nums">{now || " "}</span>;
}

/** Dashed wireframe cube slowly turning (footer). */
export function Cube({ className = "" }: { className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const vis = useVisible(cv);
  useEffect(() => {
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    let raf = 0;
    const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])));
    const E: [number, number][] = [];
    V.forEach((a, i) => V.forEach((b, j) => { if (j > i && a.filter((v, k) => v !== b[k]).length === 1) E.push([i, j]); }));
    const frame = (t: number) => {
      if (!vis.current) { raf = requestAnimationFrame(frame); return; }
      const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const a = t / 5200, b = 0.55 + Math.sin(t / 7000) * 0.15, s = Math.min(w, h) * 0.32;
      const P = V.map(([x, y, z]) => {
        const x1 = x * Math.cos(a) - z * Math.sin(a), z1 = x * Math.sin(a) + z * Math.cos(a);
        const y1 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
        const p = 3.2 / (3.2 + z2);
        return [w / 2 + x1 * s * p, h / 2 + y1 * s * p];
      });
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.2; g.setLineDash([7, 5]);
      E.forEach(([i, j]) => { g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke(); });
      if (!still()) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [vis]);
  return <canvas ref={cv} aria-hidden className={`pointer-events-none ${className}`} />;
}
