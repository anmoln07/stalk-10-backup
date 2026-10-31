// Tune the thresholds here after playtesting. `min` = lowest score (out of 15) that earns this rank.
export type Rank = { min: number; name: string; line: string };

export const ranks: Rank[] = [
  { min: 15, name: "Memory Machine", line: "Fifteen for fifteen. Unreal." },
  { min: 12, name: "Sleuth", line: "Decoys didn't fool you." },
  { min: 9, name: "Sharp-eyed", line: "Not bad. Hard round got you?" },
  { min: 5, name: "Blinker", line: "Blinked and it was gone." },
  { min: 0, name: "Daydreamer", line: "That went fast, huh? Go again!" },
];

export function rankFor(score: number): Rank {
  return ranks.find((r) => score >= r.min) ?? ranks[ranks.length - 1];
}
