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
  | "music";

export type Fact = {
  id: string;
  category: Category; // picks the distractor pool
  question: string; // e.g. "What is Mira's cat called?"
  answer: string; // must appear in the profile text (case-insensitive, whole words)
  where: "bio" | "text" | "photo"; // "bio" = bio or the 📍 row; "photo" = in a photo card's caption
};

export type Card =
  | { kind: "text"; time: string; text: string; likes?: number; replies?: number }
  | { kind: "photo"; time: string; caption: string; image: string; likes?: number; replies?: number }
  | { kind: "meme"; time: string; image: string; caption: string } // overlay text, from content/noise.ts
  | { kind: "news"; time: string; image: string; headline: string; source: string } // from content/noise.ts
  | { kind: "art"; time: string; image: string; caption: string }; // from content/noise.ts

export type CardKind = Card["kind"];

export type Species = "cat" | "dog" | "parrot" | "hamster" | "rabbit" | "duck";

export type Profile = {
  id: string;
  name: string; // obviously invented
  handle: string;
  avatar: string; // file in public/pfp
  banner?: string; // a place-* image in public/feed (3:1 centre crop), else a gradient
  species?: Species; // if there's a pet fact; pet-* photos must match it
  bio: string;
  location: string; // Indian city
  joined: string; // "Joined March 2023"
  feed: Card[]; // 6–8 cards, in display order
  facts: Fact[]; // exactly 6
};

/** text + photo cards carry facts and are never hidden; meme/news/art are noise. */
export const isNoise = (c: Card) => c.kind === "meme" || c.kind === "news" || c.kind === "art";
