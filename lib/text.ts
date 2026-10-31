import type { Profile } from "@/content/types";

/** Every piece of text the player can see on the profile card. */
export function profileText(p: Profile): string {
  return [p.name, "@" + p.handle, p.bio, p.location, p.joined, ...p.posts.flatMap((x) => [x.time, x.text])].join("\n");
}

/** Text of the area a fact claims to live in. "bio" also covers the location row. */
export function areaText(p: Profile, where: "bio" | "post" | "photo"): string {
  if (where === "bio") return [p.bio, p.location].join("\n");
  if (where === "photo") return p.posts.filter((x) => x.photo).map((x) => x.text).join("\n");
  return p.posts.filter((x) => !x.photo).map((x) => x.text).join("\n");
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

/**
 * A pool entry may be offered as a wrong answer only if it can't be read as true:
 * it isn't the answer, neither contains the other, it isn't mentioned anywhere on the
 * profile, and none of its meaningful words appear on the profile either
 * (so "Cold coffee" is never offered to someone whose bio says "Coffee first").
 */
export function isSafeDistractor(candidate: string, answer: string, text: string): boolean {
  const c = candidate.trim().toLowerCase();
  const a = answer.trim().toLowerCase();
  if (!c || c === a) return false;
  if (containsPhrase(c, a) || containsPhrase(a, c)) return false;
  if (containsPhrase(text, c)) return false;
  return !sigWords(c).some((w) => containsPhrase(text, w));
}

/** Visible word count used by the content lint (emoji-only tokens don't count). */
export function wordCount(s: string): number {
  return (s.match(/\S+/g) ?? []).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}
