"use client";
import { useEffect, useState } from "react";
import { rankFor } from "@/content/ranks";
import { lessons } from "@/content/lessons";
import { RULES, QUESTIONS_PER_ROUND } from "@/content/rules";
import type { Difficulty, FactKind } from "@/content/types";
import { recordScore, nextLessonIndex } from "@/lib/storage";
import { useIdle, useKeys } from "@/lib/hooks";
import SiteNav, { pill } from "./SiteNav";
import Magnetic from "./Magnetic";
import Dot from "./Dot";

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
    <main className="felt relative min-h-[100dvh] overflow-x-clip px-4 pb-10 pt-24 text-white sm:px-8 sm:pt-28" data-testid="results" data-score={score}>
      {!kiosk && <SiteNav onHome={onTitle} right={<span className={pill}>Best <b className="text-lime-400" data-testid="best">{best ?? score}/{total}</b></span>} />}
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:pt-2">
        {/* LED scoreboard + rank + actions */}
        <div className="text-center lg:text-left">
          <div className="relative mx-auto inline-block overflow-hidden rounded-2xl border border-zinc-700 bg-black px-6 pb-4 pt-3 shadow-[inset_0_0_40px_rgba(0,0,0,.9),0_20px_60px_rgba(0,0,0,.6)] lg:mx-0">
            <div className="scanlines pointer-events-none absolute inset-0" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">You spotted</p>
            <p className="mt-1 flex items-baseline justify-center gap-3 font-anton leading-none lg:justify-start" aria-label={`${score} out of ${total}`} data-testid="score">
              <span className="led led-dots text-[30vw] text-lime-400 sm:text-[9.5rem]">{pad(shown)}</span>
              <span className="led text-[11vw] text-amber-400/80 sm:text-[3.5rem]">/{total}</span>
            </p>
            <div className="mt-2 flex justify-center gap-2 lg:justify-start" data-testid="round-scores">
              {review.map((r, i) => {
                const got = r.rows.filter((x) => x.right).length;
                return (
                  <span key={i} className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-400">
                    R{i + 1} <b className="led text-amber-300">{got}/{QUESTIONS_PER_ROUND}</b>
                  </span>
                );
              })}
            </div>
          </div>
          <h1 className="pop-in mt-6 font-black uppercase leading-[0.82] tracking-tighter" style={{ animationDelay: `${Math.min(score, 15) * 90}ms` }}>
            <span className="block font-mono text-[10px] font-normal tracking-[0.25em] text-zinc-500 sm:text-xs">Your rank</span>
            <span className="mt-2 block text-[12vw] sm:text-7xl" data-testid="rank">{rank.name}</span>
          </h1>
          <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
            <Dot size={52} animated />
            <p className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-2.5 text-left text-base font-semibold leading-snug sm:text-lg">{rank.line}</p>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Magnetic>
              <button
                type="button"
                onClick={onAgain}
                data-testid="again"
                className="group inline-flex min-h-[56px] items-center gap-3 rounded-full bg-lime-400 px-9 py-5 font-mono text-lg font-bold uppercase text-black outline-none transition-colors duration-200 hover:bg-white focus-visible:bg-white"
              >
                Play again
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={onTitle}
              data-testid="to-title"
              className="min-h-[48px] font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              [ back to title ]
            </button>
          </div>
        </div>

        {/* the case file: every question, grouped by round */}
        <div className="relative -rotate-[0.4deg] overflow-hidden bg-paper px-4 pb-4 pt-5 text-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,.7)] sm:px-7 sm:pt-7">
          <span className="stamp-in pointer-events-none absolute right-3 top-3 rotate-[-9deg] rounded border-[3px] border-red-600 px-2 py-0.5 font-mono text-sm font-black uppercase tracking-[0.2em] text-red-600/90 sm:right-6 sm:top-5 sm:text-lg" aria-hidden>
            Classified
          </span>
          <div className="border-b-2 border-zinc-900 pb-2 pr-28 sm:pr-40">
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">The evidence</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">{score} of {total} spotted</p>
          </div>
          {review.map((r, i) => (
            <section key={i} className="mt-3" data-testid="review-round">
              <p className="flex items-center justify-between gap-2 bg-zinc-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-paper sm:text-[11px]">
                <span className="truncate">Round {i + 1} · {RULES[r.difficulty].label} · @{r.handle}</span>
                <span className="shrink-0">{r.rows.filter((x) => x.right).length}/{r.rows.length}</span>
              </p>
              <ol>
                {r.rows.map((row, j) => (
                  <li key={j} className="flex gap-2 border-b border-zinc-900/15 py-1.5 last:border-0" data-testid="review-row">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-black ${row.right ? "bg-lime-400 text-black" : "bg-zinc-900 text-white"}`} aria-label={row.right ? "right" : "wrong"}>
                      {row.right ? "✓" : "✕"}
                    </span>
                    <p className="min-w-0 text-[13px] leading-snug">
                      <span className="text-zinc-600">{row.question}</span>{" "}
                      <b className="whitespace-nowrap">→ {row.answer}</b>
                      {!row.right && <span className="ml-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-zinc-500">{row.picked ? `you: ${row.picked}` : "time ran out"}</span>}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <p className="mt-3 border-t-2 border-zinc-900 pt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-zinc-700 sm:text-xs" data-testid="lesson">
            {lesson ?? " "}
          </p>
        </div>
      </div>
      <p className="mt-8 hidden text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600 [@media(pointer:fine)]:block">Enter = play again · Esc = title</p>
    </main>
  );
}
