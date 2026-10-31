/*
 * End-to-end check: `npm run build && npm run e2e`.
 * Starts `next start` itself, plays the game in Chromium (Playwright) at 1440×900 and 390×844,
 * saves screenshots to docs/, and stops the server. Exits 1 on any failure.
 *
 * Per viewport:
 *   - the title screen (QR on laptops only)
 *   - 1 full game (3 rounds, real 10 s look) that takes the screenshots
 *   - RUNS more games (?time=3 to keep it quick) via PLAY AGAIN / Enter, with a page reload every
 *     2 games so the localStorage shuffle bags are exercised across reloads
 *   - 1 game with the network switched off (the game must not fetch anything after first load)
 *
 * Every round checks: the Replies / Media / Posts tabs open, the look screen may scroll (it's an X feed) but never sideways, the countdown ring
 * stays on screen after scrolling to the bottom, all images loaded, body text ≥ 13 px; every question has
 * 4 unique answers fully on screen and ≥ 56 px tall, exactly one correct; recall answers are on the profile
 * and wrong ones are either flagged decoys or not on the profile; NOT answers are not on the profile and
 * the other three are. A "Round N / 3" screen shows between rounds, results show N/15 with 15 evidence
 * rows, no console errors, no requests leave localhost, and no profile repeats back-to-back within a
 * difficulty (after 5 games every profile of each difficulty has been seen).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is not a project dependency: use a local install if present, otherwise a global one.
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3217);
const BASE = `http://127.0.0.1:${PORT}`;
const RUNS = Number(process.env.RUNS || 5);
const DOCS = path.join(ROOT, "docs");
const ROUNDS = 3;
const QUESTIONS = 5;

const VIEWPORTS = [
  { name: "1440", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "390", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const fail = (msg) => {
  failures.push(msg);
  console.error("  ✗ " + msg);
};

async function startServer() {
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) throw new Error("No build found. Run `npm run build` first.");
  const bin = path.join(ROOT, "node_modules", ".bin", "next");
  const proc = spawn(bin, ["start", "-p", String(PORT), "-H", "127.0.0.1"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return proc;
    } catch {}
    if (proc.exitCode !== null) break;
    await sleep(200);
  }
  proc.kill("SIGTERM");
  throw new Error("next start did not come up:\n" + log);
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
function hasPhrase(text, phrase) {
  const esc = phrase.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}])`, "iu").test(norm(text));
}

async function noSideScroll(page, where) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (sw > iw) fail(`${where}: sideways scroll (${sw} > ${iw})`);
}

/** Waits for a look screen and checks it. Returns the profile id, difficulty and its visible text. */
async function checkLook(page, label, shots) {
  const vh = page.viewportSize().height;
  await page.waitForSelector('[data-testid="look"] [data-testid="profile"]', { timeout: 12_000 });
  const profile = page.locator('[data-testid="profile"]');
  const profileId = await profile.getAttribute("data-profile-id");
  const difficulty = await profile.getAttribute("data-difficulty");
  await sleep(700); // rise-in
  await page
    .waitForFunction(() => [...document.querySelectorAll('[data-testid="look"] img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 4_000 })
    .catch(() => {});
  if (shots) await page.screenshot({ path: path.join(DOCS, `look-${shots}.png`) });
  const m = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="profile"]');
    const imgs = [...document.querySelectorAll('[data-testid="look"] img')];
    const fontPx = [...root.querySelectorAll('[data-testid="bio"], [data-testid="card"] p')].map((e) => parseFloat(getComputedStyle(e).fontSize));
    return {
      broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")),
      minFont: Math.min(...fontPx),
      cards: root.querySelectorAll('[data-testid="card"]').length,
      text: root.innerText,
    };
  });
  if (m.broken.length) fail(`${label} ${profileId}: broken images ${m.broken.join(", ")}`);
  if (m.minFont < 13) fail(`${label} ${profileId}: body text ${m.minFont}px (< 13px)`);
  if (m.cards < 6) fail(`${label} ${profileId}: only ${m.cards} posts`);
  await noSideScroll(page, `${label} ${profileId} look`);
  // tabs: Replies and Media open, the timer keeps running, then back to Posts (facts all live on Posts)
  for (const t of ["replies", "media", "posts"]) {
    await page.click(`[data-testid="tab-${t}"]`);
    await sleep(150);
    const ok = await page.locator(t === "posts" ? '[data-testid="feed"]:not([hidden])' : `[data-testid="${t}-tab"]`).count();
    if (!ok) fail(`${label} ${profileId}: ${t} tab did not open`);
  }
  // scrolling is allowed; the ring must stay visible (sticky) at the bottom of the feed
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await sleep(250);
  const ring = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="ring"]')]
      .map((e) => e.getBoundingClientRect())
      .filter((b) => b.width > 0)
      .map((b) => ({ top: b.top, bottom: b.bottom })),
  );
  if (!ring.some((b) => b.top >= 0 && b.bottom <= vh)) fail(`${label} ${profileId}: countdown ring not visible after scrolling`);
  if (shots) await page.screenshot({ path: path.join(DOCS, `look-scrolled-${shots}.png`) });
  return { profileId, difficulty, profileText: m.text };
}

