# Open questions and judgement calls

Nothing here blocks playing or deploying. Each item says what was chosen so Anmol can confirm or change it.

## Content

1. **14 profiles** (v2: 5 Easy, 5 Medium, 4 Hard). All pass the content lint.
2. *(v1 word limits replaced by the per-difficulty limits in `content/rules.ts`.)*
3. **Mira matches the worked example again.** The new feed pack has a sneakers photo, so her photo fact is back to yellow sneakers.
4. **"Bio" facts include the location row.** For most profiles the city appears in both the bio and the
   📍 row. The lint counts the 📍 row as part of the bio area.
5. **Category granularity.** Wrong answers come from the whole category pool, so "Which dance practice ran
   late?" can offer Chess next to Kathak and Salsa. That makes some questions easier than others. Splitting
   pools (e.g. dances vs. games) would be a small change if it matters.
6. **Pet pool also covers toys.** Rohan's arcade frog ("Waffles") and Leela's rubber duck ("Captain") use
   the `pet` pool for their names.
7. **Club in-jokes / extra profiles** (open item in the plan): none added yet. They drop straight into
   `content/profiles.ts`.

## Behaviour

8. **"Best this session"** = best score on this device in the last 6 hours (stored in `localStorage`). A
   stall day counts as one session without needing a reset button.
9. **`?kiosk=1`** hides the nav pill and the Esc hint. The 30 s idle auto-return on results is already
   always on (per the style guide), so kiosk mode has nothing extra to force.
10. **Sound:** none (optional in the plan, muted by default, so it was left out).
11. **The QR encodes the page's own address.** If the stall laptop runs it from `localhost`, the QR points
    phones at `localhost`. Open the game at `https://sleuth.cipherbu.tech` at the stall.

## Build / environment

12. **SOCIALTRACE repo was unreachable**, so the look uses the fallback tokens from the style guide
    (colours, type, glass nav pill, magnetic button, marquee). Copying the real `globals.css`, `SiteNav`,
    `Magnetic` and `Cursor` from SOCIALTRACE later would make the match exact. (No custom cursor was added.)
13. **Playwright is not a dependency.** `npm run e2e` uses the globally installed Playwright/Chromium. On a
    fresh machine: `npm i -D playwright && npx playwright install chromium`.
14. **The e2e 20-run loop uses `?time=3`** to keep it to a few minutes. The first run per viewport (the one
    that takes screenshots) uses the real 10-second look.
15. **Event date** is still open (from the plan). Nothing in the app depends on it.

## Mixed feed update

16. *(v1 "hide noise on short screens" is gone: v2 scrolls.)*
17. **66 of the 104 feed images are used** (incl. the SOCIALTRACE ones). The rest are free for new profiles.

## v2 (harder, X-style) — judgement calls

**Decided by Anmol (2026-11-01):** #18–22, #24–28 kept as built. #19: no look-alikes on Easy (keep as is).
#25: keep the mean look-alikes. #27: 3.6 s round screen is fine. #23: changed — tabs are now clickable
(see #29).

18. **Easy has 5 profiles, Hard has 4.** Five old profiles stayed Easy (light upgrade: one friend reply with a
    decoy each); five became Medium and four Hard (rewritten with more posts, replies, decoys, NOT / inference /
    photo questions). Mira is Hard so the worked example (Biscuit vs Arjun's dog Cookie, Pune vs Puri) is in.
19. **Option mix per difficulty** (`content/rules.ts`): Easy offers ≤ 1 decoy and no look-alikes; Medium
    ≤ 1 decoy + 1 look-alike; Hard ≤ 2 decoys + 1 look-alike. Medium asks ≥ 1 and Hard ≥ 2 special
    questions (photo / NOT / inference) every round. Easy may still be too easy for regulars — say if you want
    look-alikes on Easy too.
20. **NOT questions are always the last question of a round**, because they list three things that were on
    the profile (which would hint at other answers). On Hard the missing option is a look-alike when one
    exists (Nagaur when Nagpur was on the profile).
21. **Inference questions use numbers in the text only** (e.g. "the 15th" + "the 11th" → 4 days; 40 km +
    25 km). They never depend on timestamps, because the feed order (and so the shown times) changes every play.
22. **Timestamps follow position**: after shuffling, the newest time goes on top so the feed reads like a
    real timeline. Friend reply times are worked out from their post's time.
23. ~~Tabs are visual only.~~ **Decided: clickable** — Posts / Replies / Media work during the look; Likes stays visual only.
24. **Images are cropped** to 4:3 (phones) / 16:10 (laptops) for square shots and 16:9 for wide ones, so a
    Hard feed isn't all pictures. SOCIALTRACE never crops feed images; here only photo questions depend on
    pictures and their subjects stay in the centre.
25. **Look-alikes are judgement calls** (Biscotti/Bisket, Puri, Viola, Lavender, Samba, Mocha, Nagaur…). They are
    clearly different words/things but some are mean (Lilac vs Lavender, Mint vs Sage). Edit
    `content/lookalikes.ts` to taste.
26. **Some SOCIALTRACE images were skipped**: `news-metro`, `news-tennis` and `gig` (crowds/faces), `pint`
    (alcohol), `cola` (brand look), `ibis`, `roast`. Western scenes (maple leaves, pumpkins, trams) are used
    only as noise.
27. **Round screen timing:** 3.6 s between rounds (shows the round score and the next difficulty), no extra 3-2-1.
    A full game takes about 1½–2½ minutes; the e2e playthrough was not run (per instructions), only the
    screenshot script.
28. **Best score storage moved to v2 keys** (`sleuth.best.v2`, `sleuth.bags.v2`), so old /5 bests don't show as /15.
29. **Clickable tabs (built).** Replies = 2–3 short replies by the target to friends per profile (some hold decoys,
    e.g. Mira "Cookie ate my sandwich"); Media = 3-column grid of their own photo/art posts (no lightbox, to keep
    the 10 s). Tab state lives in the profile view, so switching never resets the timer; switching scrolls the
    tabs back under the sticky bar. Lint + tests check every fact answer (and NOT items, calc clue posts,
    photo images) is on the Posts tab.
