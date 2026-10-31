import type { Card } from "@/content/types";
import { CardShell, CardImage, CardMeta, bodyText } from "./CardShell";

export default function PhotoCard({ card }: { card: Extract<Card, { kind: "photo" }> }) {
  return (
    <CardShell kind="photo" fact>
      <CardImage file={card.image} ratio="aspect-[2/1]" />
      <div className="space-y-2 p-2.5 lg:p-3">
        <p className={bodyText}>{card.caption}</p>
        <CardMeta time={card.time} likes={card.likes} replies={card.replies} />
      </div>
    </CardShell>
  );
}