/** Plays one round's 5 questions. Returns the number answered correctly. */
async function playQuiz(page, label, r, profileId, profileText, { shots = null, timeoutOne = false } = {}) {
  const vh = page.viewportSize().height;
  const vw = page.viewportSize().width;
  let correct = 0;
  for (let q = 0; q < QUESTIONS; q++) {
    await page.waitForSelector(`[data-testid="quiz"][data-round="${r}"][data-q="${q}"] [data-testid="answer"]:not([disabled])`, { timeout: 12_000 });
    await sleep(q === 0 && shots ? 700 : 120);
    const kind = await page.getAttribute('[data-testid="quiz"]', "data-kind");
    const btns = page.locator('[data-testid="answer"]');
    const n = await btns.count();
    if (n !== 4) fail(`${label} ${profileId} q${q + 1}: ${n} answer buttons`);
    const geo = await page.evaluate(() => ({
      rects: [...document.querySelectorAll('[data-testid="answer"]')].map((b) => {
        const x = b.getBoundingClientRect();
        return { top: x.top, bottom: x.bottom, left: x.left, right: x.right, h: x.height };
      }),
      scrollH: document.documentElement.scrollHeight,
      scrollW: document.documentElement.scrollWidth,
      question: document.querySelector('[data-testid="question"]').innerText,
    }));
    for (const [i, x] of geo.rects.entries()) {
      if (x.top < 0 || x.bottom > vh + 0.5 || x.left < 0 || x.right > vw + 0.5) fail(`${label} ${profileId} q${q + 1}: answer ${i + 1} not fully visible`);
      if (x.h < 56) fail(`${label} ${profileId} q${q + 1}: answer ${i + 1} only ${x.h}px tall`);
    }
    if (geo.scrollH > vh) fail(`${label} ${profileId} q${q + 1}: quiz screen scrolls`);
    if (geo.scrollW > vw) fail(`${label} ${profileId} q${q + 1}: sideways scroll`);
    if (shots && q === 0) await page.screenshot({ path: path.join(DOCS, `quiz-${shots}.png`) });
    if (shots && (kind === "not" || kind === "calc")) await page.screenshot({ path: path.join(DOCS, `quiz-${kind}-${shots}.png`) });

    const labels = (await btns.allInnerTexts()).map((o) => o.replace(/^\s*\d\s*/, "").replace(/✓/g, "").trim());
    if (new Set(labels.map((l) => l.toLowerCase())).size !== 4) fail(`${label} ${profileId} q${q + 1}: duplicate options ${labels}`);

    if (timeoutOne && q === 2) {
      await page.waitForSelector('[data-testid="answer"][data-correct="true"]', { timeout: 9_000 });
      const v = await page.locator('[data-testid="verdict"]').innerText();
      if (!/time/i.test(v)) fail(`${label} ${profileId} q${q + 1}: timeout verdict missing ("${v}")`);
    } else {
      const pick = Math.floor(Math.random() * 4);
      await btns.nth(pick).click();
      await page.waitForSelector('[data-testid="answer"][data-correct="true"]', { timeout: 2_000 });
      if ((await btns.nth(pick).getAttribute("data-correct")) === "true") correct++;
    }

    const flags = await btns.evaluateAll((bs) => bs.map((b) => [b.getAttribute("data-correct"), b.getAttribute("data-decoy")]));
    if (flags.filter(([c]) => c === "true").length !== 1) fail(`${label} ${profileId} q${q + 1}: ${flags} correct flags`);
    labels.forEach((l, i) => {
      const on = hasPhrase(profileText, l);
      const right = flags[i][0] === "true";
      const decoy = flags[i][1] === "true";
      if (kind === "recall") {
        if (right && !on) fail(`${label} ${profileId}: "${geo.question}" answer "${l}" is not on the profile`);
        if (!right && on && !decoy) fail(`${label} ${profileId}: "${geo.question}" wrong option "${l}" is on the profile but not a decoy`);
      }
      if (kind === "not") {
        if (right && on) fail(`${label} ${profileId}: "${geo.question}" answer "${l}" IS on the profile`);
        if (!right && !on) fail(`${label} ${profileId}: "${geo.question}" option "${l}" should be on the profile`);
      }
      if (kind === "photo" && !right && on && !decoy) fail(`${label} ${profileId}: "${geo.question}" wrong option "${l}" is on the profile but not a decoy`);
    });
  }
  return correct;
}

