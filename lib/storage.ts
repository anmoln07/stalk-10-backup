// Per-device conveniences only. Every access is wrapped: storage can be missing or throw.

const BEST = "sleuth.best.v1";
const LESSON = "sleuth.lesson.v1";
const SESSION_MS = 6 * 60 * 60 * 1000; // "best this session" = best in the last 6 hours on this device

export function getBest(): number | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(BEST) ?? "null");
    if (!v || typeof v.best !== "number" || Date.now() - v.at > SESSION_MS) return null;
    return v.best;
  } catch {
    return null;
  }
}

/** Records a score; returns the (possibly new) best. */
export function recordScore(score: number): number {
  const prev = getBest();
  const best = prev === null ? score : Math.max(prev, score);
  try {
    window.localStorage.setItem(BEST, JSON.stringify({ best, at: Date.now() }));
  } catch {
    /* ignore */
  }
  return best;
}

/** Rotating index for the lesson line. */
export function nextLessonIndex(count: number): number {
  try {
    const n = (Number(window.localStorage.getItem(LESSON)) || 0) % count;
    window.localStorage.setItem(LESSON, String((n + 1) % count));
    return n;
  } catch {
    return Math.floor(Math.random() * count);
  }
}
