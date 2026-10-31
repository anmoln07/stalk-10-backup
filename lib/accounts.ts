import { friends, memeAccounts, outletAvatars, type Account } from "@/content/friends";
import type { Card } from "@/content/types";

export type Who = Account & { handle: string };

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function friend(handle: string): Who {
  const a = friends[handle];
  return a ? { ...a, handle } : { name: handle, avatar: "st-default.svg", handle };
}

/** The meme page a meme image is reposted from (stable per image). */
export function memeAccountFor(image: string): Who {
  const handles = Object.keys(memeAccounts);
  const handle = handles[hash(image) % handles.length];
  return { ...memeAccounts[handle], handle };
}

/** News outlet account for a made-up outlet name ("Metro Wire" -> @metrowire, gold tick). */
export function outletFor(source: string): Who {
  return {
    name: source,
    handle: source.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    avatar: outletAvatars[hash(source) % outletAvatars.length],
    verified: "gold",
  };
}

/** Who a card is "by" when it is a repost. */
export function repostedFrom(c: Card): Who | null {
  if (c.kind === "meme") return memeAccountFor(c.image);
  if (c.kind === "news") return outletFor(c.source);
  return null;
}

export const pfpSrc = (file: string) => `/pfp/${file}`;

/** Stable pseudo-random number in [lo, hi] from a string (decorative counts). */
export function seeded(s: string, lo: number, hi: number): number {
  return lo + (hash(s) % (hi - lo + 1));
}
