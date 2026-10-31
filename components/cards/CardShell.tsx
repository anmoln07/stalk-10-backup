/* eslint-disable @next/next/no-img-element -- small local webp files; plain <img> keeps them instant */
import { feedSrc } from "@/lib/images";

/** Shared frame for every feed card. `fact` cards carry quiz facts and are never hidden. */
export function CardShell({ kind, fact, children }: { kind: string; fact: boolean; children: React.ReactNode }) {
  return (
    <article
      data-testid="card"
      data-kind={kind}
      data-fact={fact ? "true" : "false"}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#121211]"
    >
      {children}
    </article>
  );
}

/** Cropped feed picture. `ratio` is Tailwind aspect classes, e.g. "aspect-[5/2] lg:aspect-[2/1]". */
export function CardImage({ file, ratio, children }: { file: string; ratio: string; children?: React.ReactNode }) {
  return (
    <div className={`relative w-full overflow-hidden bg-white/5 ${ratio}`}>
      <img src={feedSrc(file)} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {children}
    </div>
  );
}

/** Relative time + fake like/reply counts (decoration only). */
export function CardMeta({ time, likes, replies, label }: { time: string; likes?: number; replies?: number; label?: string }) {
  return (
    <p className="flex items-center gap-2.5 font-mono text-[11px] leading-none text-zinc-500 lg:text-xs">
      {label && <span className="uppercase tracking-[0.15em]">{label}</span>}
      {likes !== undefined && (
        <span className="inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
          </svg>
          {likes}
        </span>
      )}
      {replies !== undefined && (
        <span className="inline-flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M4 5h16v11H9l-5 4V5Z" />
          </svg>
          {replies}
        </span>
      )}
      <span className="ml-auto">{time}</span>
    </p>
  );
}

/** Body text size shared by text posts and photo captions (≥ 13 px on phones). */
export const bodyText = "text-[14px] leading-[1.3] text-fg sm:text-[15px] lg:text-[16px] lg:leading-snug";
