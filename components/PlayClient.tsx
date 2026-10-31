"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { profiles } from "@/content/profiles";
import { distractors } from "@/content/distractors";
import { buildRun, type Run } from "@/lib/buildRun";
import { drawFromBag, loadBag, saveBag, type BagState } from "@/lib/bag";
import { mulberry32, randomSeed } from "@/lib/rng";
import { useKeys, useNow } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";
import ProfileHeader from "./ProfileHeader";
import FeedGrid from "./FeedGrid";
import { feedSrc, profileImages } from "@/lib/images";
import Ring from "./Ring";
import Timer from "./Timer";
import Question from "./Question";
import Results from "./Results";

const READY_MS = 3000;
const LEAVE_MS = 600;
const QUESTION_MS = 7000;
const FEEDBACK_MS = 700;

type Phase = "ready" | "look" | "leaving" | "quiz" | "results";

export default function PlayClient({ params, onTitle }: { params: GameParams; onTitle: () => void }) {
  const lookMs = params.lookSeconds * 1000;

  // ---- run setup ----
  const runIndex = useRef(0);
  const memBag = useRef<BagState | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [seed, setSeed] = useState(0);

  const newRun = useCallback(() => {
    const s = params.seed !== null ? params.seed + runIndex.current * 7919 : randomSeed();
    runIndex.current++;
    const rng = mulberry32(s);
    const ids = profiles.map((p) => p.id);
    // With ?seed the run is fully reproducible, so the bag lives in memory only.
    const saved = params.seed !== null ? memBag.current : loadBag();
    const drawn = drawFromBag(saved, ids, rng);
    if (params.seed !== null) memBag.current = drawn.state;
    else saveBag(drawn.state);
    // ?profile=id previews one profile every run (for authors); the bag is still advanced.
    const profile = profiles.find((p) => p.id === (params.profile ?? drawn.id)) ?? profiles.find((p) => p.id === drawn.id)!;
    // Warm the image cache during the 3-2-1 so the profile appears complete.
    for (const src of [`/pfp/${profile.avatar}`, ...profileImages(profile).map(feedSrc)]) {
      const img = new Image();
      img.src = src;
    }
    setSeed(s);
    setRun(buildRun(profile, rng, distractors));
  }, [params.seed, params.profile]);

  // ---- phase machine ----
  const [phase, setPhase] = useState<Phase>("ready");
  const [phaseStart, setPhaseStart] = useState(0);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const go = useCallback((p: Phase) => {
    setPhase(p);
    setPhaseStart(performance.now());
  }, []);

  const start = useCallback(() => {
    newRun();
    setQi(0);
    setPicked(null);
    setResults([]);
    go("ready");
  }, [newRun, go]);

  useEffect(() => {
    start();
  }, [start]);

  // timed transitions
  useEffect(() => {
    if (!run) return;
    let t: number | undefined;
    if (phase === "ready") t = window.setTimeout(() => go("look"), READY_MS);
    if (phase === "look") t = window.setTimeout(() => go("leaving"), lookMs);
    if (phase === "leaving") t = window.setTimeout(() => go("quiz"), LEAVE_MS);
    if (phase === "quiz" && picked === null) t = window.setTimeout(() => lock(-1), QUESTION_MS);
    if (phase === "quiz" && picked !== null) {
      t = window.setTimeout(() => {
        if (qi + 1 >= run.questions.length) go("results");
        else {
          setQi(qi + 1);
          setPicked(null);
          setPhaseStart(performance.now());
        }
      }, FEEDBACK_MS);
    }
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phaseStart, picked, run]);

  const lock = (i: number) => {
    if (!run || phase !== "quiz" || picked !== null) return;
    setPicked(i);
    setResults((r) => [...r, i === run.questions[qi].correctIndex]);
  };

  const toTitle = onTitle;

  useKeys((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      toTitle();
      return;
    }
    if (phase === "quiz" && picked === null) {
      const n = "1234".indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
      if (n >= 0 && n < 4) {
        e.preventDefault();
        lock(n);
      }
    }
  });

  const now = useNow(phase === "ready" || phase === "look");
  const [ringSize, setRingSize] = useState(56);
  useEffect(() => {
    try {
      setRingSize(matchMedia("(min-width: 1024px)").matches ? 76 : 56);
    } catch {}
  }, []);
  const elapsed = Math.max(0, now - phaseStart);

  if (!run) return <main className="min-h-[100dvh] bg-ink" />;

  if (phase === "results") {
    const score = results.filter(Boolean).length;
    return (
      <Results
        key={seed}
        score={score}
        total={run.questions.length}
        kiosk={params.kiosk}
        seed={seed}
        onAgain={start}
        onTitle={toTitle}
      />
    );
  }

  return (
    <main
      className="relative flex h-[100dvh] flex-col overflow-hidden px-4 pb-3 pt-3 sm:px-8 sm:pb-8 sm:pt-6"
      data-testid="play"
      data-phase={phase}
      data-profile-id={run.profile.id}
      data-seed={seed}
    >
      {phase === "ready" && <Ready count={Math.max(1, 3 - Math.floor(elapsed / 1000))} lookSeconds={params.lookSeconds} />}

      {(phase === "look" || phase === "leaving") && (
        <div
          className={`mx-auto flex min-h-0 w-full max-w-[1000px] flex-1 flex-col gap-2 lg:flex-row lg:gap-6 ${phase === "leaving" ? "look-out" : "rise-in"}`}
          data-testid="profile"
          data-profile-id={run.profile.id}
        >
          <ProfileHeader
            profile={run.profile}
            ring={<Ring remaining={phase === "look" ? lookMs - elapsed : 0} total={lookMs} size={ringSize} />}
          />
          <FeedGrid cards={run.profile.feed} />
        </div>
      )}

      {phase === "quiz" && (
        <QuizScreen run={run} qi={qi} picked={picked} onPick={lock} />
      )}

      {!params.kiosk && phase !== "quiz" && (
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 hidden text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600 [@media(pointer:fine)]:block">
          Esc = back to title
        </p>
      )}
    </main>
  );
}

