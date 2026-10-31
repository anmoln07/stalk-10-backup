/*
 * End-to-end check: `npm run build && npm run e2e`.
 * Starts `next start` itself, plays the game in Chromium (Playwright) at 1440×900 and 390×844,
 * saves screenshots to docs/, and stops the server. Exits 1 on any failure.
 *
 * Per viewport:
 *   - 1 full-length run (10 s look) that takes the four screenshots
 *   - 20 consecutive runs (?time=3 to keep it quick) via PLAY AGAIN, with a page reload every 5
 *     runs so the localStorage shuffle bag is exercised across reloads
 *   - 1 run with the network switched off (the game must not fetch anything after first load)
 *
 * Every run checks: profile screen has no scroll, the header and every fact-bearing card are fully on screen,
 * all images loaded, 4 answer buttons all inside the viewport, no sideways scroll, the right answer
 * is on the profile and the wrong ones aren't, the score matches, no console errors / page crashes,
 * no requests leave localhost, and no profile appears twice in a row.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is not a project dependency: use a local install if present, otherwise a global one
// (resolved through NODE_PATH / require paths, which ESM `import` ignores).
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3217);
const BASE = `http://127.0.0.1:${PORT}`;
const RUNS = Number(process.env.RUNS || 20);
const DOCS = path.join(ROOT, "docs");
// Optional: SWEEP_DIR=/some/dir saves a look-screen screenshot of every profile at both sizes.
const SWEEP_DIR = process.env.SWEEP_DIR || "";
// Profile ids, read from the source so the sweep covers every profile.
const PROFILE_IDS = [...fs.readFileSync(path.join(ROOT, "content", "profiles.ts"), "utf8").matchAll(/^\s*id: "([a-z0-9_-]+)", name:/gm)].map((x) => x[1]);

const VIEWPORTS = [
  { name: "1440", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "390", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

// Shorter screens: layout-only sweep (noise cards may be hidden here, fact cards never).
const SHORT_VIEWPORTS = [
  { name: "375x667", viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: "1280x720", viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const layoutLog = [];
const vp = (page) => `${page.viewportSize().width}×${page.viewportSize().height}`;
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

function norm(s) {
  return s.toLowerCase().replace(/\s+/g, " ");
}
function hasPhrase(text, phrase) {
  const esc = phrase.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}])`, "iu").test(norm(text));
}

async function noSideScroll(page, where) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (sw > iw) fail(`${where}: sideways scroll (${sw} > ${iw})`);
}

/** Waits for the look screen and checks it. Returns the profile id and its visible text. */
async function checkProfileScreen(page, label) {
  const vh = page.viewportSize().height;
  const vw = page.viewportSize().width;
  await page.waitForSelector('[data-testid="profile"]', { timeout: 10_000 });
  const profile = page.locator('[data-testid="profile"]');
  const profileId = await profile.getAttribute("data-profile-id");
  await sleep(700); // let the rise-in animation finish

  // ---- profile screen checks ----
  // wait for every picture on the profile to decode
  await page
    .waitForFunction(() => [...document.querySelectorAll('[data-testid="profile"] img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 4_000 })
    .catch(() => {});
  const m = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="profile"]');
    const header = root.querySelector("header");
    const factCards = [...root.querySelectorAll('[data-fact="true"]')];
    const boxes = [header, ...factCards].map((e) => e.getBoundingClientRect());
    const imgs = [...root.querySelectorAll("img")];
    const fontPx = [...root.querySelectorAll('header h2 ~ p, [data-fact="true"] p:first-child')].map((e) => parseFloat(getComputedStyle(e).fontSize));
    const feed = root.querySelector('[data-testid="feed"]');
    return {
      scrollH: document.documentElement.scrollHeight,
      scrollW: document.documentElement.scrollWidth,
      bodyScrollH: document.body.scrollHeight,
      bottom: Math.max(...boxes.map((b) => b.bottom)),
      top: Math.min(...boxes.map((b) => b.top)),
      right: Math.max(...boxes.map((b) => b.right)),
      factCards: factCards.length,
      cards: root.querySelectorAll('[data-testid="card"]').length,
      hiddenNoise: Number(feed?.getAttribute("data-hidden-noise") ?? 0),
      broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute("src")),
      minFont: Math.min(...fontPx),
      text: root.innerText,
    };
  });
  if (m.scrollH > vh || m.bodyScrollH > vh) fail(`${label} ${profileId}: profile screen scrolls (${m.scrollH}px > ${vh}px)`);
  if (m.bottom > vh + 0.5 || m.top < -0.5) fail(`${label} ${profileId}: a fact card or the header is cut off (${Math.round(m.top)}–${Math.round(m.bottom)} of ${vh})`);
  if (m.right > vw + 0.5 || m.scrollW > vw) fail(`${label} ${profileId}: profile wider than screen`);
  if (m.broken.length) fail(`${label} ${profileId}: broken images ${m.broken.join(", ")}`);
  if (m.minFont < 13) fail(`${label} ${profileId}: body text ${m.minFont}px (< 13px)`);
  // Short screens (e.g. 375×667) may hide all noise; the plan says hide noise first, never facts.
  if (vh >= 700 && m.cards - m.factCards < 1) fail(`${label} ${profileId}: every noise card was hidden`);
  layoutLog.push(`${vp(page)} ${profileId}: ${m.cards} cards shown, ${m.hiddenNoise} noise hidden`);
  const profileText = m.text;
  return { profileId, profileText };
}

