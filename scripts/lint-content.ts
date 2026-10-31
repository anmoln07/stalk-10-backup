/* Content lint: `npm run lint:content`. Exits 1 with a list of problems if anything is off. */
import fs from "node:fs";
import path from "node:path";
import { profiles } from "../content/profiles";
import { distractors } from "../content/distractors";
import { ranks } from "../content/ranks";
import { lessons } from "../content/lessons";
import type { Category } from "../content/types";
import { areaText, containsPhrase, profileText, wordCount } from "../lib/text";
import { safeCandidates } from "../lib/buildRun";

const MAX_WORDS = 80;
const MIN_POOL = 8;
const MIN_SAFE = 5; // safe wrong answers left per fact after filtering (we need 3, want variety)
const PFP = path.join(__dirname, "..", "public", "pfp");
const CATEGORIES: Category[] = ["pet", "city", "food", "drink", "hobby", "trip", "colour", "team", "gadget", "music"];

// Things that must never appear: contact details, addresses, schools/workplaces, birth dates, secrets.
const BANNED: [RegExp, string][] = [
  [/\d[\d\s-]{6,}\d/, "long number (phone/ID?)"],
  [/[\w.]+@[\w-]+\.\w+/, "email address"],
  [/https?:|www\.|\.com\b|\.in\b/i, "link"],
  [/\b(school|college|university|campus|hostel|class of|office|company|employer|works at|work at|my boss)\b/i, "school/workplace"],
  [/\b(born|birthday|bday|birth)\b/i, "birth date"],
  [/\b(password|passcode|pin code|pincode|otp|security question|mother'?s maiden)\b/i, "security info"],
  [/\b(street|road|lane|flat no|house no|apartment|sector \d|block [a-z0-9])\b/i, "address"],
  [/\b(aadhaar|pan card|passport|licence|license)\b/i, "ID document"],
];

const problems: string[] = [];
const fail = (where: string, msg: string) => problems.push(`${where}: ${msg}`);

// Pools
for (const c of CATEGORIES) {
  const pool = distractors[c] ?? [];
  if (pool.length < MIN_POOL) fail(`pool ${c}`, `only ${pool.length} entries (need ≥ ${MIN_POOL})`);
  const lower = pool.map((x) => x.trim().toLowerCase());
  lower.forEach((x, i) => lower.indexOf(x) !== i && fail(`pool ${c}`, `duplicate "${pool[i]}"`));
}

// Profiles
const ids = new Set<string>();
const handles = new Set<string>();
let maxWords = 0;
for (const p of profiles) {
  const at = `profile ${p.id}`;
  if (ids.has(p.id)) fail(at, "duplicate id");
  ids.add(p.id);
  if (handles.has(p.handle)) fail(at, "duplicate handle");
  handles.add(p.handle);

  for (const img of [p.avatar, ...p.posts.map((x) => x.photo).filter(Boolean)] as string[]) {
    if (!fs.existsSync(path.join(PFP, img))) fail(at, `image missing: public/pfp/${img}`);
  }

  const text = profileText(p);
  const words = wordCount(text);
  maxWords = Math.max(maxWords, words);
  if (words > MAX_WORDS) fail(at, `${words} visible words (max ${MAX_WORDS})`);
  if (p.bio.length > 70) fail(at, `bio is ${p.bio.length} chars (keep ≤ 70 so it fits 2 short lines)`);
  if (p.posts.length < 3 || p.posts.length > 4) fail(at, `${p.posts.length} posts (need 3–4)`);
  if (p.posts.filter((x) => x.photo).length !== 1) fail(at, "needs exactly 1 photo post");
  p.posts.forEach((x, i) => x.text.length > 60 && fail(at, `post ${i + 1} is ${x.text.length} chars (keep ≤ 60)`));
  if (!/^Joined [A-Z][a-z]+ \d{4}$/.test(p.joined)) fail(at, `joined should look like "Joined March 2023"`);
  for (const [re, label] of BANNED) if (re.test(text)) fail(at, `banned content (${label}): ${text.match(re)?.[0]}`);

  if (p.facts.length !== 6) fail(at, `${p.facts.length} facts (need exactly 6)`);
  const where = { bio: 0, post: 0, photo: 0 };
  const factIds = new Set<string>();
  const answers = p.facts.map((f) => f.answer.toLowerCase());
  for (const f of p.facts) {
    const fat = `${at}/${f.id}`;
    if (factIds.has(f.id)) fail(fat, "duplicate fact id");
    factIds.add(f.id);
    where[f.where]++;
    if (!CATEGORIES.includes(f.category)) fail(fat, `unknown category ${f.category}`);
    if (!containsPhrase(text, f.answer)) fail(fat, `answer "${f.answer}" not in profile text`);
    else if (!containsPhrase(areaText(p, f.where), f.answer)) fail(fat, `answer "${f.answer}" not in its "${f.where}" area`);
    if (containsPhrase(f.question, f.answer)) fail(fat, "question gives away the answer");
    if (!f.question.endsWith("?")) fail(fat, "question should end with ?");
    if (answers.filter((a) => a === f.answer.toLowerCase()).length > 1) fail(fat, "two facts share an answer");

    const pool = distractors[f.category] ?? [];
    const safe = safeCandidates(p, f.answer, pool);
    if (safe.length < MIN_SAFE) fail(fat, `only ${safe.length} safe distractors (need ≥ ${MIN_SAFE})`);
    // Belt and braces: nothing we could offer is the answer or appears anywhere on the profile.
    for (const d of safe) {
      if (d.toLowerCase() === f.answer.toLowerCase()) fail(fat, `distractor equals answer: ${d}`);
      if (containsPhrase(text, d)) fail(fat, `distractor "${d}" appears on the profile`);
    }
  }
  if (where.bio !== 2 || where.photo !== 1 || where.post !== 3) {
    fail(at, `fact spread is bio ${where.bio} / post ${where.post} / photo ${where.photo} (want 2 / 3 / 1)`);
  }
}

if (profiles.length < 12) fail("profiles", `only ${profiles.length} (need ≥ 12)`);
if (!ranks.some((r) => r.min === 0)) fail("ranks", "need a rank with min 0");
if (lessons.length < 1) fail("lessons", "need at least one lesson");

if (problems.length) {
  console.error(`✗ content lint: ${problems.length} problem(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`✓ content lint: ${profiles.length} profiles, ${CATEGORIES.length} pools, max ${maxWords} visible words per profile`);
