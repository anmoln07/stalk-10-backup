export type GameParams = { seed: number | null; lookSeconds: number; kiosk: boolean; query: string };

export const DEFAULT_LOOK_SECONDS = 10;

/** Reads ?seed=123, ?time=15, ?kiosk=1. `query` keeps them for links between screens. */
export function parseParams(search: string): GameParams {
  const q = new URLSearchParams(search);
  const seedRaw = q.get("seed");
  const seed = seedRaw !== null && /^\d{1,9}$/.test(seedRaw) ? Number(seedRaw) : null;
  const t = Number(q.get("time"));
  const lookSeconds = Number.isFinite(t) && t >= 3 && t <= 60 ? Math.round(t) : DEFAULT_LOOK_SECONDS;
  const kiosk = q.get("kiosk") === "1";
  const keep = new URLSearchParams();
  for (const k of ["seed", "time", "kiosk"]) {
    const v = q.get(k);
    if (v !== null) keep.set(k, v);
  }
  const s = keep.toString();
  return { seed, lookSeconds, kiosk, query: s ? `?${s}` : "" };
}
