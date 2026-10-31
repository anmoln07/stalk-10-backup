/* Content lint: `npm run lint:content`. Exits 1 with a list of problems if anything is off. */
import fs from "node:fs";
import path from "node:path";
import { profiles } from "../content/profiles";
import { distractors } from "../content/distractors";
import { memeCaptions, newsHeadlines, artCaptions } from "../content/noise";
import { ranks } from "../content/ranks";
import { lessons } from "../content/lessons";
import { isNoise, type Category } from "../content/types";
import { areaText, cardText, containsPhrase, factText, profileText, sigWords, wordCount } from "../lib/text";
import { images, imageWords, profileImages, speciesOf } from "../lib/images";
import { safeCandidates } from "../lib/buildRun";

const MAX_WORDS = 110; // everything readable on the profile screen
const MAX_FACT_WORDS = 60; // bio + 📍 row + text posts + photo captions
const MAX_CARD_WORDS = 12;
const MAX_NOISE_WORDS = 8; // each caption / headline in content/noise.ts
const MIN_POOL = 8;
const MIN_SAFE = 5; // safe wrong answers left per fact after filtering (we need 3, want variety)
const MAX_IMAGE_PROFILES = 2;
const MIN_PROFILES = 12;
const ROOT = path.join(__dirname, "..");
const PFP = path.join(ROOT, "public", "pfp");
const FEED = path.join(ROOT, "public", "feed");
const CATEGORIES: Category[] = ["pet", "city", "food", "drink", "hobby", "trip", "colour", "team", "gadget", "music"];
const TIME = /^\d{1,2}[mhd]$/;

