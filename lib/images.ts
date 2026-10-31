import manifest from "../public/feed/manifest.json";
import type { Card, Profile, Species } from "@/content/types";

export type ManifestEntry = { file: string; kind: string; aspect: string; desc: string; shows: string[] };

/** public/feed/manifest.json is the source of truth for the feed images. */
export const images: Record<string, ManifestEntry> = Object.fromEntries(
  (manifest as ManifestEntry[]).map((m) => [m.file, m]),
);

export const feedSrc = (file: string) => `/feed/${file}`;

export const SPECIES: Species[] = ["cat", "dog", "parrot", "hamster", "rabbit", "duck"];

/** Species shown by a pet-* image (from its `shows` tags), or null. */
export function speciesOf(file: string): Species | null {
  const tags = images[file]?.shows ?? [];
  return SPECIES.find((s) => tags.includes(s)) ?? null;
}

export function cardImage(c: Card): string | null {
  return c.kind === "text" ? null : c.image;
}

/** Every feed image on a profile (banner + cards), in display order, with duplicates. */
export function profileImages(p: Profile): string[] {
  return [...(p.banner ? [p.banner] : []), ...p.feed.map(cardImage).filter((x): x is string => !!x)];
}

/**
 * Lower-cased words a player could "see" in the profile's pictures: the manifest `shows` tags
 * (multi-word tags are split too). Art cards also count as "painting"/"drawing", so a hobby
 * question never offers Painting to someone whose feed is full of their own art.
 */
export function imageWords(p: Profile): Set<string> {
  const out = new Set<string>();
  const add = (w: string) => {
    const s = w.toLowerCase().trim();
    if (!s) return;
    out.add(s);
    for (const part of s.split(/[^\p{L}\p{N}]+/u)) if (part) out.add(part);
  };
  for (const f of profileImages(p)) (images[f]?.shows ?? []).forEach(add);
  if (p.feed.some((c) => c.kind === "art")) ["painting", "drawing"].forEach(add);
  return out;
}
