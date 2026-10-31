import { describe, expect, it } from "vitest";
import { profiles } from "@/content/profiles";
import { distractors } from "@/content/distractors";
import { buildRun, OPTIONS_PER_QUESTION, QUESTIONS_PER_RUN } from "@/lib/buildRun";
import { drawFromBag, type BagState } from "@/lib/bag";
import { mulberry32 } from "@/lib/rng";
import { containsPhrase, profileText } from "@/lib/text";
import { parseParams } from "@/lib/params";
import { rankFor } from "@/content/ranks";

const SEEDS = 2000;
const ids = profiles.map((p) => p.id);

describe("buildRun (2,000 seeds)", () => {
  it("every question is well-formed and answerable from the profile", () => {
    let bag: BagState | null = null;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = mulberry32(seed);
      const drawn = drawFromBag(bag, ids, rng);
      bag = drawn.state;
      const profile = profiles.find((p) => p.id === drawn.id)!;
      const run = buildRun(profile, rng, distractors);
      const text = profileText(profile);

      expect(run.questions).toHaveLength(QUESTIONS_PER_RUN);
      expect(new Set(run.questions.map((q) => q.factId)).size).toBe(QUESTIONS_PER_RUN);
      for (const q of run.questions) {
        const ctx = `seed ${seed} ${profile.id}/${q.factId}`;
        expect(q.options, ctx).toHaveLength(OPTIONS_PER_QUESTION);
        expect(new Set(q.options.map((o) => o.toLowerCase())).size, ctx).toBe(OPTIONS_PER_QUESTION);
        expect(q.options.filter((o) => o.toLowerCase() === q.answer.toLowerCase()), ctx).toHaveLength(1);
        expect(q.options[q.correctIndex], ctx).toBe(q.answer);
        expect(containsPhrase(text, q.answer), `${ctx}: answer on profile`).toBe(true);
        for (const o of q.options) {
          if (o === q.answer) continue;
          expect(containsPhrase(text, o), `${ctx}: distractor "${o}" must not be on profile`).toBe(false);
        }
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = buildRun(profiles[0], mulberry32(42), distractors);
    const b = buildRun(profiles[0], mulberry32(42), distractors);
    expect(a).toEqual(b);
  });

  it("varies which 5 of 6 facts are asked and the option order", () => {
    const asked = new Set<string>();
    const firstOptions = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const run = buildRun(profiles[0], mulberry32(seed), distractors);
      asked.add(run.questions.map((q) => q.factId).sort().join(","));
      firstOptions.add(run.questions[0].options.join("|"));
    }
    expect(asked.size).toBe(6);
    expect(firstOptions.size).toBeGreaterThan(20);
  });
});

describe("shuffle bag", () => {
  it("never repeats back-to-back and covers every profile once per cycle (2,000 seeds)", () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rng = mulberry32(seed);
      let state: BagState | null = null;
      const seq: string[] = [];
      for (let i = 0; i < ids.length * 3; i++) {
        // Round-trip through JSON like localStorage does between page reloads.
        const r = drawFromBag(state ? JSON.parse(JSON.stringify(state)) : null, ids, rng);
        state = r.state;
        seq.push(r.id);
      }
      for (let i = 1; i < seq.length; i++) expect(seq[i], `seed ${seed} pos ${i}`).not.toBe(seq[i - 1]);
      for (let c = 0; c < 3; c++) {
        expect(new Set(seq.slice(c * ids.length, (c + 1) * ids.length)).size).toBe(ids.length);
      }
    }
  });

  it("survives a corrupt or stale saved bag", () => {
    const rng = mulberry32(7);
    const r = drawFromBag({ bag: ["ghost", ids[0], ids[0]], last: ids[0] }, ids, rng);
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
  it("maps scores to the decided ranks", () => {
    expect([0, 1, 2, 3, 4, 5].map((s) => rankFor(s).name)).toEqual([
      "Daydreamer", "Daydreamer", "Blinker", "Sharp-eyed", "Sleuth", "Memory Machine",
    ]);
  });
});
