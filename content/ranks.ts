// Tune the thresholds here after playtesting. `min` = lowest score that earns this rank.
export type Rank = { min: number; name: string; line: string };

export const ranks: Rank[] = [
  { min: 5, name: "Memory Machine", line: "Five for five. Wow." },
  { min: 4, name: "Sleuth", line: "You don't miss much." },
  { min: 3, name: "Sharp-eyed", line: "Not bad at all." },
  { min: 2, name: "Blinker", line: "Half-blinked and it was gone." },
  { min: 0, name: "Daydreamer", line: "That went fast, huh? Go again!" },
];

export function rankFor(score: number): Rank {
  return ranks.find((r) => score >= r.min) ?? ranks[ranks.length - 1];
}
