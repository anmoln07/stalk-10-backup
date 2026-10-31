import type { Card, Profile } from "@/content/types";
import { isNoise } from "@/content/types";

/** The readable text of one feed card (what the lint counts against the 12-word limit). */
export function cardText(c: Card): string {
  switch (c.kind) {
    case "text":
      return c.text;
    case "photo":
      return c.caption;
    case "meme":
      return c.caption.replace(/\s*\|\s*/g, " ");
    case "news":
      return `${c.source}\n${c.headline}`;
    case "art":
      return c.caption;
  }
}

/** Header text: name, handle, bio, 📍 row and joined line. */
export function headerText(p: Profile): string {
  return [p.name, "@" + p.handle, p.bio, p.location, p.joined].join("\n");
}

/**
 * Every piece of text the player can read on the profile (header + all cards).
 * Timestamps and like/reply counts are decoration and are not included.
 */
export function profileText(p: Profile): string {
  return [headerText(p), ...p.feed.map(cardText)].join("\n");
}

/** Text of the area a fact claims to live in. "bio" also covers the 📍 row; "photo" = captions. */
export function areaText(p: Profile, where: "bio" | "text" | "photo"): string {
  if (where === "bio") return [p.bio, p.location].join("\n");
  return p.feed
    .filter((c) => c.kind === where)
    .map(cardText)
    .join("\n");
}

/** Text that carries facts: bio + 📍 row + text posts + photo captions. */
export function factText(p: Profile): string {
  return [p.bio, p.location, ...p.feed.filter((c) => !isNoise(c)).map(cardText)].join("\n");
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive whole-phrase match ("Goa" matches "goa!" but not "goal"). */
export function containsPhrase(haystack: string, phrase: string): boolean {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(phrase.trim())}(?=$|[^\\p{L}\\p{N}])`, "iu");
  return re.test(haystack);
}

const STOP = new Set(["the", "and", "for", "with", "his", "her", "its", "one", "new", "old"]);

/** Lower-cased "meaningful" words (3+ letters, not a stop word). */
export function sigWords(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length >= 3 && !STOP.has(w));
}

const stem = (w: string) => w.toLowerCase().replace(/s$/, "");

/**
 * A pool entry may be offered as a wrong answer only if it can't be read as true:
 * it isn't the answer, neither contains the other, it isn't mentioned anywhere on the
 * profile, none of its meaningful words appear on the profile (so "Cold coffee" is never
 * offered to someone whose bio says "Coffee first"), and none of them is something the
 * profile's pictures show (`imageWords`, from the manifest `shows` tags; plurals folded).
 */
export function isSafeDistractor(candidate: string, answer: string, text: string, imageWords: Set<string> = new Set()): boolean {
  const c = candidate.trim().toLowerCase();
  const a = answer.trim().toLowerCase();
  if (!c || c === a) return false;
  if (containsPhrase(c, a) || containsPhrase(a, c)) return false;
  if (containsPhrase(text, c)) return false;
  if (imageWords.has(c)) return false;
  const shown = new Set([...imageWords].map(stem));
  return !sigWords(c).some((w) => containsPhrase(text, w) || shown.has(stem(w)));
}

/** Visible word count used by the content lint (emoji-only tokens don't count). */
export function wordCount(s: string): number {
  return (s.match(/\S+/g) ?? []).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}
