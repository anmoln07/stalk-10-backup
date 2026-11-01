import type { Question as Q } from "@/lib/buildRun";
import type { FactKind } from "@/content/types";

const TAGS: Record<FactKind, string | null> = { recall: null, photo: "About a photo", not: "Odd one out", calc: "Do the maths" };

/** `picked`: null = still answering, -1 = timed out, 0..3 = chosen option. Retro-OS look: 1-bit buttons, hard shadows. */
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
  const tag = TAGS[q.kind];
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 pb-2 sm:gap-10">
      <div>
        {tag && (
          <p className="rise-in mb-3 inline-flex items-center gap-2 border-[1.5px] border-black bg-desk px-2 py-0.5 font-pixel text-[14px] text-black shadow-[2px_2px_0_#000]" data-testid="qtag">
            {tag}
          </p>
        )}
        <h1
          className="rise-in text-balance font-inter text-[clamp(2rem,9vw,3rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[#141414] sm:text-[clamp(3rem,5.4vw,5rem)]"
          aria-live="polite"
          data-testid="question"
        >
          {q.question}
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" role="group" aria-label="Answers">
        {q.options.map((opt, i) => {
          const isRight = i === q.correctIndex;
          const isPicked = i === picked;
          let cls = "bg-white text-[#141414] shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-desk hover:shadow-[6px_6px_0_#000]";
          if (locked) {
            if (isRight) cls = "bg-desk text-black shadow-[4px_4px_0_#000]";
            else if (isPicked) cls = "shake bg-black text-white shadow-[4px_4px_0_#000]";
            else cls = "bg-[#e3e3e3] text-black/40 shadow-[2px_2px_0_rgba(0,0,0,.3)]";
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={locked}
              onClick={() => onPick(i)}
              data-testid="answer"
              data-correct={locked ? String(isRight) : undefined}
              data-decoy={locked ? String(q.decoys.includes(opt)) : undefined}
              className={`rise-in group flex min-h-[60px] items-center gap-4 border-[1.5px] border-black px-4 py-3 text-left transition-[background,color,transform,box-shadow] duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#000] disabled:cursor-default sm:min-h-[88px] sm:px-5 ${cls}`}
              style={{ animationDelay: `${60 + i * 50}ms` }}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center border-[1.5px] font-pixel text-[17px] ${locked && isPicked && !isRight ? "border-white" : "border-black"}`}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="font-inter text-[19px] font-medium leading-tight tracking-[-0.02em] sm:text-2xl">{opt}</span>
              {locked && isRight && <span className="ml-auto font-pixel text-[18px]">✓</span>}
              {locked && isPicked && !isRight && <span className="ml-auto font-pixel text-[18px]">✕</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
