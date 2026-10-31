/*
 * Text for the noise cards (memes, shared news, art). Profiles copy a caption/headline from here
 * into their feed; `npm run lint:content` checks that every noise card uses one of these.
 *
 * Rules: friendly and funny, ≤ 8 words each, no insults, no real people, brands, outlets, politics,
 * religion or real news events. Outlets are made up. Headlines are bland and clearly invented.
 * Meme captions: "top | bottom" puts text at the top and bottom of the image; no "|" = bottom only.
 */

export const memeCaptions: Record<string, string[]> = {
  "meme-01.webp": ["me after one (1) lecture", "when the group chat says quick call", "rating your playlist | no"],
  "meme-02.webp": ["me after winning one (1) ranked match", "walking in late | but with confidence"],
  "meme-03.webp": ["when the book ends on a cliffhanger", "me checking if the tournament got cancelled", "when the wifi drops mid-game"],
  "meme-04.webp": ["capybara energy only today", "me in the sea | after one wave"],
  "meme-05.webp": ["when someone touches my cycle", "when someone says film is dead", "me guarding my snacks"],
  "meme-06.webp": ["the cake | at minute 29 of 30", "my plants when I forget to water"],
  "meme-07.webp": ["me at 2am | finding leftovers", "me finding snacks at midnight"],
  "meme-08.webp": ["me pretending to understand the assignment", "trust me | I watched one tutorial"],
  "meme-09.webp": ["monday morning | again", "running on vibes and zero sleep"],
};

export type Headline = { headline: string; source: string };

export const newsHeadlines: Record<string, Headline[]> = {
  "news-01.webp": [
    { headline: "Heavy rain expected over the weekend", source: "Metro Wire" },
    { headline: "Monsoon arrives two days early", source: "The Daily Ledger" },
  ],
  // news-02 (crowded platform, faces visible) is deliberately unused in profiles.
  "news-02.webp": [{ headline: "Extra trains added for the long weekend", source: "City Pulse" }],
  "news-03.webp": [
    { headline: "Stadium gets brighter new floodlights", source: "Court & Field" },
    { headline: "Local final sells out in an hour", source: "Court & Field" },
  ],
  "news-04.webp": [
    { headline: "Weather satellite reaches orbit safely", source: "Skyline Desk" },
    { headline: "Launch delayed by clouds, then lifts off", source: "Skyline Desk" },
  ],
  "news-05.webp": [
    { headline: "Mango season arrives early this year", source: "Weekend Bulletin" },
    { headline: "Vegetable prices dip after good harvest", source: "The Daily Ledger" },
  ],
  "news-06.webp": [{ headline: "New bridge opens to traffic", source: "City Pulse" }],
  "news-07.webp": [{ headline: "Solar farm now powers ten thousand homes", source: "The Daily Ledger" }],
  "news-08.webp": [
    { headline: "Robot learns to fold laundry, slowly", source: "Circuit Weekly" },
    { headline: "Lab robot passes its first test", source: "Circuit Weekly" },
  ],
  "news-09.webp": [{ headline: "Fireworks show draws record crowds", source: "Metro Wire" }],
};

export const artCaptions: Record<string, string[]> = {
  "art-01.webp": ["made a poster for the team", "riso print of my balcony"],
  "art-02.webp": ["pixel art of my street", "pixel city, finished at 3am"],
  "art-03.webp": ["new grip tape design?", "colour blocks, no thoughts"],
  "art-04.webp": ["wip from last night", "watercolour mountains, attempt three"],
  "art-05.webp": ["drew my first computer", "my laptop if it was cute"],
  "art-06.webp": ["tried something shiny", "chrome blob appreciation post"],
  "art-07.webp": ["doodled myself, as usual", "doodled while the record played"],
  "art-08.webp": ["painted the ride home", "sunset, but make it acrylic"],
  "art-09.webp": ["made this instead of sleeping", "paper fish for my wall"],
};
