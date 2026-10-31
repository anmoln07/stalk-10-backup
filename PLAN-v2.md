# Stalk 10 — v2 plan (harder + X-style)

Status: planned, not built. Decided by Anmol on 2026-11-01.

## Keep
- 4 tap answers per question, 7 s per question (no tighter clock).
- Simple score: number right (no points, no speed bonus).

## Build
1. **X-style profile (copy SOCIALTRACE).** Reuse its `Profile`, `PostCard`, `FeedPostCard`, `Verified`, `Avatar`
   look: banner, avatar, name + verified tick, @handle, bio, location/joined, followers/following, tabs
   (Posts / Replies / Media), X-style posts with like/repost/view counts.
2. **Decoys.** Wrong answers may appear on the profile in a different role (friend's dog "Cookie" vs her cat
   "Biscuit"). Lint changes from "distractor never on profile" to "each decoy is tagged and is never the true
   answer to that question".
3. **Look-alike options.** Near-miss distractors (Biscuit / Biscotti / Bisket, Pune / Puri). New per-category
   look-alike pools.
4. **3 rounds per game.** Easy -> Medium -> Hard profile (more cards, more decoys each round). 5 questions per
   round, score shown as N / 15.
5. **Trickier questions.** "Which was NOT on the profile?", two-post inference ("How many days until the trip?"),
   and questions about what a photo shows (using the image `shows` tags).
6. **Shuffle the feed** order every play.
7. **Replies (light).** A few posts get 1–2 friend replies; used mainly for decoys, rarely for facts.
8. **SOCIALTRACE assets.** Its 50 avatars and 44 feed images (memes, news, everyday photos) for more noise;
   CLASSIFIED stamp / case-board felt / LED scoreboard for results.

## Also decided
- **Look time:** 10 s every round (matches the name).
- **Scrolling allowed** during the look: the X feed is a normal vertical list, and racing to scroll is part of
  the challenge. This replaces the old "fits one screen, no scroll" rule (and its e2e check).
