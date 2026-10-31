import type { Card } from "@/content/types";
import { CardShell, CardImage } from "./CardShell";

/** A shared link card: picture, made-up outlet, fictional headline. */
export default function NewsCard({ card }: { card: Extract<Card, { kind: "news" }> }) {
  return (
    <CardShell kind="news" fact={false}>
      <CardImage file={card.image} ratio="aspect-[5/2] lg:aspect-[2/1]" />
      <div className="space-y-1.5 p-2.5 lg:p-3">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 lg:text-[11px]">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
          </svg>
          {card.source}
          <span className="ml-auto normal-case tracking-normal">{card.time}</span>
        </p>
        <p className="text-[13px] font-bold leading-tight text-zinc-200 sm:text-[14px] lg:text-[15px]">{card.headline}</p>
      </div>
    </CardShell>
  );
}
