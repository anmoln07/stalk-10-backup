/*
 * Look-alike wrong answers: near misses in spelling or sound (Biscuit -> Biscotti) or a very close
 * neighbour (Lilac -> Lavender). Keyed by the lower-cased right answer; a fact can add more with
 * `lookalikes`. Used on Medium and Hard (see content/rules.ts), and on Hard for "NOT" questions
 * (Pune on the profile -> Puri offered as the one that wasn't).
 *
 * Every look-alike must be clearly WRONG: never another name for the same thing
 * (no Mysore for Mysuru, no Filter kaapi for Filter coffee).
 */
export const lookalikes: Record<string, string[]> = {
  // places
  pune: ["Puri", "Pali"],
  goa: ["Gokarna"],
  udaipur: ["Udupi"],
  nagpur: ["Nagaur"],
  chandigarh: ["Chandrapur"],
  rishikesh: ["Ranikhet"],
  manali: ["Manipal"],
  kochi: ["Kohima"],
  munnar: ["Mussoorie"],
  indore: ["Imphal"],
  mysuru: ["Mangaluru"],
  darjeeling: ["Dalhousie"],
  coimbatore: ["Cooch Behar"],
  jaipur: ["Jabalpur", "Jodhpur"],
  ooty: ["Coonoor"],
  pondicherry: ["Pandharpur"],
  kodaikanal: ["Kodagu"],
  hampi: ["Hapur"],
  // pets
  biscuit: ["Biscotti", "Bisket"],
  toffee: ["Taffy", "Coffee"],
  pickle: ["Tickle"],
  mochi: ["Mocha"],
  peanut: ["Pebble"],
  ginger: ["Ginny"],
  bubbles: ["Bubbly"],
  captain: ["Cappy"],
  // food + drink
  "iced latte": ["Iced mocha"],
  "mango lassi": ["Mango shake"],
  "masala chai": ["Masala chaas"],
  "green tea": ["Lemon tea"],
  "filter coffee": ["Cold coffee"],
  momos: ["Modak"],
  "rajma chawal": ["Dal chawal"],
  samosa: ["Kachori"],
  // hobbies, music, gadgets, teams
  pottery: ["Poetry"],
  salsa: ["Samba"],
  calligraphy: ["Choreography"],
  origami: ["Kirigami"],
  chess: ["Checkers"],
  violin: ["Viola"],
  tabla: ["Tanpura"],
  guitar: ["Sitar"],
  headphones: ["Earphones"],
  "mechanical keyboard": ["Membrane keyboard"],
  "gaming chair": ["Gaming desk"],
  smartwatch: ["Smart speaker"],
  "e-reader": ["E-scooter"],
  "thunder owls": ["Thunder Hawks", "Wonder Owls"],
  "night wolves": ["Night Owls"],
  "golden geckos": ["Golden Geese"],
  // colours
  yellow: ["Mustard"],
  mint: ["Sage"],
  lilac: ["Lavender"],
  orange: ["Coral"],
  red: ["Maroon"],
  grey: ["Silver"],
};

export function lookalikesFor(answer: string, extra: string[] = []): string[] {
  return [...extra, ...(lookalikes[answer.trim().toLowerCase()] ?? [])];
}
