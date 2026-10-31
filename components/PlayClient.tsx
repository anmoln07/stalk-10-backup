"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { profiles } from "@/content/profiles";
import { distractors } from "@/content/distractors";
import { RULES, ROUNDS, QUESTIONS_PER_ROUND, TOTAL_QUESTIONS } from "@/content/rules";
import { buildRun, type Run } from "@/lib/buildRun";
import { drawProfiles, loadBags, saveBags, type Bags } from "@/lib/bag";
import { mulberry32, randomSeed } from "@/lib/rng";
import { useKeys, useNow } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";
import { feedSrc, profileImages } from "@/lib/images";
import { friend, pfpSrc, repostedFrom } from "@/lib/accounts";
import { threadOf } from "@/lib/text";
import LookScreen from "./LookScreen";
import Timer from "./Timer";
import Question from "./Question";
import Results, { type Review } from "./Results";

const READY_MS = 3000;
const BETWEEN_MS = 3600;
const LEAVE_MS = 600;
const QUESTION_MS = 7000;
const FEEDBACK_MS = 700;

type Phase = "ready" | "look" | "leaving" | "quiz" | "between" | "results";

/** Warm the image cache for a run (profile, feed, friends' avatars) so every round appears complete. */
function warm(run: Run) {
  const files = new Set<string>();
  for (const r of run.rounds) {
    const p = r.profile;
    files.add(pfpSrc(p.avatar));
    profileImages(p).forEach((f) => files.add(feedSrc(f)));
    for (const c of p.feed) {
      const from = repostedFrom(c);
      if (from) files.add(pfpSrc(from.avatar));
      threadOf(c).forEach((t) => files.add(pfpSrc(friend(t.by).avatar)));
    }
  }
  files.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export default function PlayClient({ params, onTitle }: { params: GameParams; onTitle: () => void }) {
  const lookMs = params.lookSeconds * 1000;

  // ---- run setup ----
  const runIndex = useRef(0);
  const memBags = useRef<Bags | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [seed, setSeed] = useState(0);

  const newRun = useCallback(() => {
    const s = params.seed !== null ? params.seed + runIndex.current * 7919 : randomSeed();
    runIndex.current++;
    const rng = mulberry32(s);
    // With ?seed the run is fully reproducible, so the bags live in memory only.
    const saved = params.seed !== null ? memBags.current : loadBags();
    const drawn = drawProfiles(saved, profiles, rng, params.profile);
    if (params.seed !== null) memBags.current = drawn.bags;
    else saveBags(drawn.bags);
    const r = buildRun(drawn.chosen, rng, distractors);
    warm(r);
    setSeed(s);
    setRun(r);
  }, [params.seed, params.profile]);

  // ---- phase machine ----
  const [phase, setPhase] = useState<Phase>("ready");
  const [phaseStart, setPhaseStart] = useState(0);
  const [ri, setRi] = useState(0); // round index
  const [qi, setQi] = useState(0); // question index within the round
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ pick: number; right: boolean }[]>([]); // flat, 15 long at the end

  const go = useCallback((p: Phase) => {
    setPhase(p);
    setPhaseStart(performance.now());
  }, []);

  const start = useCallback(() => {
    newRun();
    setRi(0);
    setQi(0);
    setPicked(null);
    setAnswers([]);
    go("ready");
  }, [newRun, go]);

  useEffect(() => {
    start();
  }, [start]);

  // a new screen always starts at the top (the look screen scrolls)
  useEffect(() => {
    if (phase !== "leaving") window.scrollTo(0, 0);
  }, [phase, ri]);

  const round = run?.rounds[ri];

  // timed transitions
  useEffect(() => {
    if (!run || !round) return;
    let t: number | undefined;
    if (phase === "ready") t = window.setTimeout(() => go("look"), READY_MS);
    if (phase === "between") t = window.setTimeout(() => go("look"), BETWEEN_MS);
    if (phase === "look") t = window.setTimeout(() => go("leaving"), lookMs);
    if (phase === "leaving") t = window.setTimeout(() => go("quiz"), LEAVE_MS);
    if (phase === "quiz" && picked === null) t = window.setTimeout(() => lock(-1), QUESTION_MS);
    if (phase === "quiz" && picked !== null) {
      t = window.setTimeout(() => {
        setPicked(null);
        if (qi + 1 < round.questions.length) {
          setQi(qi + 1);
          setPhaseStart(performance.now());
        } else if (ri + 1 < run.rounds.length) {
          setRi(ri + 1);
          setQi(0);
          go("between");
        } else go("results");
      }, FEEDBACK_MS);
    }
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phaseStart, picked, run]);

  const lock = (i: number) => {
    if (!round || phase !== "quiz" || picked !== null) return;
    setPicked(i);
    setAnswers((a) => [...a, { pick: i, right: i === round.questions[qi].correctIndex }]);
  };

  useKeys((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onTitle();
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

  const now = useNow(phase === "ready" || phase === "look" || phase === "between");
  const elapsed = Math.max(0, now - phaseStart);

  if (!run || !round) return <main className="min-h-[100dvh] bg-ink" />;

  if (phase === "results") {
    const review: Review[] = run.rounds.map((r, k) => ({
      difficulty: r.difficulty,
      name: r.profile.name,
      handle: r.profile.handle,
      rows: r.questions.map((q, j) => {
        const a = answers[k * QUESTIONS_PER_ROUND + j];
        return { question: q.question, answer: q.answer, kind: q.kind, picked: a && a.pick >= 0 ? q.options[a.pick] : null, right: !!a?.right };
      }),
    }));
    return (
      <Results
        key={seed}
        score={answers.filter((a) => a.right).length}
        total={TOTAL_QUESTIONS}
        kiosk={params.kiosk}
        review={review}
        onAgain={start}
        onTitle={onTitle}
      />
    );
  }

  const common = { "data-phase": phase, "data-round": ri, "data-profile-id": round.profile.id, "data-seed": seed };

  if (phase === "look" || phase === "leaving") {
    return (
      <div {...common} data-testid="play" className="relative bg-black">
        <LookScreen round={round} remaining={phase === "look" ? lookMs - elapsed : 0} total={lookMs} leaving={phase === "leaving"} />
      </div>
    );
  }

  return (
    <main {...common} data-testid="play" className="relative flex h-[100dvh] flex-col overflow-hidden px-4 pb-3 pt-3 sm:px-8 sm:pb-8 sm:pt-6">
      {phase === "ready" && <Ready count={Math.max(1, 3 - Math.floor(elapsed / 1000))} lookSeconds={params.lookSeconds} />}
      {phase === "between" && (
        <Between
          ri={ri}
          last={answers.slice((ri - 1) * QUESTIONS_PER_ROUND, ri * QUESTIONS_PER_ROUND).map((a) => a.right)}
          total={answers.filter((a) => a.right).length}
          count={Math.max(1, Math.ceil((BETWEEN_MS - elapsed) / 1000))}
        />
      )}
      {phase === "quiz" && <QuizScreen run={run} ri={ri} qi={qi} picked={picked} onPick={lock} />}
      {!params.kiosk && phase !== "quiz" && <EscHint />}
    </main>
  );
}

function EscHint() {
  return (
    <p className="pointer-events-none fixed bottom-2 left-0 right-0 z-30 hidden text-center font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600 [@media(pointer:fine)]:block">
      Esc = back to title
    </p>
  );
}

function RoundPips({ ri }: { ri: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: ROUNDS }, (_, i) => (
        <span key={i} className={`h-2 w-10 rounded-full ${i < ri ? "bg-lime-400/50" : i === ri ? "bg-lime-400" : "bg-white/15"}`} />
      ))}
    </div>
  );
}

