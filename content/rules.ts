import type { Difficulty } from "./types";

/**
 * Per-difficulty shape of a profile (checked by `npm run lint:content`) and how its questions are built.
 * Harder = more posts, more replies, more decoys, more look-alikes and trickier question types.
 */
export type Rule = {
  label: string;
  blurb: string; // shown on the round screen
  posts: [number, number]; // min/max cards in the feed
  minNoise: number; // meme/news/art cards
  minReplyPosts: number; // posts with at least one friend reply
  minDecoys: number; // decoys tagged across all facts
  facts: [number, number];
  minSpecial: number; // photo / NOT / calc facts on the profile, and asked per round (when available)
  maxWords: number; // everything readable on the profile
  // option mix per question (wrong answers): up to this many decoys / look-alikes, the rest from pools
  decoys: number;
  lookalikes: number;
};

export const RULES: Record<Difficulty, Rule> = {
  easy: {
    label: "Easy",
    blurb: "Warm-up. Short feed.",
    posts: [6, 8], minNoise: 3, minReplyPosts: 1, minDecoys: 1, facts: [6, 7], minSpecial: 0, maxWords: 150,
    decoys: 1, lookalikes: 0,
  },
  medium: {
    label: "Medium",
    blurb: "More posts. Friends reply. Watch for decoys.",
    posts: [8, 10], minNoise: 3, minReplyPosts: 2, minDecoys: 3, facts: [7, 8], minSpecial: 1, maxWords: 210,
    decoys: 1, lookalikes: 1,
  },
  hard: {
    label: "Hard",
    blurb: "Long feed, look-alike answers, sums and photos.",
    posts: [10, 13], minNoise: 4, minReplyPosts: 3, minDecoys: 5, facts: [8, 9], minSpecial: 2, maxWords: 280,
    decoys: 2, lookalikes: 1,
  },
};

export const ROUNDS = 3;
export const QUESTIONS_PER_ROUND = 5;
export const TOTAL_QUESTIONS = ROUNDS * QUESTIONS_PER_ROUND;
export const MAX_POST_WORDS = 20;
export const MAX_REPLY_WORDS = 14;
