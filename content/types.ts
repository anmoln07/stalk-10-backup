export type Category =
  | "pet"
  | "city"
  | "food"
  | "drink"
  | "hobby"
  | "trip"
  | "colour"
  | "team"
  | "gadget"
  | "music"
  | "animal";

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/**
 * A friend's reply shown under a post (X "thread" style). `by` is a handle from content/friends.ts.
 * Replies are mostly where decoys live ("my dog Cookie" under Mira's post about her cat Biscuit).
 * Their timestamp is worked out from the post's, so it always reads as later than the post.
 */
export type Reply = { by: string; text: string; likes?: number };

/** Shared by the target's own posts. `id` is only needed when a calc fact points at the post. */
type Own = { id?: string; time: string; likes?: number; thread?: Reply[] };

export type Card =
  | (Own & { kind: "text"; text: string })
  | (Own & { kind: "photo"; caption: string; image: string })
  | (Own & { kind: "art"; image: string; caption: string }) // caption from content/noise.ts
  | { kind: "meme"; time: string; image: string; caption: string } // a repost from a meme account; caption from noise.ts
  | { kind: "news"; time: string; image: string; headline: string; source: string }; // a repost from an outlet

export type CardKind = Card["kind"];

/** Where a recall answer is written: bio (or 📍 row), a text post, a photo caption, or a friend's reply. */
export type Where = "bio" | "text" | "photo" | "reply";

type FactBase = { id: string; question: string };

/**
 * Plain recall: the answer is written on the profile.
 * - `decoys`: things that ARE on the profile but in a different role (a friend's dog when asking about
 *   her cat). They must appear on the profile and are never the true answer. Offered as wrong options.
 * - `lookalikes`: near-miss wrong answers (Biscuit -> Biscotti). Added to the global list in
 *   content/lookalikes.ts. Must not be on the profile.
 */
export type RecallFact = FactBase & {
  kind?: "recall";
  category: Category;
  answer: string;
  where: Where;
  decoys?: string[];
  lookalikes?: string[];
};

/** Photo question: the answer is something a feed picture clearly shows (its manifest `shows` tags). */
export type PhotoFact = FactBase & {
  kind: "photo";
  category: Category;
  image: string; // a feed image on this profile
  answer: string; // every word of it is in that image's `shows` tags (plurals folded)
  decoys?: string[];
  lookalikes?: string[];
};

/**
 * "Which of these was NOT on the profile?" Three of `present` (all written on the profile) are shown
 * with one thing that isn't; picking the missing one is right. The missing one comes from the
 * `categories` pools (and, on Hard, from look-alikes of the present ones: Pune -> Puri).
 */
export type NotFact = FactBase & { kind: "not"; categories: Category[]; present: string[] };

/** One number read from one post. `says` is copied from the post (or one of its replies) and contains `n`. */
export type Clue = { post: string; says: string; n: number };

/**
 * Two-post inference: `sum` adds the clue numbers, `diff` is first minus second.
 * `unit` is appended ("days", "km"); `answer` must equal the computed value + unit.
 */
export type CalcFact = FactBase & { kind: "calc"; op: "sum" | "diff"; parts: Clue[]; unit: string; answer: string };

export type Fact = RecallFact | PhotoFact | NotFact | CalcFact;
export type FactKind = "recall" | "photo" | "not" | "calc";
export const factKind = (f: Fact): FactKind => f.kind ?? "recall";

export type Species = "cat" | "dog" | "parrot" | "hamster" | "rabbit" | "duck";

/** One of the target's own replies to a friend (shown on the Replies tab). May hold decoys, never facts. */
export type ProfileReply = { to: string; time: string; text: string; likes?: number };

export type Profile = {
  id: string;
  difficulty: Difficulty;
  name: string; // obviously invented
  handle: string;
  avatar: string; // file in public/pfp
  verified?: boolean; // blue tick
  banner?: string; // a place-type image in public/feed (3:1 centre crop), else a gradient
  species?: Species; // their own pet; pet photos must match it unless the post names the animal
  bio: string;
  location: string; // Indian city
  joined: string; // "Joined March 2023"
  followers?: number; // decoration; derived from the id when missing
  following?: number;
  feed: Card[]; // authoring order; shuffled every play (the Posts tab)
  replies?: ProfileReply[]; // the Replies tab: their replies to friends (light; decoys OK, never facts)
  facts: Fact[];
};

/** Meme and news cards are reposts of other accounts. */
export const isRepost = (c: Card): c is Extract<Card, { kind: "meme" | "news" }> => c.kind === "meme" || c.kind === "news";
/** Noise = memes, news and art (their text comes from content/noise.ts and never carries facts). */
export const isNoise = (c: Card) => isRepost(c) || c.kind === "art";
