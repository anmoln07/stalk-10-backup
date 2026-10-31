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
  // from SOCIALTRACE
  "st-meme-cat.webp": ["me hearing my name in the group chat", "when mom says there's food at home"],
  "st-meme-dog.webp": ["me when the food finally arrives", "my dog when I say walk"],
  "st-meme-frog.webp": ["me waiting for the weekend", "sitting here | judging your playlist"],
  "st-meme-goat.webp": ["me after one cup of chai", "climbed up here | no plan to get down"],
  "st-meme-possum.webp": ["me hanging on | until friday", "just hanging out, as usual"],
  "st-meme-raccoon.webp": ["me raiding the fridge at 3am", "found my old notes | in here"],
  "st-meme-seagull.webp": ["me stealing your fries | no regrets", "when someone opens a snack nearby"],
  "st-meme-trolley.webp": ["my plans for this weekend", "me after one (1) monday"],
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
  // from SOCIALTRACE
  "st-news-cones.webp": [{ headline: "Ring road repairs start this week", source: "Metro Wire" }],
  "st-news-envelopes.webp": [{ headline: "Handwritten letters are back in fashion", source: "Weekend Bulletin" }],
  "st-news-flood.webp": [{ headline: "Riverside walk closed after heavy rain", source: "City Pulse" }],
  "st-news-hurling.webp": [{ headline: "Grassroots league gets three new fields", source: "Court & Field" }],
  "st-news-pumpkins.webp": [{ headline: "Pumpkin harvest breaks local record", source: "Weekend Bulletin" }],
  "st-news-screen.webp": [{ headline: "Open-air movie night this Saturday", source: "City Pulse" }],
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
  // from SOCIALTRACE
  "st-art-alley.webp": ["rainy lane, painted at midnight", "the walk home, but moodier"],
  "st-art-chai.webp": ["self portrait, chai edition", "drew my morning routine"],
  "st-art-streetcar.webp": ["the old tram, from memory"],
  "st-art-terraces.webp": ["painted a town I dreamt of"],
};
