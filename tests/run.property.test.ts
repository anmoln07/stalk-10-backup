import { describe, expect, it } from "vitest";
import { profiles } from "@/content/profiles";
import { distractors } from "@/content/distractors";
import { QUESTIONS_PER_ROUND, ROUNDS, RULES } from "@/content/rules";
import { buildRun, calcValue, formatCalc, OPTIONS_PER_QUESTION, shuffleFeed, type Question } from "@/lib/buildRun";
import { drawFromBag, drawProfiles, type BagState, type Bags } from "@/lib/bag";
import { mulberry32 } from "@/lib/rng";
import { containsPhrase, minutesOf, postText, postsTabText, profileText, sigWords, stem } from "@/lib/text";
import { imageWords, images, profileImages } from "@/lib/images";
import { DIFFICULTIES, factKind, type Fact, type Profile } from "@/content/types";
import { parseParams } from "@/lib/params";
import { rankFor } from "@/content/ranks";

const SEEDS = 2000;
const lc = (s: string) => s.trim().toLowerCase();
const factOf = (p: Profile, id: string) => p.facts.find((f) => f.id === id)!;
const inPicture = (shown: Set<string>, o: string) => shown.has(lc(o)) || sigWords(o).some((w) => shown.has(w) || shown.has(stem(w)));

/** Checks one built question against the rules for its kind. */
function checkQuestion(p: Profile, q: Question, ctx: string) {
  const text = profileText(p);
  const shown = imageWords(p);
  const f: Fact = factOf(p, q.factId);
  expect(q.kind, ctx).toBe(factKind(f));

  // shape: 4 unique options, exactly one correct
  expect(q.options, ctx).toHaveLength(OPTIONS_PER_QUESTION);
  expect(new Set(q.options.map(lc)).size, `${ctx}: options unique`).toBe(OPTIONS_PER_QUESTION);
  expect(q.options.filter((o) => lc(o) === lc(q.answer)), `${ctx}: exactly one correct`).toHaveLength(1);
  expect(q.options[q.correctIndex], ctx).toBe(q.answer);
  const wrong = q.options.filter((_, i) => i !== q.correctIndex);

  if (f.kind === "not") {
    // the right answer is the one thing that was NOT on the profile; the other three were
    expect(containsPhrase(text, q.answer), `${ctx}: NOT answer "${q.answer}" must not be on the profile`).toBe(false);
    expect(inPicture(shown, q.answer), `${ctx}: NOT answer "${q.answer}" must not be in a picture`).toBe(false);
    for (const o of wrong) {
      expect(f.present, ctx).toContain(o);
      expect(containsPhrase(text, o), `${ctx}: "${o}" must be on the profile`).toBe(true);
    }
    return;
  }

  if (f.kind === "calc") {
    const v = calcValue(f);
    expect(q.answer, `${ctx}: inference answer`).toBe(formatCalc(v, f.unit));
    expect(q.answer, ctx).toBe(f.answer);
    for (const c of f.parts) {
      expect(containsPhrase(postText(p, c.post) ?? "", c.says), `${ctx}: clue "${c.says}" in post ${c.post}`).toBe(true);
      expect(c.says, ctx).toContain(String(c.n));
    }
    for (const o of wrong) {
      const n = Number(o.split(" ")[0]);
      expect(n, ctx).not.toBe(v);
      // a wrong number that is written on the profile must be flagged as a decoy
      if (containsPhrase(text, o)) expect(q.decoys, `${ctx}: "${o}" is on the profile`).toContain(o);
    }
    return;
  }

  // recall + photo
  if (f.kind === "photo") {
    expect(profileImages(p), ctx).toContain(f.image);
    const tags = new Set((images[f.image].shows ?? []).flatMap((t) => [t, ...t.split(/\s+/)]).map(stem));
    expect(tags.has(stem(q.answer)) || sigWords(q.answer).every((w) => tags.has(stem(w))), `${ctx}: photo shows "${q.answer}"`).toBe(true);
  } else {
    expect(containsPhrase(postsTabText(p), q.answer), `${ctx}: answer on the Posts tab`).toBe(true);
  }
  for (const o of wrong) {
    const isDecoy = (f.decoys ?? []).includes(o);
    if (isDecoy) {
      // decoys: on the profile in another role, flagged, never the answer
      expect(containsPhrase(text, o) || inPicture(shown, o), `${ctx}: decoy "${o}" present on profile`).toBe(true);
      expect(q.decoys, ctx).toContain(o);
    } else {
      expect(containsPhrase(text, o), `${ctx}: wrong option "${o}" must not be on profile`).toBe(false);
      expect(shown.has(lc(o)), `${ctx}: wrong option "${o}" must not be shown in a picture`).toBe(false);
    }
  }
  // each question includes a decoy whenever the fact has one
  if ((f.decoys ?? []).length > 0 && RULES[p.difficulty].decoys > 0) expect(q.decoys.length, `${ctx}: includes a decoy`).toBeGreaterThan(0);
}