function Ready({ count, lookSeconds }: { count: number; lookSeconds: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" data-testid="ready">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 sm:text-sm">Get ready</p>
      <p key={count} className="pop-in mt-2 font-anton text-[44vw] leading-[0.85] text-lime-400 sm:text-[16rem]">
        {count}
      </p>
      <p className="mt-6 max-w-sm text-lg leading-snug text-zinc-300 sm:text-xl">
        A profile appears for <b className="text-fg">{lookSeconds} seconds</b>. Remember everything you can.
      </p>
    </div>
  );
}

function QuizScreen({ run, qi, picked, onPick }: { run: Run; qi: number; picked: number | null; onPick: (i: number) => void }) {
  const q = run.questions[qi];
  const verdict = picked === null ? null : picked === q.correctIndex ? "right" : picked === -1 ? "timeout" : "wrong";
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col" data-testid="quiz" data-q={qi}>
      {verdict && (
        <div
          key={`f${qi}`}
          className={`flash pointer-events-none fixed inset-0 z-0 ${verdict === "right" ? "bg-lime-400" : "bg-red-500"}`}
          aria-hidden
        />
      )}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src={`/pfp/${run.profile.avatar}`} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover blur-[1.5px]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">
            About @{run.profile.handle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {run.questions.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-5 rounded-full sm:w-7 ${i < qi ? "bg-lime-400/60" : i === qi ? "bg-lime-400" : "bg-white/15"}`}
              />
            ))}
          </div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg sm:text-sm" data-testid="progress">
            {qi + 1}/{run.questions.length}
          </p>
        </div>
      </div>
      <div className="relative z-10 mt-3 sm:mt-5">
        <Timer ms={QUESTION_MS} paused={picked !== null} runKey={qi} />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Question key={qi} q={q} picked={picked} onPick={onPick} />
        <p className="mt-3 h-6 text-center font-mono text-sm font-bold uppercase tracking-[0.2em]" aria-live="assertive" data-testid="verdict">
          {verdict === "right" && <span className="text-lime-400">Spotted it!</span>}
          {verdict === "wrong" && <span className="text-red-400">Nope: {q.answer}</span>}
          {verdict === "timeout" && <span className="text-amber-400">Time&apos;s up: {q.answer}</span>}
        </p>
      </div>
    </div>
  );
}
