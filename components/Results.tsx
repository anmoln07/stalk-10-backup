"use client";
import { useEffect, useState } from "react";
import { rankFor } from "@/content/ranks";
import { lessons } from "@/content/lessons";
import { recordScore, nextLessonIndex } from "@/lib/storage";
import { useIdle, useKeys } from "@/lib/hooks";
import SiteNav, { pill } from "./SiteNav";
import Magnetic from "./Magnetic";
import Dot from "./Dot";

const IDLE_MS = 30_000;

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
  review: { question: string; answer: string; picked: string | null; right: boolean }[];
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
    }, 160);
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
    <main className="relative min-h-[100dvh] bg-ink px-4 pb-10 pt-24 text-white sm:px-8 sm:pt-28" data-testid="results" data-score={score}>
      {!kiosk && <SiteNav onHome={onTitle} right={<span className={pill}>Best <b className="text-lime-400" data-testid="best">{best ?? score}/{total}</b></span>} />}
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pt-6">
        {/* score + rank + actions */}
        <div className="text-center lg:text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">You spotted</p>
          <p className="mt-2 font-anton leading-none tracking-tight" aria-label={`${score} out of ${total}`} data-testid="score">
            <span className="text-[30vw] text-lime-400 sm:text-[11rem] lg:text-[13rem]">{shown}</span>
            <span className="text-[14vw] text-zinc-600 sm:text-[5rem] lg:text-[6rem]"> / {total}</span>
          </p>
          <h1 className="pop-in mt-2 font-black uppercase leading-[0.82] tracking-tighter" style={{ animationDelay: `${score * 160}ms` }}>
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

        {/* what was on the profile: the lesson, made concrete */}
        <div className="-rotate-[0.4deg] bg-paper px-5 pb-5 pt-6 text-zinc-900 shadow-[0_30px_80px_rgba(0,0,0,.7)] sm:px-8 sm:pt-8">
          <div className="flex items-end justify-between gap-3 border-b-2 border-zinc-900 pb-3">
            <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-4xl">The evidence</h2>
            <p className="pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">{score} of {total} spotted</p>
          </div>
          <ol>
            {review.map((r, i) => (
              <li key={i} className="flex gap-3 border-b border-zinc-900/15 py-3 last:border-0" data-testid="review-row">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-black ${r.right ? "bg-lime-400 text-black" : "bg-zinc-900 text-white"}`} aria-label={r.right ? "right" : "wrong"}>
                  {r.right ? "✓" : "✕"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-zinc-600">{r.question}</p>
                  <p className="mt-0.5 font-bold leading-snug">
                    {r.answer}
                    {!r.right && <span className="ml-2 font-mono text-[11px] font-normal uppercase tracking-wider text-zinc-500">{r.picked ? `you said ${r.picked}` : "time ran out"}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t-2 border-zinc-900 pt-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em] text-zinc-700 sm:text-xs" data-testid="lesson">
            {lesson ?? " "}
          </p>
        </div>
      </div>
      <p className="mt-8 hidden text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600 [@media(pointer:fine)]:block">Enter = play again · Esc = title</p>
    </main>
  );
}
