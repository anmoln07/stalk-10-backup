import { shuffle, type Rng } from "./rng";

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

const KEY = "sleuth.bag.v1";

export function loadBag(): BagState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || !Array.isArray(v.bag)) return null;
    return { bag: v.bag.filter((x: unknown) => typeof x === "string"), last: typeof v.last === "string" ? v.last : null };
  } catch {
    return null;
  }
}

export function saveBag(state: BagState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage full: the game still works, just without cross-reload memory */
  }
}
