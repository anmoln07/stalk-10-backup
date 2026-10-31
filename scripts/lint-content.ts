/* Content lint: `npm run lint:content`. Exits 1 with a list of problems if anything is off. */
import fs from "node:fs";
import path from "node:path";
import { profiles } from "../content/profiles";
import { distractors } from "../content/distractors";
import { lookalikes } from "../content/lookalikes";
import { friends, memeAccounts } from "../content/friends";
import { memeCaptions, newsHeadlines, artCaptions } from "../content/noise";
import { ranks } from "../content/ranks";
import { lessons } from "../content/lessons";
import { MAX_POST_WORDS, MAX_REPLY_WORDS, QUESTIONS_PER_ROUND, RULES } from "../content/rules";
import { DIFFICULTIES, factKind, isNoise, type Category, type Fact, type Profile } from "../content/types";
import { areaText, cardText, containsPhrase, factText, postText, profileText, sigWords, stem, threadOf, wordCount } from "../lib/text";
import { images, imageWords, profileImages, speciesOf } from "../lib/images";
import { calcValue, formatCalc, safeCandidates, safeLookalikes } from "../lib/buildRun";

const MAX_NOISE_WORDS = 8; // each caption / headline in content/noise.ts
const MIN_POOL = 8;
const MIN_SAFE = 4; // safe pool wrong answers left per recall/photo fact after filtering (3 needed)
const MAX_IMAGE_PROFILES = 2;
const MIN_PER_DIFFICULTY = 4;
const ROOT = path.join(__dirname, "..");
const PFP = path.join(ROOT, "public", "pfp");
const FEED = path.join(ROOT, "public", "feed");
const CATEGORIES = Object.keys(distractors) as Category[];
const TIME = /^\d{1,2}[mhd]$/;
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

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
const lc = (s: string) => s.trim().toLowerCase();

