import type { CalcFact, Card, Category, Difficulty, Fact, FactKind, NotFact, PhotoFact, Profile, RecallFact } from "@/content/types";
import { factKind } from "@/content/types";
import { lookalikesFor } from "@/content/lookalikes";
import { QUESTIONS_PER_ROUND, RULES } from "@/content/rules";
import { shuffle, type Rng } from "./rng";
import { containsPhrase, formatAgo, isSafeDistractor, isSafeLookalike, minutesOf, profileText, sigWords } from "./text";
import { imageWords } from "./images";

export const OPTIONS_PER_QUESTION = 4;
export { QUESTIONS_PER_ROUND };

export type Question = {
  factId: string;
  kind: FactKind;
  question: string;
  answer: string; // the right option (for NOT questions: the one that wasn't on the profile)
  options: string[]; // 4, shuffled
  correctIndex: number;
  decoys: string[]; // wrong options that ARE on the profile, in another role
  lookalikes: string[]; // near-miss wrong options (or, for NOT, the near-miss right answer)
};

export type Round = { index: number; difficulty: Difficulty; profile: Profile; feed: Card[]; questions: Question[] };
export type Run = { rounds: Round[] };
export type Pools = Record<Category, string[]>;

const lc = (s: string) => s.trim().toLowerCase();

/** Pool entries that are safe wrong answers for this fact on this profile. */
export function safeCandidates(profile: Profile, answer: string, pool: readonly string[]): string[] {
  const text = profileText(profile);
  const shown = imageWords(profile);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of pool) {
    const k = lc(c);
    if (seen.has(k)) continue;
    seen.add(k);
    if (isSafeDistractor(c, answer, text, shown)) out.push(c.trim());
  }
  return out;
}

/** Look-alikes (global list + the fact's own) that are safe for this profile. */
export function safeLookalikes(profile: Profile, answer: string, extra: string[] = []): string[] {
  const text = profileText(profile);
  const shown = imageWords(profile);
  const out: string[] = [];
  for (const l of lookalikesFor(answer, extra)) {
    if (out.some((o) => lc(o) === lc(l))) continue;
    if (isSafeLookalike(l, answer, text, shown)) out.push(l.trim());
  }
  return out;
}

/** Value of a calc fact: sum of the clue numbers, or first minus second. */
export function calcValue(f: CalcFact): number {
  const ns = f.parts.map((p) => p.n);
  return f.op === "sum" ? ns.reduce((a, b) => a + b, 0) : ns[0] - ns[1];
}
export const formatCalc = (n: number, unit: string) => `${n} ${unit}`;

/** Adds candidates to `out` until it has `want` entries, skipping duplicates and overlaps. */
function take(out: string[], cands: string[], want: number) {
  for (const c of cands) {
    if (out.length >= want) return;
    const k = lc(c);
    if (out.some((o) => lc(o) === k || containsPhrase(o, c) || containsPhrase(c, o))) continue;
    out.push(c);
  }
}

function finish(f: Fact, answer: string, wrong: string[], rng: Rng, extra: { decoys?: string[]; lookalikes?: string[] }): Question {
  if (wrong.length < OPTIONS_PER_QUESTION - 1) throw new Error(`Not enough wrong answers for ${f.id}`);
  const options = shuffle([answer, ...wrong], rng);
  return {
    factId: f.id,
    kind: factKind(f),
    question: f.question,
    answer,
    options,
    correctIndex: options.indexOf(answer),
    decoys: (extra.decoys ?? []).filter((d) => options.includes(d)),
    lookalikes: (extra.lookalikes ?? []).filter((d) => options.includes(d)),
  };
}

function recallQuestion(p: Profile, f: RecallFact | PhotoFact, rng: Rng, pools: Pools): Question {
  const rule = RULES[p.difficulty];
  const wrong: string[] = [f.answer];
  const decoys = shuffle((f.decoys ?? []).filter((d) => lc(d) !== lc(f.answer)), rng);
  take(wrong, decoys, 1 + rule.decoys);
  const looks = shuffle(safeLookalikes(p, f.answer, f.lookalikes), rng);
  take(wrong, looks, wrong.length + rule.lookalikes);
  take(wrong, shuffle(safeCandidates(p, f.answer, pools[f.category] ?? []), rng), OPTIONS_PER_QUESTION);
  return finish(f, f.answer, wrong.slice(1), rng, { decoys, lookalikes: looks });
}

