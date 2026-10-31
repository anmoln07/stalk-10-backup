export type Category =
  | "pet"
  | "city"
  | "food"
  | "drink"
  | "hobby"
  | "trip"
  | "colour"
  | "team"
  | "gadget"
  | "music";

export type Fact = {
  id: string;
  category: Category; // picks the distractor pool
  question: string; // e.g. "What is Mira's cat called?"
  answer: string; // must appear in the profile text (case-insensitive, whole words)
  where: "bio" | "post" | "photo"; // "bio" = bio or the location meta row
};

export type Post = { time: string; text: string; photo?: string };

export type Profile = {
  id: string;
  name: string; // obviously invented
  handle: string;
  avatar: string; // file in public/pfp
  bio: string;
  location: string;
  joined: string; // "Joined March 2023"
  banner: string; // CSS background for the banner strip
  posts: Post[];
  facts: Fact[]; // exactly 6
};