/** Plays a whole game from the 3-2-1 screen to results. Returns { ids: {difficulty: id}, score }. */
async function playGame(page, label, { shots = null, timeoutOne = false } = {}) {
  await page.waitForSelector('[data-testid="ready"]', { timeout: 10_000 });
  await noSideScroll(page, `${label} ready`);
  const ids = {};
  let correct = 0;
  for (let r = 0; r < ROUNDS; r++) {
    if (r > 0) {
      await page.waitForSelector(`[data-testid="between"][data-round="${r}"]`, { timeout: 8_000 }).catch(() => fail(`${label}: no round ${r + 1} screen`));
      if (shots && r === 1) {
        await sleep(600);
        await page.screenshot({ path: path.join(DOCS, `round-${shots}.png`) });
      }
    }
    const look = await checkLook(page, `${label} r${r + 1}`, shots && r === 0 ? shots : null);
    const want = ["easy", "medium", "hard"][r];
    if (look.difficulty !== want) fail(`${label} r${r + 1}: ${look.profileId} is ${look.difficulty}, expected ${want}`);
    ids[want] = look.profileId;
    await page.waitForSelector('[data-testid="quiz"]', { timeout: 15_000 });
    correct += await playQuiz(page, `${label} r${r + 1}`, r, look.profileId, look.profileText, { shots, timeoutOne: timeoutOne && r === 0 });
  }

  await page.waitForSelector('[data-testid="results"]', { timeout: 6_000 });
  const score = Number(await page.locator('[data-testid="results"]').getAttribute("data-score"));
  if (score !== correct) fail(`${label}: score ${score}, expected ${correct}`);
  const rows = await page.locator('[data-testid="review-row"]').count();
  if (rows !== ROUNDS * QUESTIONS) fail(`${label}: ${rows} evidence rows (want ${ROUNDS * QUESTIONS})`);
  await noSideScroll(page, `${label} results`);
  const ar = await page.locator('[data-testid="again"]').boundingBox();
  if (!ar || ar.y + ar.height > page.viewportSize().height) fail(`${label}: PLAY AGAIN is below the fold`);
  if (shots) {
    await sleep(1500);
    await page.screenshot({ path: path.join(DOCS, `results-${shots}.png`) });
  }
  return { ids, score };
}