// ---------- pools + look-alikes ----------
for (const c of CATEGORIES) {
  const pool = distractors[c] ?? [];
  if (pool.length < MIN_POOL) fail(`pool ${c}`, `only ${pool.length} entries (need ≥ ${MIN_POOL})`);
  const lower = pool.map(lc);
  lower.forEach((x, i) => lower.indexOf(x) !== i && fail(`pool ${c}`, `duplicate "${pool[i]}"`));
}
for (const [k, list] of Object.entries(lookalikes)) {
  if (k !== lc(k)) fail(`lookalikes ${k}`, "key must be lower-case");
  for (const l of list) if (lc(l) === k || containsPhrase(l, k) || containsPhrase(k, l)) fail(`lookalikes ${k}`, `"${l}" is not a near miss`);
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

// ---------- accounts ----------
for (const [h, a] of [...Object.entries(friends), ...Object.entries(memeAccounts)]) {
  if (!fs.existsSync(path.join(PFP, a.avatar))) fail(`account @${h}`, `avatar missing: public/pfp/${a.avatar}`);
  for (const [re, label] of BANNED) if (re.test(`${a.name} ${h}`)) fail(`account @${h}`, `banned content (${label})`);
}

// ---------- profiles ----------
const ids = new Set<string>();
const handles = new Set<string>();
const imageUse = new Map<string, Set<string>>();
const stats: string[] = [];

/** Every word of `answer` is one of the image's `shows` tags (or a word of one), plurals folded. */
function imageShows(file: string, answer: string): boolean {
  const tags = new Set((images[file]?.shows ?? []).flatMap((t) => [t, ...t.split(/\s+/)]).map(stem));
  return tags.has(stem(answer)) || sigWords(answer).every((w) => tags.has(stem(w)));
}

function checkFact(p: Profile, f: Fact, text: string, shown: Set<string>, imgs: string[]) {
  const at = `profile ${p.id}/${f.id}`;
  if (!f.question.endsWith("?")) fail(at, "question should end with ?");
  const kind = factKind(f);

  if (f.kind === "not") {
    if (!/\bNOT\b/.test(f.question)) fail(at, 'NOT question must say "NOT" in capitals');
    if (f.present.length < 3) fail(at, `needs ≥ 3 present items (has ${f.present.length})`);
    for (const x of f.present) if (!containsPhrase(text, x)) fail(at, `present item "${x}" is not on the profile`);
    for (const c of f.categories) if (!CATEGORIES.includes(c)) fail(at, `unknown category ${c}`);
    const absent = safeCandidates(p, f.present[0], f.categories.flatMap((c) => distractors[c])).filter((c) =>
      f.present.every((x) => !sigWords(x).some((w) => sigWords(c).includes(w))),
    );
    if (absent.length < MIN_SAFE) fail(at, `only ${absent.length} safe "not on profile" options (need ≥ ${MIN_SAFE})`);
    for (const a of absent) if (containsPhrase(text, a)) fail(at, `absent option "${a}" is on the profile`);
    return;
  }

  if (f.kind === "calc") {
    const v = calcValue(f);
    if (f.op === "diff" && f.parts.length !== 2) fail(at, "diff needs exactly 2 parts");
    if (f.parts.length < 2) fail(at, "needs ≥ 2 clues");
    if (new Set(f.parts.map((x) => x.post)).size !== f.parts.length) fail(at, "clues must come from different posts");
    if (formatCalc(v, f.unit) !== f.answer) fail(at, `answer "${f.answer}" but clues give "${formatCalc(v, f.unit)}"`);
    if (v < 2) fail(at, `answer ${v} is too small (≥ 2, so the unit can stay plural)`);
    if (containsPhrase(f.question, String(v))) fail(at, "question gives away the answer");
    for (const c of f.parts) {
      const t = postText(p, c.post);
      if (t === null) fail(at, `clue post "${c.post}" not found (set id on the card)`);
      else if (!containsPhrase(t, c.says)) fail(at, `clue "${c.says}" not in post "${c.post}"`);
      const hasN = new RegExp(`(^|\\D)${c.n}(?!\\d)`).test(c.says) || containsPhrase(c.says, NUMBER_WORDS[c.n] ?? "\u0000");
      if (!hasN) fail(at, `clue "${c.says}" does not contain ${c.n}`);
    }
    return;
  }

  // recall + photo
  if (!CATEGORIES.includes(f.category)) fail(at, `unknown category ${f.category}`);
  if (containsPhrase(f.question, f.answer)) fail(at, "question gives away the answer");
  if (kind === "photo" && f.kind === "photo") {
    if (!imgs.includes(f.image)) fail(at, `image ${f.image} is not on this profile`);
    else if (!images[f.image] || !["object", "food", "place", "pet"].includes(images[f.image].kind)) fail(at, `${f.image} is not a photo`);
    if (!imageShows(f.image, f.answer)) fail(at, `"${f.answer}" is not in the shows tags of ${f.image}`);
  } else if (f.kind !== "photo") {
    if (!containsPhrase(text, f.answer)) fail(at, `answer "${f.answer}" not in profile text`);
    else if (!containsPhrase(areaText(p, f.where), f.answer)) fail(at, `answer "${f.answer}" not in its "${f.where}" area`);
    if (!containsPhrase(factText(p), f.answer)) fail(at, `answer "${f.answer}" only appears in noise cards`);
  }
  for (const d of f.decoys ?? []) {
    const onProfile = containsPhrase(text, d) || shown.has(lc(d));
    if (!onProfile) fail(at, `decoy "${d}" is not on the profile`);
    if (lc(d) === lc(f.answer) || containsPhrase(d, f.answer) || containsPhrase(f.answer, d)) fail(at, `decoy "${d}" overlaps the answer`);
  }
  const looks = safeLookalikes(p, f.answer, f.lookalikes);
  for (const l of f.lookalikes ?? []) if (!looks.includes(l)) fail(at, `look-alike "${l}" is on the profile or overlaps the answer`);
  const rule = RULES[p.difficulty];
  if (rule.lookalikes > 0 && looks.length === 0 && (f.decoys ?? []).length === 0) {
    fail(at, `${p.difficulty} facts need a decoy or a look-alike (add one to content/lookalikes.ts)`);
  }
  const safe = safeCandidates(p, f.answer, distractors[f.category] ?? []);
  if (safe.length < MIN_SAFE) fail(at, `only ${safe.length} safe distractors (need ≥ ${MIN_SAFE})`);
  for (const d of safe) {
    if (containsPhrase(text, d)) fail(at, `distractor "${d}" appears on the profile`);
    if (shown.has(lc(d)) || sigWords(d).some((w) => shown.has(w))) fail(at, `distractor "${d}" is shown in a picture`);
  }
}

for (const p of profiles) {
  const at = `profile ${p.id}`;
  const rule = RULES[p.difficulty];
  if (!rule) {
    fail(at, `unknown difficulty ${p.difficulty}`);
    continue;
  }
  if (ids.has(p.id)) fail(at, "duplicate id");
  ids.add(p.id);
  if (handles.has(p.handle)) fail(at, "duplicate handle");
  handles.add(p.handle);

  // images
  if (!fs.existsSync(path.join(PFP, p.avatar))) fail(at, `avatar missing: public/pfp/${p.avatar}`);
  if (p.banner && kindOf(p.banner) !== "place") fail(at, `banner ${p.banner} must be a place image`);
  const imgs = profileImages(p);
  for (const f of imgs) {
    if (!images[f]) fail(at, `image not in manifest: ${f}`);
    else if (!fs.existsSync(path.join(FEED, f))) fail(at, `image missing: public/feed/${f}`);
    if (!imageUse.has(f)) imageUse.set(f, new Set());
    imageUse.get(f)!.add(p.id);
  }
  imgs.forEach((f, i) => imgs.indexOf(f) !== i && fail(at, `image ${f} used twice on one profile`));
  for (const c of p.feed) {
    if (c.kind !== "photo" || kindOf(c.image) !== "pet") continue;
    const s = speciesOf(c.image);
    // a pet photo shows their own pet, unless the post says whose animal it is
    const named = (images[c.image]?.shows ?? []).some((t) => containsPhrase(cardText(c), t));
    if (s !== p.species && !named) fail(at, `${c.image} shows a ${s} but species is ${p.species ?? "unset"} and the post doesn't say whose`);
  }

  // feed shape
  const noise = p.feed.filter(isNoise);
  const replyPosts = p.feed.filter((c) => threadOf(c).length > 0).length;
  const [lo, hi] = rule.posts;
  if (p.feed.length < lo || p.feed.length > hi) fail(at, `${p.feed.length} posts (${p.difficulty} needs ${lo}–${hi})`);
  if (noise.length < rule.minNoise) fail(at, `${noise.length} noise posts (${p.difficulty} needs ≥ ${rule.minNoise})`);
  if (!noise.some((c) => c.kind === "meme")) fail(at, "needs a meme");
  if (!noise.some((c) => c.kind === "news" || c.kind === "art")) fail(at, "needs a news or art post");
  if (replyPosts < rule.minReplyPosts) fail(at, `${replyPosts} posts with replies (${p.difficulty} needs ≥ ${rule.minReplyPosts})`);
  const postIds = p.feed.flatMap((c) => ("id" in c && c.id ? [c.id] : []));
  postIds.forEach((id, i) => postIds.indexOf(id) !== i && fail(at, `duplicate post id ${id}`));
  p.feed.forEach((c, i) => {
    const cat = `${at} post ${i + 1} (${c.kind})`;
    if (!TIME.test(c.time)) fail(cat, `time "${c.time}" should look like 2h / 1d`);
    const words = wordCount(cardText(c));
    if (words > MAX_POST_WORDS) fail(cat, `${words} words (max ${MAX_POST_WORDS})`);
    const thread = threadOf(c);
    if (thread.length > 2) fail(cat, `${thread.length} replies (max 2)`);
    for (const r of thread) {
      if (!friends[r.by]) fail(cat, `reply by unknown friend @${r.by} (add to content/friends.ts)`);
      if (wordCount(r.text) > MAX_REPLY_WORDS) fail(cat, `reply "${r.text}" is ${wordCount(r.text)} words (max ${MAX_REPLY_WORDS})`);
    }
    if (c.kind !== "text" && kindOf(c.image) === undefined) return;
    if (c.kind === "photo" && !["object", "food", "place", "pet"].includes(kindOf(c.image)!)) fail(cat, `${c.image} is not a photo image`);
    if (c.kind === "meme" && !(memeCaptions[c.image] ?? []).includes(c.caption)) fail(cat, `caption not in content/noise.ts for ${c.image}`);
    if (c.kind === "art" && !(artCaptions[c.image] ?? []).includes(c.caption)) fail(cat, `caption not in content/noise.ts for ${c.image}`);
    if (c.kind === "news" && !(newsHeadlines[c.image] ?? []).some((h) => h.headline === c.headline && h.source === c.source)) {
      fail(cat, `headline/source not in content/noise.ts for ${c.image}`);
    }
    for (const k of ["meme", "news", "art"] as const) if (c.kind === k && kindOf(c.image) !== k) fail(cat, `${c.image} is not a ${k} image`);
    if (c.kind === "news" && c.image === "news-02.webp") fail(cat, "news-02 shows faces in a crowd; don't use it");
  });

  // budgets + banned content
  const text = profileText(p);
  const words = wordCount(text);
  if (words > rule.maxWords) fail(at, `${words} visible words (${p.difficulty} max ${rule.maxWords})`);
  if (p.bio.length > 70) fail(at, `bio is ${p.bio.length} chars (keep ≤ 70)`);
  if (!/^Joined [A-Z][a-z]+ \d{4}$/.test(p.joined)) fail(at, `joined should look like "Joined March 2023"`);
  for (const [re, label] of BANNED) if (re.test(text)) fail(at, `banned content (${label}): ${text.match(re)?.[0]}`);

  // facts
  const [flo, fhi] = rule.facts;
  if (p.facts.length < flo || p.facts.length > fhi) fail(at, `${p.facts.length} facts (${p.difficulty} needs ${flo}–${fhi})`);
  if (p.facts.length < QUESTIONS_PER_ROUND) fail(at, `fewer facts than questions per round`);
  const factIds = new Set<string>();
  const shown = imageWords(p);
  for (const f of p.facts) {
    if (factIds.has(f.id)) fail(`${at}/${f.id}`, "duplicate fact id");
    factIds.add(f.id);
    checkFact(p, f, text, shown, imgs);
  }
  const answers = p.facts.flatMap((f) => ("answer" in f && f.kind !== "calc" ? [lc(f.answer)] : []));
  answers.forEach((a, i) => answers.indexOf(a) !== i && fail(at, `two facts share the answer "${a}"`));
  const recall = p.facts.filter((f) => factKind(f) === "recall") as Extract<Fact, { where: unknown }>[];
  if (!recall.some((f) => f.where === "bio")) fail(at, "needs a fact in the bio");
  if (!recall.some((f) => f.where === "text")) fail(at, "needs a fact in a text post");
  if (recall.filter((f) => f.where === "reply").length > 1) fail(at, "replies carry decoys; at most one fact may live in a reply");
  const special = p.facts.filter((f) => factKind(f) !== "recall");
  if (special.length < rule.minSpecial) fail(at, `${special.length} photo/NOT/calc facts (${p.difficulty} needs ≥ ${rule.minSpecial})`);
  if (p.difficulty === "hard" && new Set(special.map(factKind)).size < 2) fail(at, "hard profiles need two different special question types");
  const decoys = p.facts.reduce((n, f) => n + ("decoys" in f ? f.decoys?.length ?? 0 : 0), 0);
  if (decoys < rule.minDecoys) fail(at, `${decoys} decoys (${p.difficulty} needs ≥ ${rule.minDecoys})`);
  stats.push(`${p.id} (${p.difficulty}): ${p.feed.length} posts, ${replyPosts} with replies, ${decoys} decoys, ${special.length} special, ${words} words`);
}

for (const d of DIFFICULTIES) {
  const n = profiles.filter((p) => p.difficulty === d).length;
  if (n < MIN_PER_DIFFICULTY) fail("profiles", `only ${n} ${d} profiles (need ≥ ${MIN_PER_DIFFICULTY})`);
}
for (const [f, who] of imageUse) {
  if (who.size > MAX_IMAGE_PROFILES) fail(`image ${f}`, `used by ${who.size} profiles (${[...who].join(", ")}; max ${MAX_IMAGE_PROFILES})`);
}
if (!ranks.some((r) => r.min === 0)) fail("ranks", "need a rank with min 0");
if (lessons.length < 1) fail("lessons", "need at least one lesson");

if (process.argv.includes("--stats")) console.log(stats.join("\n"));
if (problems.length) {
  console.error(`✗ content lint: ${problems.length} problem(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
const per = DIFFICULTIES.map((d) => `${profiles.filter((p) => p.difficulty === d).length} ${d}`).join(", ");
console.log(`✓ content lint: ${profiles.length} profiles (${per}), ${CATEGORIES.length} pools, ${imageUse.size}/${Object.keys(images).length} feed images used`);