describe("buildRun (2,000 seeds)", () => {
  it("3 rounds Easy -> Medium -> Hard, 5 valid questions each", () => {
    let bags: Bags | null = null;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = mulberry32(seed);
      const drawn = drawProfiles(bags, profiles, rng);
      bags = drawn.bags;
      const run = buildRun(drawn.chosen, rng, distractors);
      expect(run.rounds).toHaveLength(ROUNDS);
      run.rounds.forEach((r, i) => {
        expect(r.difficulty).toBe(DIFFICULTIES[i]);
        expect(r.profile.difficulty).toBe(DIFFICULTIES[i]);
        expect(r.questions).toHaveLength(QUESTIONS_PER_ROUND);
        expect(new Set(r.questions.map((q) => q.factId)).size).toBe(QUESTIONS_PER_ROUND);
        // harder rounds always ask the special kinds (photo / NOT / calc) when the profile has them
        const special = r.questions.filter((q) => q.kind !== "recall").length;
        const available = r.profile.facts.filter((f) => factKind(f) !== "recall").length;
        expect(special, `seed ${seed} ${r.profile.id}`).toBeGreaterThanOrEqual(Math.min(available, RULES[r.difficulty].minSpecial));
        // a NOT question (which lists 3 things on the profile) is always asked last
        const notAt = r.questions.findIndex((q) => q.kind === "not");
        if (notAt >= 0) expect(notAt).toBe(QUESTIONS_PER_ROUND - 1);
        for (const q of r.questions) checkQuestion(r.profile, q, `seed ${seed} ${r.profile.id}/${q.factId}`);
      });
    }
  });

  it("every fact of every profile builds valid questions (150 seeds each)", () => {
    for (const p of profiles) {
      for (const f of p.facts) {
        for (let seed = 1; seed <= 150; seed++) {
          const run = buildRun([{ ...p, facts: [f, ...p.facts.filter((x) => x !== f)] }], mulberry32(seed), distractors);
          const q = run.rounds[0].questions.find((x) => x.factId === f.id);
          if (q) checkQuestion(p, q, `seed ${seed} ${p.id}/${f.id}`);
        }
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const pick = (s: number) => drawProfiles(null, profiles, mulberry32(s)).chosen;
    const a = buildRun(pick(42), mulberry32(42), distractors);
    const b = buildRun(pick(42), mulberry32(42), distractors);
    expect(a).toEqual(b);
  });

  it("varies which facts are asked and the option order", () => {
    const p = profiles.find((x) => x.difficulty === "hard")!;
    const asked = new Set<string>();
    const firstOptions = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const run = buildRun([p], mulberry32(seed), distractors);
      asked.add(run.rounds[0].questions.map((q) => q.factId).sort().join(","));
      firstOptions.add(run.rounds[0].questions[0].options.join("|"));
    }
    expect(asked.size).toBeGreaterThan(10);
    expect(firstOptions.size).toBeGreaterThan(20);
  });
});

describe("feed shuffle", () => {
  it("reorders posts per seed, keeps every post, and keeps timestamps newest-first", () => {
    for (const p of profiles) {
      const orders = new Set<string>();
      for (let seed = 1; seed <= 40; seed++) {
        const feed = shuffleFeed(p.feed, mulberry32(seed));
        expect(feed).toHaveLength(p.feed.length);
        const mins = feed.map((c) => minutesOf(c.time));
        expect(mins, p.id).toEqual([...mins].sort((a, b) => a - b));
        // same posts (ignoring the reassigned time)
        const key = (c: object) => JSON.stringify({ ...c, time: "" });
        expect(feed.map(key).sort()).toEqual(p.feed.map(key).sort());
        orders.add(feed.map(key).join("§"));
      }
      expect(orders.size, p.id).toBeGreaterThan(30);
      expect(shuffleFeed(p.feed, mulberry32(9))).toEqual(shuffleFeed(p.feed, mulberry32(9)));
    }
  });
});