async function testViewport(browser, vp) {
  console.log(`\n▶ ${vp.viewport.width}×${vp.viewport.height}`);
  const context = await browser.newContext({ ...vp, name: undefined, reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors = [];
  const external = [];
  let offline = false;
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => msg.type() === "error" && errors.push("console: " + msg.text()));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["127.0.0.1", "localhost"].includes(u.hostname) && u.protocol !== "data:") external.push(r.url());
    if (offline && !r.url().startsWith("data:")) external.push("while offline: " + r.url());
  });

  // ---- title ----
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="title-screen"]');
  await noSideScroll(page, `${vp.name} title`);
  const qrVisible = await page.locator('[data-testid="qr"]').isVisible().catch(() => false);
  if (vp.isMobile && qrVisible) fail(`${vp.name}: QR should be hidden on phones`);
  if (!vp.isMobile && !qrVisible) fail(`${vp.name}: QR missing on laptop`);
  await sleep(1200);
  await page.screenshot({ path: path.join(DOCS, `title-${vp.name}.png`) });

  // ---- full-length game with screenshots ----
  await page.locator('button[data-testid="play"]').click();
  const seq = { easy: [], medium: [], hard: [] };
  const push = (ids) => Object.entries(ids).forEach(([d, id]) => seq[d].push(id));
  const t0 = Date.now();
  const first = await playGame(page, `${vp.name} full`, { shots: vp.name });
  push(first.ids);
  console.log(`  game 0 (10 s looks, ${((Date.now() - t0) / 1000).toFixed(1)} s): ${Object.values(first.ids).join(" / ")} ${first.score}/15`);

  // Esc goes back to the title
  await page.keyboard.press("Escape");
  await page.waitForSelector('[data-testid="title-screen"]', { timeout: 3_000 }).catch(() => fail(`${vp.name}: Esc did not return to title`));

  // ---- more games (bags persist across reloads) ----
  await page.goto(BASE + "/play?time=3", { waitUntil: "networkidle" });
  for (let i = 1; i <= RUNS; i++) {
    const g = await playGame(page, `${vp.name} game ${i}`, { timeoutOne: i === 1 });
    push(g.ids);
    console.log(`  game ${i}: ${Object.values(g.ids).join(" / ")} ${g.score}/15`);
    if (i === RUNS) break;
    if (i % 2 === 0) await page.reload({ waitUntil: "networkidle" });
    else if (i % 3 === 0) await page.keyboard.press("Enter");
    else await page.locator('[data-testid="again"]').click();
  }

  // ---- offline game ----
  await page.waitForTimeout(500);
  offline = true;
  await context.setOffline(true);
  await page.locator('[data-testid="again"]').click();
  const off = await playGame(page, `${vp.name} offline`);
  push(off.ids);
  console.log(`  offline game: ${Object.values(off.ids).join(" / ")} ${off.score}/15`);
  await context.setOffline(false);
  offline = false;

  for (const [d, s] of Object.entries(seq)) {
    for (let i = 1; i < s.length; i++) if (s[i] === s[i - 1]) fail(`${vp.name}: ${d} profile ${s[i]} repeated back-to-back`);
    console.log(`  ${d}: ${new Set(s).size} distinct over ${s.length} games (${s.join(" ")})`);
  }
  if (errors.length) fail(`${vp.name}: ${errors.length} console/page errors:\n    ${[...new Set(errors)].join("\n    ")}`);
  if (external.length) fail(`${vp.name}: requests left the device:\n    ${[...new Set(external)].join("\n    ")}`);
  await context.close();
}

const server = await startServer();
let browser;
try {
  fs.mkdirSync(DOCS, { recursive: true });
  browser = await chromium.launch();
  await Promise.all(VIEWPORTS.map((vp) => testViewport(browser, vp)));
} catch (e) {
  fail("crashed: " + (e?.stack || e));
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

if (failures.length) {
  console.error(`\n✗ e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\n✓ e2e passed; screenshots in docs/");