// Things that must never appear: contact details, addresses, schools/workplaces, birth dates, secrets.
const BANNED: [RegExp, string][] = [
  [/\d[\d\s-]{6,}\d/, "long number (phone/ID?)"],
  [/[\w.]+@[\w-]+\.\w+/, "email address"],
  [/https?:|www\.|\.com\b|\.in\b/i, "link"],
  [/\b(school|college|university|campus|hostel|class of|office|company|employer|works at|work at|my boss)\b/i, "school/workplace"],
  [/\b(born|birthday|bday|birth)\b/i, "birth date"],
  [/\b(password|passcode|pin code|pincode|otp|security question|mother'?s maiden)\b/i, "security info"],
  [/\b(street address|road no|lane no|flat no|house no|apartment|sector \d|block [a-z0-9])\b/i, "address"],
  [/\b(aadhaar|pan card|passport|licence|license)\b/i, "ID document"],
  [/\b(election|minister|party|temple|church|mosque|god|prime|president)\b/i, "politics/religion"],
];

const problems: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);

// ---------- pools ----------
for (const c of CATEGORIES) {
  const pool = distractors[c] ?? [];
  if (pool.length < MIN_POOL) fail(`pool ${c}`, `only ${pool.length} entries (need ≥ ${MIN_POOL})`);
  const lower = pool.map((x) => x.trim().toLowerCase());
  lower.forEach((x, i) => lower.indexOf(x) !== i && fail(`pool ${c}`, `duplicate "${pool[i]}"`));
}

// ---------- images + noise library ----------
const kindOf = (f: string) => images[f]?.kind;
for (const f of Object.keys(images)) if (!fs.existsSync(path.join(FEED, f))) fail("manifest", `file missing: public/feed/${f}`);
const noiseLib: [string, Record<string, string[]>][] = [
  ["meme", memeCaptions],
  ["art", artCaptions],
  ["news", Object.fromEntries(Object.entries(newsHeadlines).map(([k, v]) => [k, v.map((h) => h.headline)]))],
];
for (const [kind, lib] of noiseLib) {
  for (const f of Object.keys(images).filter((x) => kindOf(x) === kind)) {
    const n = lib[f]?.length ?? 0;
    const [lo, hi] = kind === "meme" ? [2, 3] : [1, 2];
    if (n < lo || n > hi) fail(`noise ${f}`, `${n} ${kind} texts (want ${lo}–${hi})`);
  }
  for (const [f, list] of Object.entries(lib)) {
    if (kindOf(f) !== kind) fail(`noise ${f}`, `not a ${kind} image in the manifest`);
    for (const t of list) {
      const w = wordCount(t.replace(/\|/g, " "));
      if (w > MAX_NOISE_WORDS) fail(`noise ${f}`, `"${t}" is ${w} words (max ${MAX_NOISE_WORDS})`);
      for (const [re, label] of BANNED) if (re.test(t)) fail(`noise ${f}`, `banned content (${label}): ${t}`);
    }
  }
}
for (const list of Object.values(newsHeadlines)) for (const h of list) if (wordCount(h.source) > 3) fail("noise", `outlet "${h.source}" too long`);

// ---------- profiles ----------
const ids = new Set<string>();
const handles = new Set<string>();
const imageUse = new Map<string, Set<string>>();
let maxWords = 0;
let maxFactWords = 0;
for (const p of profiles) {
  const at = `profile ${p.id}`;
  if (ids.has(p.id)) fail(at, "duplicate id");
  ids.add(p.id);
  if (handles.has(p.handle)) fail(at, "duplicate handle");
  handles.add(p.handle);

  // images
  if (!fs.existsSync(path.join(PFP, p.avatar))) fail(at, `avatar missing: public/pfp/${p.avatar}`);
  if (p.banner && kindOf(p.banner) !== "place") fail(at, `banner ${p.banner} must be a place-* image`);
  const imgs = profileImages(p);
  for (const f of imgs) {
    if (!images[f]) fail(at, `image not in manifest: ${f}`);
    else if (!fs.existsSync(path.join(FEED, f))) fail(at, `image missing: public/feed/${f}`);
    if (!imageUse.has(f)) imageUse.set(f, new Set());
    imageUse.get(f)!.add(p.id);
  }
  imgs.forEach((f, i) => imgs.indexOf(f) !== i && fail(at, `image ${f} used twice on one profile`));
  for (const f of imgs) {
    if (kindOf(f) !== "pet") continue;
    const s = speciesOf(f);
    if (!p.species || s !== p.species) fail(at, `${f} shows a ${s} but species is ${p.species ?? "unset"}`);
  }
  if (p.species && !p.facts.some((f) => f.category === "pet")) fail(at, "has species but no pet fact");

  // feed shape
  const noise = p.feed.filter(isNoise);
  if (p.feed.length < 6 || p.feed.length > 8) fail(at, `${p.feed.length} cards (need 6–8)`);
  if (noise.length < 3 || noise.length > 4) fail(at, `${noise.length} noise cards (need 3–4)`);
  if (!noise.some((c) => c.kind === "meme")) fail(at, "needs a meme card");
  if (!noise.some((c) => c.kind === "news" || c.kind === "art")) fail(at, "needs a news or art card");
  p.feed.forEach((c, i) => {
    const cat = `${at} card ${i + 1} (${c.kind})`;
    if (!TIME.test(c.time)) fail(cat, `time "${c.time}" should look like 2h / 1d`);
    const words = wordCount(cardText(c));
    if (words > MAX_CARD_WORDS) fail(cat, `${words} words (max ${MAX_CARD_WORDS})`);
    if (c.kind !== "text" && kindOf(c.image) === undefined) return;
    if (c.kind === "photo" && !["object", "food", "place", "pet"].includes(kindOf(c.image)!)) fail(cat, `${c.image} is not a photo image`);
    if (c.kind === "meme" && !(memeCaptions[c.image] ?? []).includes(c.caption)) fail(cat, `caption not in content/noise.ts for ${c.image}`);
    if (c.kind === "art" && !(artCaptions[c.image] ?? []).includes(c.caption)) fail(cat, `caption not in content/noise.ts for ${c.image}`);
    if (c.kind === "news" && !(newsHeadlines[c.image] ?? []).some((h) => h.headline === c.headline && h.source === c.source)) {
      fail(cat, `headline/source not in content/noise.ts for ${c.image}`);
    }
    for (const k of ["meme", "news", "art"] as const) if (c.kind === k && kindOf(c.image) !== k) fail(cat, `${c.image} is not a ${k} image`);
    // every text/photo card carries at least one fact (they're the cards that are never hidden)
    if (!isNoise(c) && !p.facts.some((f) => containsPhrase(cardText(c), f.answer))) fail(cat, "text/photo card carries no fact");
  });

  // budgets + banned content
  const text = profileText(p);
  const words = wordCount(text);
  const fWords = wordCount(factText(p));
  maxWords = Math.max(maxWords, words);
  maxFactWords = Math.max(maxFactWords, fWords);
  if (words > MAX_WORDS) fail(at, `${words} visible words (max ${MAX_WORDS})`);
  if (fWords > MAX_FACT_WORDS) fail(at, `${fWords} fact-bearing words (max ${MAX_FACT_WORDS})`);
  if (p.bio.length > 70) fail(at, `bio is ${p.bio.length} chars (keep ≤ 70 so it fits 2 short lines)`);
  if (!/^Joined [A-Z][a-z]+ \d{4}$/.test(p.joined)) fail(at, `joined should look like "Joined March 2023"`);
  for (const [re, label] of BANNED) if (re.test(text)) fail(at, `banned content (${label}): ${text.match(re)?.[0]}`);

  // facts
  if (p.facts.length !== 6) fail(at, `${p.facts.length} facts (need exactly 6)`);
  const where = { bio: 0, text: 0, photo: 0 };
  const factIds = new Set<string>();
  const answers = p.facts.map((f) => f.answer.toLowerCase());
  const shown = imageWords(p);
  for (const f of p.facts) {
    const fat = `${at}/${f.id}`;
    if (factIds.has(f.id)) fail(fat, "duplicate fact id");
    factIds.add(f.id);
    where[f.where]++;
    if (!CATEGORIES.includes(f.category)) fail(fat, `unknown category ${f.category}`);
    if (!containsPhrase(text, f.answer)) fail(fat, `answer "${f.answer}" not in profile text`);
    else if (!containsPhrase(areaText(p, f.where), f.answer)) fail(fat, `answer "${f.answer}" not in its "${f.where}" area`);
    // a fact must never live only in a noise card or a picture
    if (!containsPhrase(factText(p), f.answer)) fail(fat, `answer "${f.answer}" only appears in noise cards`);
    if (containsPhrase(f.question, f.answer)) fail(fat, "question gives away the answer");
    if (!f.question.endsWith("?")) fail(fat, "question should end with ?");
    if (answers.filter((a) => a === f.answer.toLowerCase()).length > 1) fail(fat, "two facts share an answer");

    const safe = safeCandidates(p, f.answer, distractors[f.category] ?? []);
    if (safe.length < MIN_SAFE) fail(fat, `only ${safe.length} safe distractors (need ≥ ${MIN_SAFE})`);
    // Belt and braces: nothing we could offer is the answer, on the profile, or shown in a picture.
    for (const d of safe) {
      if (d.toLowerCase() === f.answer.toLowerCase()) fail(fat, `distractor equals answer: ${d}`);
      if (containsPhrase(text, d)) fail(fat, `distractor "${d}" appears on the profile`);
      if (shown.has(d.toLowerCase()) || sigWords(d).some((w) => shown.has(w))) fail(fat, `distractor "${d}" is shown in a picture`);
    }
  }
  if (where.bio !== 2 || where.text + where.photo !== 4 || where.text < 1 || where.photo < 1) {
    fail(at, `fact spread is bio ${where.bio} / text ${where.text} / photo ${where.photo} (want 2 in bio, 4 in text+photo, ≥1 of each)`);
  }
}

for (const [f, who] of imageUse) {
  if (who.size > MAX_IMAGE_PROFILES) fail(`image ${f}`, `used by ${who.size} profiles (${[...who].join(", ")}; max ${MAX_IMAGE_PROFILES})`);
}
if (profiles.length < MIN_PROFILES) fail("profiles", `only ${profiles.length} (need ≥ ${MIN_PROFILES})`);
if (!ranks.some((r) => r.min === 0)) fail("ranks", "need a rank with min 0");
if (lessons.length < 1) fail("lessons", "need at least one lesson");

if (problems.length) {
  console.error(`✗ content lint: ${problems.length} problem(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(
  `✓ content lint: ${profiles.length} profiles, ${CATEGORIES.length} pools, ${imageUse.size}/${Object.keys(images).length} feed images used, ` +
    `max ${maxWords} visible words (≤ ${MAX_WORDS}), max ${maxFactWords} fact words (≤ ${MAX_FACT_WORDS})`,
);
