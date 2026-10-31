import type { Question as Q } from "@/lib/buildRun";

/** `picked`: null = still answering, -1 = timed out, 0..3 = chosen option. */
export default function Question({
  q,
  picked,
  onPick,
}: {
  q: Q;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  const locked = picked !== null;
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 pb-2 sm:gap-10">
      <h1
        className="rise-in text-[clamp(2rem,9.4vw,3rem)] font-black uppercase leading-[0.9] tracking-tighter text-balance sm:text-[clamp(3rem,5.6vw,5.25rem)]"
        aria-live="polite"
        data-testid="question"
      >
        {q.question}
      </h1>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4" role="group" aria-label="Answers">
        {q.options.map((opt, i) => {
          const isRight = i === q.correctIndex;
          const isPicked = i === picked;
          let cls = "border-white/15 bg-white/[0.04] text-fg hover:border-lime-400 hover:bg-lime-400/10";
          if (locked) {
            if (isRight) cls = "border-lime-400 bg-lime-400 text-black";
            else if (isPicked) cls = "shake border-red-500 bg-red-500 text-white";
            else cls = "border-white/10 bg-white/[0.02] text-zinc-500 opacity-50";
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              onClick={() => onPick(i)}
              data-testid="answer"
              data-correct={locked ? String(isRight) : undefined}
              className={`rise-in group flex min-h-[60px] items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-[background,border-color,color,opacity,transform] duration-200 ease-spring active:scale-[.98] disabled:cursor-default sm:min-h-[92px] sm:px-6 ${cls}`}
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-mono text-sm font-bold ${
                  locked && (isRight || isPicked) ? "border-black/20" : "border-white/15 text-zinc-400"
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="text-[19px] font-bold leading-tight sm:text-2xl">{opt}</span>
              {locked && isRight && <span className="ml-auto font-mono text-xs font-bold uppercase tracking-[0.2em]">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
