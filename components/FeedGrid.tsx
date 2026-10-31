"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { isNoise, type Card, type CardKind } from "@/content/types";
import TextCard from "./cards/TextCard";
import PhotoCard from "./cards/PhotoCard";
import MemeCard from "./cards/MemeCard";
import NewsCard from "./cards/NewsCard";
import ArtCard from "./cards/ArtCard";

// Rough relative heights, used only for the very first layout pass (then real heights are measured).
const WEIGHT: Record<CardKind, number> = { text: 1, photo: 2.3, meme: 2.1, news: 2.3, art: 2 };
type Col = 0 | 1;
// When the screen is too short, noise cards are hidden in this order (art first, meme last);
// within a kind, the one lowest in the feed goes first. Fact cards (text/photo) are never hidden.
const HIDE_RANK: Record<CardKind, number> = { art: 0, news: 1, meme: 2, text: 9, photo: 9 };

export function hideOrder(cards: Card[]): number[] {
  return cards
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => isNoise(c))
    .sort((a, b) => HIDE_RANK[a.c.kind] - HIDE_RANK[b.c.kind] || b.i - a.i)
    .map(({ i }) => i);
}

/** Greedy masonry: each card (in display order) goes to the currently shorter column. */
function greedy(items: { i: number; h: number }[]): Record<number, Col> {
  const tot = [0, 0];
  const out: Record<number, Col> = {};
  for (const { i, h } of items) {
    const k: Col = tot[0] <= tot[1] ? 0 : 1;
    out[i] = k;
    tot[k] += h;
  }
  return out;
}

function FeedCard({ card }: { card: Card }) {
  switch (card.kind) {
    case "text":
      return <TextCard card={card} />;
    case "photo":
      return <PhotoCard card={card} />;
    case "meme":
      return <MemeCard card={card} />;
    case "news":
      return <NewsCard card={card} />;
    case "art":
      return <ArtCard card={card} />;
  }
}

/**
 * Compact 2-column feed that must fit the space it's given with no scrolling.
 * After layout (before paint) it measures every card and re-balances the columns by real height;
 * then, while a column still overflows, it hides the next noise card from `hideOrder`.
 * Re-runs from scratch on resize. Fact cards (text/photo) are never hidden.
 */
export default function FeedGrid({ cards }: { cards: Card[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [assign, setAssign] = useState<Record<number, Col> | null>(null);
  const [resizes, setResizes] = useState(0);
  const order = useMemo(() => hideOrder(cards), [cards]);

  useEffect(() => {
    let t = 0;
    const on = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        setHidden([]);
        setAssign(null);
        setResizes((n) => n + 1);
      }, 120);
    };
    window.addEventListener("resize", on);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", on);
    };
  }, []);

  const visible = cards.map((c, i) => ({ c, i })).filter(({ i }) => !hidden.includes(i));
  const placement = assign ?? greedy(visible.map(({ c, i }) => ({ i, h: WEIGHT[c.kind] })));
  const cols: [typeof visible, typeof visible] = [[], []];
  for (const v of visible) cols[placement[v.i] ?? 0].push(v);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // 1. balance by measured heights (both columns have the same width, so heights don't move)
    const colEls = Array.from(el.querySelectorAll<HTMLElement>("[data-col]"));
    const gap = parseFloat(getComputedStyle(colEls[0]).rowGap) || 0;
    const heights = new Map(Array.from(el.querySelectorAll<HTMLElement>("[data-idx]")).map((n) => [Number(n.dataset.idx), n.offsetHeight]));
    const best = greedy(visible.map(({ i }) => ({ i, h: (heights.get(i) ?? 0) + gap })));
    if (visible.some(({ i }) => placement[i] !== best[i])) {
      setAssign(best);
      return;
    }
    // 2. still too tall: hide the next noise card and start over
    const limit = el.clientHeight + 1;
    if (!colEls.some((c) => c.offsetHeight > limit)) return;
    const next = order.find((i) => !hidden.includes(i));
    if (next !== undefined) {
      setAssign(null);
      setHidden((h) => [...h, next]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, assign, resizes, order]);

  return (
    <div
      ref={box}
      className="flex min-h-0 flex-1 items-start gap-2 overflow-hidden lg:gap-3"
      data-testid="feed"
      data-hidden-noise={hidden.length}
    >
      {cols.map((col, k) => (
        <div key={k} data-col={k} className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
          {col.map(({ c, i }) => (
            <div key={i} data-idx={i}>
              <FeedCard card={c} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