function Ready({ count, lookSeconds }: { count: number; lookSeconds: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" data-testid="ready">
      <RoundPips ri={0} />
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-zinc-500 sm:text-sm">Round 1 / {ROUNDS} · {RULES.easy.label}</p>
      <p key={count} className="pop-in mt-2 font-anton text-[44vw] leading-[0.85] text-lime-400 sm:text-[16rem]">
        {count}
      </p>
      <p className="mt-6 max-w-sm text-lg leading-snug text-zinc-300 sm:text-xl">
        A profile appears for <b className="text-fg">{lookSeconds} seconds</b>. Scroll, read, remember. 3 rounds, Easy to Hard.
      </p>
    </div>
  );
}

function Between({ ri, last, total, count }: { ri: number; last: boolean[]; total: number; count: number }) {
  const d = (["easy", "medium", "hard"] as const)[ri];
  const rule = RULES[d];
  const got = last.filter(Boolean).length;
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" data-testid="between" data-round={ri}>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
        Round {ri} done · <b className="text-fg">{got}/{QUESTIONS_PER_ROUND}</b> · total {total}/{TOTAL_QUESTIONS}
      </p>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {last.map((r, i) => (
          <span key={i} className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[11px] font-black ${r ? "bg-lime-400 text-black" : "bg-white/10 text-zinc-400"}`}>
            {r ? "✓" : "✕"}
          </span>
        ))}
      </div>
      <h1 className="pop-in mt-8 font-black uppercase leading-[0.82] tracking-tighter">
        <span className="block text-[22vw] sm:text-[11rem]">
          Round {ri + 1}<span className="text-zinc-600">/{ROUNDS}</span>
        </span>
      </h1>
      <p className={`mt-4 inline-block rounded-full px-4 py-1.5 font-mono text-sm font-bold uppercase tracking-[0.25em] ${d === "hard" ? "bg-red-500 text-white" : "bg-amber-400 text-black"}`}>
        {rule.label}
      </p>
      <p className="mt-4 max-w-sm text-lg leading-snug text-zinc-300">{rule.blurb}</p>
      <div className="mt-6"><RoundPips ri={ri} /></div>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-lime-400">Look in {count}…</p>
    </div>
  );
}

function QuizScreen({ run, ri, qi, picked, onPick }: { run: Run; ri: number; qi: number; picked: number | null; onPick: (i: number) => void }) {
  const round = run.rounds[ri];
  const q = round.questions[qi];
  const verdict = picked === null ? null : picked === q.correctIndex ? "right" : picked === -1 ? "timeout" : "wrong";
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col" data-testid="quiz" data-q={qi} data-round={ri} data-kind={q.kind}>
      {verdict && (
        <div key={`f${ri}-${qi}`} className={`flash pointer-events-none fixed inset-0 z-0 ${verdict === "right" ? "bg-lime-400" : "bg-red-500"}`} aria-hidden />
      )}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={pfpSrc(round.profile.avatar)} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover blur-[1.5px]" />
          <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
            <span className="text-lime-400">R{ri + 1}/{ROUNDS}</span> · @{round.profile.handle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex gap-1 sm:gap-1.5" aria-hidden>
            {round.questions.map((_, i) => (
              <span key={i} className={`h-2 w-3 rounded-full sm:w-7 ${i < qi ? "bg-lime-400/60" : i === qi ? "bg-lime-400" : "bg-white/15"}`} />
            ))}
          </div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg sm:text-sm" data-testid="progress">
            {qi + 1}/{round.questions.length}
          </p>
        </div>
      </div>
      <div className="relative z-10 mt-3 sm:mt-5">
        <Timer ms={QUESTION_MS} paused={picked !== null} runKey={`${ri}-${qi}`} />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Question key={`${ri}-${qi}`} q={q} picked={picked} onPick={onPick} />
        <p className="mt-3 h-6 text-center font-mono text-sm font-bold uppercase tracking-[0.2em]" aria-live="assertive" data-testid="verdict">
          {verdict === "right" && <span className="text-lime-400">Spotted it!</span>}
          {verdict === "wrong" && <span className="text-red-400">{q.decoys.includes(q.options[picked!]) ? "Decoy! " : "Nope: "}{q.answer}</span>}
          {verdict === "timeout" && <span className="text-amber-400">Time&apos;s up: {q.answer}</span>}
        </p>
      </div>
    </div>
  );
}