/** Plays one run from the 3-2-1 screen to results. Returns { profileId, score }. */
async function playRun(page, label, { shots = null, lookMs = 3000, timeoutOne = false } = {}) {
  const vh = page.viewportSize().height;
  const vw = page.viewportSize().width;

  await page.waitForSelector('[data-testid="ready"]', { timeout: 10_000 });
  await noSideScroll(page, `${label} ready`);
  const { profileId, profileText } = await checkProfileScreen(page, label);

  if (shots) {
    await sleep(800);
    await page.screenshot({ path: path.join(DOCS, `look-${shots}.png`) });
  }

  // ---- quiz ----
  await page.waitForSelector('[data-testid="quiz"]', { timeout: lookMs + 5_000 });
  let correct = 0;
  for (let q = 0; q < 5; q++) {
    await page.waitForSelector(`[data-testid="quiz"][data-q="${q}"] [data-testid="answer"]:not([disabled])`, { timeout: 10_000 });
    await sleep(q === 0 && shots ? 700 : 120);
    const btns = page.locator('[data-testid="answer"]');
    const n = await btns.count();
    if (n !== 4) fail(`${label} ${profileId} q${q + 1}: ${n} answer buttons`);
    const geo = await page.evaluate(() => ({
      rects: [...document.querySelectorAll('[data-testid="answer"]')].map((b) => {
        const r = b.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height };
      }),
      scrollH: document.documentElement.scrollHeight,
      scrollW: document.documentElement.scrollWidth,
      question: document.querySelector('[data-testid="question"]').innerText,
    }));
    for (const [i, r] of geo.rects.entries()) {
      if (r.top < 0 || r.bottom > vh + 0.5 || r.left < 0 || r.right > vw + 0.5) {
        fail(`${label} ${profileId} q${q + 1}: answer ${i + 1} not fully visible (${Math.round(r.top)}–${Math.round(r.bottom)} of ${vh})`);
      }
      if (r.h < 56) fail(`${label} ${profileId} q${q + 1}: answer ${i + 1} only ${r.h}px tall`);
    }
    if (geo.scrollH > vh) fail(`${label} ${profileId} q${q + 1}: quiz screen scrolls`);
    if (geo.scrollW > vw) fail(`${label} ${profileId} q${q + 1}: sideways scroll`);
    if (shots && q === 0) await page.screenshot({ path: path.join(DOCS, `quiz-${shots}.png`) });

    const options = await btns.allInnerTexts();
    const labels = options.map((o) => o.replace(/^\s*\d\s*/, "").replace(/✓/g, "").trim());
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

    // The question must be possible: right answer on the profile, wrong ones not.
    const flags = await btns.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-correct")));
    if (flags.filter((f) => f === "true").length !== 1) fail(`${label} ${profileId} q${q + 1}: ${flags} correct flags`);
    labels.forEach((l, i) => {
      const onProfile = hasPhrase(profileText, l);
      if (flags[i] === "true" && !onProfile) fail(`${label} ${profileId}: "${geo.question}" answer "${l}" is not on the profile`);
      if (flags[i] !== "true" && onProfile) fail(`${label} ${profileId}: "${geo.question}" wrong option "${l}" is on the profile`);
    });
  }

  // ---- results ----
  await page.waitForSelector('[data-testid="results"]', { timeout: 5_000 });
  const score = Number(await page.locator('[data-testid="results"]').getAttribute("data-score"));
  if (score !== correct) fail(`${label} ${profileId}: score ${score}, expected ${correct}`);
  await noSideScroll(page, `${label} results`);
  const again = page.locator('[data-testid="again"]');
  const ar = await again.boundingBox();
  if (!ar || ar.y + ar.height > vh) fail(`${label}: PLAY AGAIN is below the fold`);
  if (shots) {
    await sleep(1500);
    await page.screenshot({ path: path.join(DOCS, `results-${shots}.png`) });
  }
  return { profileId, score };
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
  await sleep(1200); // demo loop: profile visible
  await page.screenshot({ path: path.join(DOCS, `title-${vp.name}.png`) });

  // ---- layout sweep: every profile's look screen ----
  for (const id of PROFILE_IDS) {
    await page.goto(`${BASE}/play?profile=${id}&time=60`, { waitUntil: "networkidle" });
    const { profileId } = await checkProfileScreen(page, `${vp.name} sweep`);
    if (profileId !== id) fail(`${vp.name} sweep: asked for ${id}, got ${profileId}`);
    if (SWEEP_DIR) await page.screenshot({ path: path.join(SWEEP_DIR, `${id}-${vp.name}.png`) });
  }
  console.log(`  layout sweep: ${PROFILE_IDS.length} profiles checked`);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="title-screen"]');

  // ---- full-length run with screenshots ----
  await page.locator('button[data-testid="play"]').click();
  const seq = [];
  const t0 = Date.now();
  const first = await playRun(page, `${vp.name} full`, { shots: vp.name, lookMs: 10_000 });
  seq.push(first.profileId);
  console.log(`  run 0 (10 s look, ${((Date.now() - t0) / 1000).toFixed(1)} s total): ${first.profileId} ${first.score}/5`);

  // Esc goes back to the title, Enter starts again
  await page.keyboard.press("Escape");
  await page.waitForSelector('[data-testid="title-screen"]', { timeout: 3_000 }).catch(() => fail(`${vp.name}: Esc did not return to title`));

  // ---- 20 consecutive runs ----
  await page.goto(BASE + "/play?time=3", { waitUntil: "networkidle" });
  for (let i = 1; i <= RUNS; i++) {
    const r = await playRun(page, `${vp.name} run ${i}`, { timeoutOne: i === 3 });
    if (r.profileId === seq[seq.length - 1]) fail(`${vp.name} run ${i}: profile ${r.profileId} repeated back-to-back`);
    seq.push(r.profileId);
    process.stdout.write(`  run ${i}: ${r.profileId} ${r.score}/5\n`);
    if (i === RUNS) break;
    if (i % 5 === 0) await page.reload({ waitUntil: "networkidle" });
    else if (i % 2 === 0) await page.keyboard.press("Enter");
    else await page.locator('[data-testid="again"]').click();
  }

  // ---- offline run ----
  await page.waitForTimeout(500);
  offline = true;
  await context.setOffline(true);
  await page.locator('[data-testid="again"]').click();
  const off = await playRun(page, `${vp.name} offline`);
  if (off.profileId === seq[seq.length - 1]) fail(`${vp.name} offline: profile repeated back-to-back`);
  seq.push(off.profileId);
  console.log(`  offline run: ${off.profileId} ${off.score}/5`);
  await context.setOffline(false);
  offline = false;

  // A full cycle should show every profile once before any repeats (runs 1..14 after the screenshot run).
  const distinct = new Set(seq).size;
  console.log(`  profiles seen: ${distinct} distinct over ${seq.length} runs; sequence ${seq.join(" ")}`);
  if (errors.length) fail(`${vp.name}: ${errors.length} console/page errors:\n    ${[...new Set(errors)].join("\n    ")}`);
  if (external.length) fail(`${vp.name}: requests left the device:\n    ${[...new Set(external)].join("\n    ")}`);
  await context.close();
  return seq;
}

