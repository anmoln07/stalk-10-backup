"use client";
import { useEffect, useState } from "react";
import { rankFor } from "@/content/ranks";
import { lessons } from "@/content/lessons";
import { recordScore, nextLessonIndex } from "@/lib/storage";
import { useIdle, useKeys } from "@/lib/hooks";
import SiteNav from "./SiteNav";
import Magnetic from "./Magnetic";
import Dot from "./Dot";

const IDLE_MS = 30_000;

export default function Results({
  score,
  total,
  kiosk,
  seed,
  onAgain,
  onTitle,
}: {
  score: number;
  total: number;
  kiosk: boolean;
  seed: number;
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
    <main
      className="relative flex min-h-[100dvh] flex-col px-5 pb-8 pt-20 sm:px-10 sm:pt-28"
      data-testid="results"
      data-score={score}
    >
      {!kiosk && <SiteNav onHome={onTitle} />}
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">You spotted</p>
          <p className="mt-2 font-anton leading-none tracking-tight sm:mt-3" aria-label={`${score} out of ${total}`} data-testid="score">
            <span className="text-[34vw] text-lime-400 sm:text-[12rem] lg:text-[15rem]">{shown}</span>
            <span className="text-[17vw] text-zinc-600 sm:text-[6rem] lg:text-[7.5rem]"> / {total}</span>
          </p>
          <h1 className="pop-in mt-3 font-black uppercase leading-[0.82] tracking-tighter sm:mt-5" style={{ animationDelay: `${score * 160}ms` }}>
            <span className="block font-mono text-[10px] font-normal tracking-[0.25em] text-zinc-500 sm:text-xs">Your rank</span>
            <span className="mt-2 block text-[13vw] sm:text-7xl" data-testid="rank">
              {rank.name}
            </span>
          </h1>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex items-end gap-3">
            <Dot size={72} animated />
            <p className="relative mb-6 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-lg font-semibold leading-snug sm:text-xl">
              {rank.line}
            </p>
          </div>
          <div className="-rotate-[0.6deg] rounded-2xl bg-paper px-5 py-4 text-zinc-900 shadow-[6px_6px_0_#a3e635] sm:px-6 sm:py-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">The lesson</p>
            <p className="mt-1.5 text-[17px] font-medium leading-snug sm:text-lg" data-testid="lesson">
              {lesson ?? " "}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-start">
            <Magnetic>
              <button
                type="button"
                onClick={onAgain}
                data-testid="again"
                autoFocus
                className="min-h-[64px] rounded-full bg-lime-400 px-9 py-5 font-mono text-lg font-bold uppercase tracking-wider text-black transition-colors duration-200 hover:bg-white"
              >
                Play again
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={onTitle}
              data-testid="to-title"
              className="min-h-[56px] rounded-full border border-white/15 px-6 font-mono text-sm font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-white hover:text-white"
            >
              Back to title
            </button>
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs lg:text-left">
            Best this session: <span className="text-fg" data-testid="best">{best ?? score} / {total}</span>
            <span className="hidden [@media(pointer:fine)]:inline"> · Enter = again · Esc = title</span>
          </p>
        </div>
      </div>
      <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-700" aria-hidden>
        run #{seed}
      </p>
    </main>
  );
}
