import type { Card, Profile, Where } from "@/content/types";
import { isNoise } from "@/content/types";
import { friend, repostedFrom } from "./accounts";

/** The readable text of one feed card, without its replies (what the lint counts per post). */
export function cardText(c: Card): string {
  switch (c.kind) {
    case "text":
      return c.text;
    case "photo":
      return c.caption;
    case "meme":
      return c.caption.replace(/\s*\|\s*/g, " ");
    case "news":
      return c.headline;
    case "art":
      return c.caption;
  }
}

/** Replies under a card ([] for reposts). */
export const threadOf = (c: Card) => (c.kind === "text" || c.kind === "photo" || c.kind === "art" ? c.thread ?? [] : []);

/** Reply texts only. */
export const replyText = (c: Card) => threadOf(c).map((r) => r.text).join("\n");

/** Everything readable in one card: account names of reposts, the card text, and the replies with names. */
export function cardFullText(c: Card): string {
  const from = repostedFrom(c);
  const parts = from ? [from.name, "@" + from.handle] : [];
  parts.push(cardText(c));
  for (const r of threadOf(c)) {
    const f = friend(r.by);
    parts.push(f.name, "@" + f.handle, r.text);
  }
  return parts.join("\n");
}

/** Header text: name, handle, bio, 📍 row and joined line. */
export function headerText(p: Profile): string {
  return [p.name, "@" + p.handle, p.bio, p.location, p.joined].join("\n");
}

/** What the Posts tab shows: header + all cards + friend replies under them + names. Every fact lives here. */
export function postsTabText(p: Profile): string {
  return [headerText(p), ...p.feed.map(cardFullText)].join("\n");
}

/** What the Replies tab shows: the target's replies to friends (with the friends' names). */
export function repliesTabText(p: Profile): string {
  return (p.replies ?? []).flatMap((r) => {
    const f = friend(r.to);
    return [f.name, "@" + f.handle, r.text];
  }).join("\n");
}

/**
 * Every piece of text the player can read on the profile (all tabs).
 * Timestamps and like/repost/view counts are decoration and are not included.
 */
export function profileText(p: Profile): string {
  return [postsTabText(p), repliesTabText(p)].join("\n");
}

/** Text of the area a fact claims to live in. "bio" also covers the 📍 row; "photo" = captions. */
export function areaText(p: Profile, where: Where): string {
  if (where === "bio") return [p.bio, p.location].join("\n");
  if (where === "reply") return p.feed.map(replyText).join("\n");
  return p.feed
    .filter((c) => c.kind === where)
    .map(cardText)
    .join("\n");
}

/** Text that can carry facts: bio + 📍 row + own text posts + photo captions + replies. */
export function factText(p: Profile): string {
  return [p.bio, p.location, ...p.feed.filter((c) => !isNoise(c)).map(cardText), ...p.feed.map(replyText)].join("\n");
}

/** Text of the post with this id, plus its replies (for calc clues). "bio" = bio + 📍 row. */
export function postText(p: Profile, id: string): string | null {
  if (id === "bio") return [p.bio, p.location].join("\n");
  const c = p.feed.find((x) => "id" in x && x.id === id);
  return c ? [cardText(c), replyText(c)].join("\n") : null;
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

export const stem = (w: string) => w.toLowerCase().replace(/s$/, "");

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

/**
 * Looser check for hand-picked look-alikes ("Iced mocha" for "Iced latte"): sharing a word with the
 * profile is fine, but the whole phrase must not be on it or shown in a picture, and it must not be
 * the answer or contain it.
 */
export function isSafeLookalike(candidate: string, answer: string, text: string, imageWords: Set<string> = new Set()): boolean {
  const c = candidate.trim().toLowerCase();
  const a = answer.trim().toLowerCase();
  if (!c || c === a) return false;
  if (containsPhrase(c, a) || containsPhrase(a, c)) return false;
  if (containsPhrase(text, c)) return false;
  if (imageWords.has(c) || imageWords.has(stem(c))) return false;
  // a word a picture shows is only OK if the answer has it too ("Mango shake" next to a mango lassi photo)
  const shown = new Set([...imageWords].map(stem));
  const own = new Set(sigWords(a).map(stem));
  return !sigWords(c).some((w) => shown.has(stem(w)) && !own.has(stem(w)));
}

/** Visible word count used by the content lint (emoji-only tokens don't count). */
export function wordCount(s: string): number {
  return (s.match(/\S+/g) ?? []).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** "2h" / "3d" / "45m" -> minutes. */
export function minutesOf(t: string): number {
  const m = /^(\d+)([mhd])$/.exec(t);
  if (!m) return 0;
  return Number(m[1]) * (m[2] === "m" ? 1 : m[2] === "h" ? 60 : 1440);
}

/** minutes -> "45m" / "2h" / "3d". */
export function formatAgo(mins: number): string {
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}
