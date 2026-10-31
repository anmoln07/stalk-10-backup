import { shuffle, type Rng } from "./rng";
import { DIFFICULTIES, type Difficulty, type Profile } from "@/content/types";

/** Shuffle bag: every id comes out once before any repeats; never the same id twice in a row. */
export type BagState = { bag: string[]; last: string | null };

export function drawFromBag(state: BagState | null, ids: readonly string[], rng: Rng): { id: string; state: BagState } {
  if (ids.length === 0) throw new Error("drawFromBag: no ids");
  const last = state?.last ?? null;
  // Drop stale ids (e.g. a profile was removed since the bag was saved).
  let bag = (state?.bag ?? []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
  // Only possible with a hand-edited / corrupt saved bag: never let `last` come out next.
  if (bag[0] === last) bag = bag.length > 1 ? [bag[1], bag[0], ...bag.slice(2)] : [];
  if (bag.length === 0) {
    bag = shuffle(ids, rng);
    if (bag.length > 1 && bag[0] === last) {
      const j = 1 + Math.floor(rng() * (bag.length - 1));
      [bag[0], bag[j]] = [bag[j], bag[0]];
    }
  }
  const [id, ...rest] = bag;
  return { id, state: { bag: rest, last: id } };
}

/** One bag per difficulty, so every Easy profile comes up before an Easy repeats (same for Medium/Hard). */
export type Bags = Partial<Record<Difficulty, BagState>>;

/**
 * Draws one profile per difficulty (Easy, Medium, Hard). `force` (?profile=id) replaces the pick for
 * that profile's difficulty; the bag still advances.
 */
export function drawProfiles(bags: Bags | null, all: readonly Profile[], rng: Rng, force: string | null = null): { chosen: Profile[]; bags: Bags } {
  const next: Bags = {};
  const chosen = DIFFICULTIES.map((d) => {
    const ids = all.filter((p) => p.difficulty === d).map((p) => p.id);
    const r = drawFromBag(bags?.[d] ?? null, ids, rng);
    next[d] = r.state;
    const forced = all.find((p) => p.id === force && p.difficulty === d);
    return forced ?? all.find((p) => p.id === r.id)!;
  });
  return { chosen, bags: next };
}

const KEY = "sleuth.bags.v2";

const clean = (v: unknown): BagState | undefined => {
  if (!v || typeof v !== "object" || !Array.isArray((v as BagState).bag)) return undefined;
  const b = v as BagState;
  return { bag: b.bag.filter((x: unknown) => typeof x === "string"), last: typeof b.last === "string" ? b.last : null };
};

export function loadBags(): Bags | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    const out: Bags = {};
    for (const d of DIFFICULTIES) {
      const b = clean(v[d]);
      if (b) out[d] = b;
    }
    return out;
  } catch {
    return null;
  }
}

export function saveBags(state: Bags): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage full: the game still works, just without cross-reload memory */
  }
}
