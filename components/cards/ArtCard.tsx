import type { Card } from "@/content/types";
import { CardShell, CardImage } from "./CardShell";

export default function ArtCard({ card }: { card: Extract<Card, { kind: "art" }> }) {
  return (
    <CardShell kind="art" fact={false}>
      <CardImage file={card.image} ratio="aspect-[5/2] lg:aspect-[2/1]" />
      <div className="flex items-start gap-2 p-2.5 lg:p-3">
        <p className="min-w-0 flex-1 text-[13px] italic leading-snug text-zinc-300 sm:text-[14px] lg:text-[15px]">{card.caption}</p>
        <span className="shrink-0 pt-0.5 font-mono text-[11px] leading-none text-zinc-500 lg:text-xs">{card.time}</span>
      </div>
    </CardShell>
  );
}