function notQuestion(p: Profile, f: NotFact, rng: Rng, pools: Pools): Question {
  const text = profileText(p);
  const shown = imageWords(p);
  const present = shuffle(f.present, rng).slice(0, OPTIONS_PER_QUESTION - 1);
  const absentOk = (c: string) => f.present.every((x) => isSafeDistractor(c, x, text, shown));
  let absent: string | undefined;
  let looks: string[] = [];
  if (RULES[p.difficulty].lookalikes > 0 && p.difficulty === "hard") {
    looks = shuffle(f.present.flatMap((x) => lookalikesFor(x)), rng).filter((l) => f.present.every((x) => isSafeLookalike(l, x, text, shown)));
    absent = looks.find((l) => !present.some((x) => lc(x) === lc(l)));
  }
  if (!absent) {
    const pool = shuffle(f.categories.flatMap((c) => pools[c] ?? []), rng).filter(absentOk);
    absent = pool.find((c) => !present.some((x) => sigWords(x).some((w) => sigWords(c).includes(w))));
  }
  if (!absent) throw new Error(`No absent option for ${p.id}/${f.id}`);
  return finish(f, absent, present, rng, { lookalikes: looks });
}

function calcQuestion(p: Profile, f: CalcFact, rng: Rng): Question {
  const text = profileText(p);
  const v = calcValue(f);
  const clueNs = shuffle([...new Set(f.parts.map((x) => x.n))].filter((n) => n !== v && n > 0), rng);
  const near = shuffle([v - 2, v - 1, v + 1, v + 2, v + 3, v - 3].filter((n) => n > 0 && n !== v), rng);
  const nums: number[] = [];
  const add = (n: number) => !nums.includes(n) && nums.length < OPTIONS_PER_QUESTION - 1 && nums.push(n);
  if (RULES[p.difficulty].decoys > 0 && clueNs.length) add(clueNs[0]);
  near.forEach(add);
  const wrong = nums.map((n) => formatCalc(n, f.unit));
  const answer = formatCalc(v, f.unit);
  // numbers copied from the posts ("40 km") are decoys: on the profile, but not the answer
  return finish(f, answer, wrong, rng, { decoys: wrong.filter((w) => containsPhrase(text, w)) });
}

export function buildQuestion(p: Profile, f: Fact, rng: Rng, pools: Pools): Question {
  switch (f.kind) {
    case "not":
      return notQuestion(p, f, rng, pools);
    case "calc":
      return calcQuestion(p, f, rng);
    default:
      return recallQuestion(p, f, rng, pools);
  }
}

/**
 * Picks this round's 5 facts: on Medium/Hard at least `minSpecial` photo/NOT/calc facts (when the
 * profile has them), the rest at random. A NOT question always comes last (it lists 3 things that
 * were on the profile, which would hint at other answers).
 */
export function pickFacts(p: Profile, rng: Rng): Fact[] {
  const special = shuffle(p.facts.filter((f) => factKind(f) !== "recall"), rng);
  const must = special.slice(0, RULES[p.difficulty].minSpecial);
  const rest = shuffle(p.facts.filter((f) => !must.includes(f)), rng).slice(0, QUESTIONS_PER_ROUND - must.length);
  const picked = shuffle([...must, ...rest], rng);
  return [...picked.filter((f) => f.kind !== "not"), ...picked.filter((f) => f.kind === "not")];
}

/**
 * Feed order is shuffled every play. Timestamps stay with positions (newest on top), so the feed
 * still reads like a real timeline; facts never depend on a post's timestamp.
 */
export function shuffleFeed(feed: Card[], rng: Rng): Card[] {
  const times = feed.map((c) => c.time).sort((a, b) => minutesOf(a) - minutesOf(b));
  return shuffle(feed, rng).map((c, i) => ({ ...c, time: times[i] }));
}

/** A friend's reply reads as posted a while after the post it answers. */
export const replyTime = (postTime: string, k: number) => formatAgo(minutesOf(postTime) * (0.6 - k * 0.2));

export function buildRound(p: Profile, index: number, rng: Rng, pools: Pools): Round {
  const feed = shuffleFeed(p.feed, rng);
  const questions = pickFacts(p, rng).map((f) => buildQuestion(p, f, rng, pools));
  return { index, difficulty: p.difficulty, profile: p, feed, questions };
}

/** One game: one profile per difficulty, Easy -> Medium -> Hard. */
export function buildRun(chosen: Profile[], rng: Rng, pools: Pools): Run {
  return { rounds: chosen.map((p, i) => buildRound(p, i, rng, pools)) };
}
