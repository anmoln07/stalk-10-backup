# Open questions and judgement calls

Nothing here blocks playing or deploying. Each item says what was chosen so Anmol can confirm or change it.

## Content

1. **14 profiles, not 12.** The plan says "12 (more is better)". All 14 pass the content lint.
2. **Profiles are 45–56 visible words** (counting name, handle, location, joined line and post times), below
   the plan's 60–80 "reading budget". Shorter reads better on a phone and still spreads 6 facts across bio,
   posts and a photo caption. The lint caps it at 80; posts can be lengthened if the game feels too easy.
3. **Mira's photo post differs from the worked example.** None of the 18 avatars shows sneakers, so the
   photo fact is "Painted my desk yellow" with the sunflower picture. The answer is still "Yellow".
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