describe("content", () => {
  it("has ≥ 4 profiles per difficulty", () => {
    for (const d of DIFFICULTIES) expect(profiles.filter((p) => p.difficulty === d).length, d).toBeGreaterThanOrEqual(4);
  });

  it("decoys are on the profile and never the answer", () => {
    for (const p of profiles) {
      const text = profileText(p);
      const shown = imageWords(p);
      for (const f of p.facts) {
        if (f.kind === "not" || f.kind === "calc") continue;
        for (const d of f.decoys ?? []) {
          expect(containsPhrase(text, d) || inPicture(shown, d), `${p.id}/${f.id}: decoy "${d}" on profile`).toBe(true);
          expect(lc(d), `${p.id}/${f.id}`).not.toBe(lc(f.answer));
        }
      }
    }
  });

  it("every fact answer is on the Posts tab (never only in Replies or Media)", () => {
    for (const p of profiles) {
      const posts = postsTabText(p);
      const feedImages = p.feed.flatMap((c) => ("image" in c ? [c.image] : []));
      for (const f of p.facts) {
        const at = `${p.id}/${f.id}`;
        if (f.kind === "not") f.present.forEach((x) => expect(containsPhrase(posts, x), `${at}: ${x}`).toBe(true));
        else if (f.kind === "calc") f.parts.forEach((c) => expect(p.feed.some((x) => "id" in x && x.id === c.post), `${at}: ${c.post}`).toBe(true));
        else if (f.kind === "photo") expect(feedImages, at).toContain(f.image);
        else expect(containsPhrase(posts, f.answer), `${at}: ${f.answer}`).toBe(true);
      }
    }
  });

  it("NOT questions: present items are on the profile", () => {
    for (const p of profiles) {
      for (const f of p.facts) {
        if (f.kind !== "not") continue;
        expect(f.present.length).toBeGreaterThanOrEqual(3);
        for (const x of f.present) expect(containsPhrase(profileText(p), x), `${p.id}/${f.id}: ${x}`).toBe(true);
      }
    }
  });

  it("inference answers match their clues", () => {
    let n = 0;
    for (const p of profiles) {
      for (const f of p.facts) {
        if (f.kind !== "calc") continue;
        n++;
        expect(formatCalc(calcValue(f), f.unit), `${p.id}/${f.id}`).toBe(f.answer);
        for (const c of f.parts) expect(containsPhrase(postText(p, c.post) ?? "", c.says), `${p.id}/${f.id} ${c.post}`).toBe(true);
      }
    }
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it("feed images are in the manifest and used by ≤ 2 profiles", () => {
    const use = new Map<string, Set<string>>();
    for (const p of profiles) {
      for (const f of profileImages(p)) {
        expect(images[f], `${p.id}: ${f} in manifest`).toBeDefined();
        use.set(f, (use.get(f) ?? new Set()).add(p.id));
      }
    }
    for (const [f, who] of use) expect(who.size, `${f} used by ${[...who]}`).toBeLessThanOrEqual(2);
  });
});

describe("shuffle bags", () => {
  it("never repeats back-to-back and covers every profile of a difficulty once per cycle (2,000 seeds)", () => {
    const ids = profiles.map((p) => p.id);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = mulberry32(seed);
      let state: BagState | null = null;
      const seq: string[] = [];
      for (let i = 0; i < ids.length * 3; i++) {
        const r = drawFromBag(state ? JSON.parse(JSON.stringify(state)) : null, ids, rng);
        state = r.state;
        seq.push(r.id);
      }
      for (let i = 1; i < seq.length; i++) expect(seq[i], `seed ${seed} pos ${i}`).not.toBe(seq[i - 1]);
      for (let c = 0; c < 3; c++) expect(new Set(seq.slice(c * ids.length, (c + 1) * ids.length)).size).toBe(ids.length);
    }
  });

  it("per-difficulty bags: each game gets one of each, and a cycle shows every profile", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed);
      let bags: Bags | null = null;
      const seen: Record<string, string[]> = { easy: [], medium: [], hard: [] };
      for (let g = 0; g < 5; g++) {
        const r = drawProfiles(bags ? JSON.parse(JSON.stringify(bags)) : null, profiles, rng);
        bags = r.bags;
        r.chosen.forEach((p, i) => {
          expect(p.difficulty).toBe(DIFFICULTIES[i]);
          seen[p.difficulty].push(p.id);
        });
      }
      for (const d of DIFFICULTIES) {
        const n = profiles.filter((p) => p.difficulty === d).length;
        const s = seen[d];
        for (let i = 1; i < s.length; i++) expect(s[i]).not.toBe(s[i - 1]);
        expect(new Set(s.slice(0, Math.min(n, 4))).size).toBe(Math.min(n, 4));
      }
    }
  });

  it("?profile=id forces that profile's round", () => {
    const r = drawProfiles(null, profiles, mulberry32(1), "mira");
    expect(r.chosen[2].id).toBe("mira");
  });

  it("survives a corrupt or stale saved bag", () => {
    const ids = profiles.map((p) => p.id);
    const r = drawFromBag({ bag: ["ghost", ids[0], ids[0]], last: ids[0] }, ids, mulberry32(7));
    expect(ids).toContain(r.id);
    expect(r.id).not.toBe(ids[0]);
  });
});

describe("params + ranks", () => {
  it("parses debug params", () => {
    expect(parseParams("?seed=123&time=15&kiosk=1")).toMatchObject({ seed: 123, lookSeconds: 15, kiosk: true });
    expect(parseParams("")).toMatchObject({ seed: null, lookSeconds: 10, kiosk: false, query: "" });
    expect(parseParams("?time=999&seed=abc").lookSeconds).toBe(10);
  });
  it("maps scores out of 15 to ranks", () => {
    expect([0, 4, 5, 8, 9, 11, 12, 14, 15].map((s) => rankFor(s).name)).toEqual([
      "Daydreamer", "Daydreamer", "Blinker", "Blinker", "Sharp-eyed", "Sharp-eyed", "Sleuth", "Sleuth", "Memory Machine",
    ]);
  });
});
