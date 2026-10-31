import type { Card } from "@/content/types";
import { CardShell, CardImage, CardMeta } from "./CardShell";

/** Classic meme: white Anton caption with a black outline, overlaid in code. "top | bottom" splits it. */
export default function MemeCard({ card }: { card: Extract<Card, { kind: "meme" }> }) {
  const parts = card.caption.split("|").map((s) => s.trim());
  const [top, bottom] = parts.length > 1 ? parts : [null, parts[0]];
  const cls =
    "meme-text absolute inset-x-1.5 text-center font-anton uppercase leading-[1.02] text-white text-[17px] sm:text-[19px] lg:text-[22px]";
  return (
    <CardShell kind="meme" fact={false}>
      <CardImage file={card.image} ratio="aspect-[4/3]">
        {top && <p className={`${cls} top-1.5`}>{top}</p>}
        {bottom && <p className={`${cls} bottom-1.5`}>{bottom}</p>}
      </CardImage>
      <div className="px-2.5 py-1.5 lg:px-3 lg:py-2">
        <CardMeta time={card.time} label="meme" />
      </div>
    </CardShell>
  );
}
