import type { Card } from "@/content/types";
import { CardShell, CardMeta, bodyText } from "./CardShell";

export default function TextCard({ card }: { card: Extract<Card, { kind: "text" }> }) {
  return (
    <CardShell kind="text" fact>
      <div className="space-y-2 p-2.5 lg:p-3">
        <p className={bodyText}>{card.text}</p>
        <CardMeta time={card.time} likes={card.likes} replies={card.replies} />
      </div>
    </CardShell>
  );
}