const server = await startServer();
let browser;
try {
  fs.mkdirSync(DOCS, { recursive: true });
  browser = await chromium.launch();
  const results = await Promise.all(VIEWPORTS.map((vp) => testViewport(browser, vp)));
  for (const vp of SHORT_VIEWPORTS) {
    const context = await browser.newContext({ ...vp, name: undefined });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const id of PROFILE_IDS) {
      await page.goto(`${BASE}/play?profile=${id}&time=60`, { waitUntil: "networkidle" });
      await checkProfileScreen(page, `${vp.name} sweep`);
      if (SWEEP_DIR) await page.screenshot({ path: path.join(SWEEP_DIR, `${id}-${vp.name}.png`) });
    }
    if (errors.length) fail(`${vp.name}: page errors ${errors.join("; ")}`);
    console.log(`\n▶ ${vp.name}: layout sweep of ${PROFILE_IDS.length} profiles done`);
    await context.close();
  }
  console.log(`\n${results.map((s, i) => `${VIEWPORTS[i].name}: ${s.length} runs`).join(", ")}`);
  const hid = layoutLog.filter((l) => !l.endsWith(" 0 noise hidden"));
  console.log(`layout: ${layoutLog.length} profile screens checked; ${hid.length} needed noise cards hidden${hid.length ? ":\n  " + [...new Set(hid)].join("\n  ") : ""}`);
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
