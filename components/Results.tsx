"use client";
import { useEffect, useState } from "react";
import { rankFor } from "@/content/ranks";
import { lessons } from "@/content/lessons";
import { RULES, QUESTIONS_PER_ROUND } from "@/content/rules";
import type { Difficulty, FactKind } from "@/content/types";
import { recordScore, nextLessonIndex } from "@/lib/storage";
import { useIdle, useKeys } from "@/lib/hooks";

const IDLE_MS = 30_000;

export type ReviewRow = { question: string; answer: string; kind: FactKind; picked: string | null; right: boolean };
export type Review = { difficulty: Difficulty; name: string; handle: string; rows: ReviewRow[] };

const pad = (n: number) => String(n).padStart(2, "0");

export default function Results({
  score,
  total,
  kiosk,
  review,
  onAgain,
  onTitle,
}: {
  score: number;
  total: number;
  kiosk: boolean;
  review: Review[];
  onAgain: () => void;
  onTitle: () => void;
}) {
  const rank = rankFor(score);
  const [shown, setShown] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);

  useEffect(() => {
    setBest(recordScore(score));
    setLesson(lessons[nextLessonIndex(lessons.length)]);
  }, [score]);

  // score ticks up
  useEffect(() => {
    let reduce = false;
    try {
      reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    if (reduce || score === 0) {
      setShown(score);
      return;
    }
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setShown(n);
      if (n >= score) window.clearInterval(id);
    }, 90);
    return () => window.clearInterval(id);
  }, [score]);

  useIdle(true, IDLE_MS, onTitle);

  useKeys((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAgain();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onTitle();
    }
  });

  return (
    <main className="os-screen relative min-h-[100dvh] overflow-x-clip px-4 pb-10 pt-16 font-inter sm:px-8 sm:pt-20" data-testid="results" data-score={score}>
      {!kiosk && (
        <nav className="fixed inset-x-0 top-0 z-50 flex items-start justify-between text-[15px] sm:text-[16px]">
          <button type="button" onClick={onTitle} className="bg-desk px-2 py-1 font-medium text-black">Stalk 10</button>
          <span className="bg-white px-2 py-1 font-medium">Best <b data-testid="best">{best ?? score}/{total}</b></span>
        </nav>
      )}
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        {/* Score.app + rank + actions */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="os-win w-full max-w-[460px]">
            <div className="os-title"><span className="os-title-text">Score.app</span></div>
            <div className="os-body bg-white px-5 pb-5 pt-3">
              <p className="font-plex text-[12px] text-black/55">You spotted</p>
              <p className="mt-1 flex items-baseline gap-3 font-pixel font-semibold leading-none" aria-label={`${score} out of ${total}`} data-testid="score">
                <span className="text-[30vw] sm:text-[9rem]">{pad(shown)}</span>
                <span className="text-[11vw] text-black/35 sm:text-[3.4rem]">/{total}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2" data-testid="round-scores">
                {review.map((r, i) => {
                  const got = r.rows.filter((x) => x.right).length;
                  return (
                    <span key={i} className="border-[1.5px] border-black bg-[#ededed] px-2 py-0.5 font-pixel text-[14px]">
                      R{i + 1} <b className={got === QUESTIONS_PER_ROUND ? "bg-desk px-1" : ""}>{got}/{QUESTIONS_PER_ROUND}</b>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <h1 className="pop-in mt-8 text-center lg:text-left" style={{ animationDelay: `${Math.min(score, 15) * 90}ms` }}>
            <span className="block font-plex text-[12px] text-black/55">Your rank</span>
            <span className="mt-1 block text-[13vw] font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl" data-testid="rank">{rank.name}</span>
          </h1>
          <div className="os-win mt-5 w-full max-w-[460px]">
            <div className="os-title"><span className="os-title-text">Rank.alert</span></div>
            <div className="os-body flex items-center gap-3 bg-white p-3">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center border-2 border-black font-pixel text-[20px]">!</span>
              <p className="text-[17px] font-medium leading-snug">{rank.line}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-center">
            <button
              type="button"
              onClick={onAgain}
              data-testid="again"
              className="again-btn group inline-flex h-[72px] items-center gap-3 rounded-full bg-[#0b0b0b] px-10 font-pixel text-[30px] font-semibold uppercase text-white outline-none"
            >
              Play again
              <span aria-hidden className="text-desk transition-transform group-hover:translate-x-1">▶</span>
            </button>
            <button type="button" onClick={onTitle} data-testid="to-title" className="ts-link min-h-[48px] text-[22px]">
              Back to title
            </button>
          </div>
        </div>

        {/* Evidence.db: every question, grouped by round */}
        <div className="os-win relative">
          <div className="os-title"><span className="os-title-text">Evidence.db · {score} of {total} spotted</span></div>
          <div className="os-body bg-white px-4 pb-4 pt-3 sm:px-5">
            <span className="stamp-in pointer-events-none absolute right-3 top-8 rotate-[-9deg] border-[3px] border-black bg-desk px-2 py-0.5 font-pixel text-[16px] shadow-[3px_3px_0_#000] sm:text-[20px]" aria-hidden>
              Case closed
            </span>
            <h2 className="pr-32 text-[clamp(28px,3vw,40px)] font-medium tracking-[-0.045em]">The evidence</h2>
            {review.map((r, i) => (
              <section key={i} className="mt-3" data-testid="review-round">
                <p className="flex items-center justify-between gap-2 bg-black px-2 py-1 font-pixel text-[13px] text-white">
                  <span className="truncate">Round {i + 1} · {RULES[r.difficulty].label} · @{r.handle}</span>
                  <span className="shrink-0">{r.rows.filter((x) => x.right).length}/{r.rows.length}</span>
                </p>
                <ol>
                  {r.rows.map((row, j) => (
                    <li key={j} className="flex gap-2 border-b border-black/15 py-1.5 last:border-0" data-testid="review-row">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border-[1.5px] border-black font-pixel text-[11px] ${row.right ? "bg-desk text-black" : "bg-black text-white"}`} aria-label={row.right ? "right" : "wrong"}>
                        {row.right ? "✓" : "✕"}
                      </span>
                      <p className="min-w-0 text-[14px] leading-snug">
                        <span className="text-black/60">{row.question}</span>{" "}
                        <b className="whitespace-nowrap font-semibold">→ {row.answer}</b>
                        {!row.right && <span className="ml-1.5 whitespace-nowrap font-plex text-[11px] text-black/50">{row.picked ? `you: ${row.picked}` : "time ran out"}</span>}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            <p className="mt-3 border-t-[1.5px] border-black pt-3 font-plex text-[12px] leading-relaxed text-black/70" data-testid="lesson">
              {lesson ?? " "}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-8 hidden text-center font-plex text-[11px] text-black/50 [@media(pointer:fine)]:block">Enter = play again · Esc = title</p>
    </main>
  );
}
