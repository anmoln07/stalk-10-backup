import type { Category, Profile } from "@/content/types";
import { shuffle, type Rng } from "./rng";
import { isSafeDistractor, profileText } from "./text";

export const QUESTIONS_PER_RUN = 5;
export const OPTIONS_PER_QUESTION = 4;

export type Question = {
  factId: string;
  question: string;
  answer: string;
  options: string[]; // 4, shuffled
  correctIndex: number;
};

export type Run = { profile: Profile; questions: Question[] };

/** Pool entries that are safe wrong answers for this fact on this profile. */
export function safeCandidates(profile: Profile, answer: string, pool: readonly string[]): string[] {
  const text = profileText(profile);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of pool) {
    const k = c.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    if (isSafeDistractor(c, answer, text)) out.push(c.trim());
  }
  return out;
}

export function buildRun(profile: Profile, rng: Rng, pools: Record<Category, string[]>): Run {
  const facts = shuffle(profile.facts, rng).slice(0, QUESTIONS_PER_RUN);
  const questions = facts.map((f): Question => {
    const candidates = safeCandidates(profile, f.answer, pools[f.category] ?? []);
    if (candidates.length < OPTIONS_PER_QUESTION - 1) {
      throw new Error(`Not enough safe distractors for ${profile.id}/${f.id}`);
    }
    const wrong = shuffle(candidates, rng).slice(0, OPTIONS_PER_QUESTION - 1);
    const options = shuffle([f.answer, ...wrong], rng);
    return { factId: f.id, question: f.question, answer: f.answer, options, correctIndex: options.indexOf(f.answer) };
  });
  return { profile, questions };
}
