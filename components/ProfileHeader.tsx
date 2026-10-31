/* eslint-disable @next/next/no-img-element -- tiny local webp files; plain <img> keeps them instant */
import type { Profile } from "@/content/types";
import { feedSrc } from "@/lib/images";
import Dot from "./Dot";

// Banner fallback when a profile has no place-* banner: a gradient picked from its id.
const GRADIENTS = [
  "linear-gradient(120deg,#14b8a6,#0f172a)",
  "linear-gradient(120deg,#ea580c,#7f1d1d)",
  "linear-gradient(120deg,#6366f1,#ec4899)",
  "linear-gradient(120deg,#06b6d4,#1e3a8a)",
  "linear-gradient(120deg,#ef4444,#f59e0b)",
  "linear-gradient(120deg,#a855f7,#facc15)",
];
function gradientFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/**
 * Profile header: banner (3:1 centre crop of a place-* image, or a gradient) with the countdown
 * ring floating top-right and a "Remember it!" tag, then avatar, name, handle, bio, 📍 + joined.
 */
export default function ProfileHeader({ profile: p, ring }: { profile: Profile; ring: React.ReactNode }) {
  return (
    <header className="shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#121211] lg:w-[360px] lg:self-start">
      <div className="relative aspect-[3/1] w-full overflow-hidden" style={p.banner ? undefined : { background: gradientFor(p.id) }}>
        {p.banner && <img src={feedSrc(p.banner)} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" aria-hidden />
        <p className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/60 py-1 pl-1 pr-2.5 backdrop-blur-md">
          <Dot size={22} animated />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime-400 lg:text-[11px]">Remember it!</span>
        </p>
        <div className="absolute right-2 top-2">{ring}</div>
      </div>
      <div className="px-3.5 pb-3 lg:px-5 lg:pb-5">
        {/* phones: avatar overlaps the banner with the name beside it; laptops: name below */}
        <div className="flex items-end gap-2.5 lg:block">
          <img
            src={`/pfp/${p.avatar}`}
            alt=""
            width={96}
            height={96}
            className="relative z-[1] -mt-7 h-[60px] w-[60px] shrink-0 rounded-full border-4 border-[#121211] object-cover lg:-mt-11 lg:h-[88px] lg:w-[88px]"
          />
          <div className="min-w-0 pb-0.5 lg:mt-1 lg:pb-0">
            <h2 className="truncate text-[19px] font-extrabold leading-tight tracking-tight lg:text-[26px]">{p.name}</h2>
            <p className="truncate text-[14px] leading-tight text-zinc-500 lg:text-[17px]">@{p.handle}</p>
          </div>
        </div>
        <p className="mt-1.5 text-[15px] leading-snug text-fg lg:mt-3 lg:text-[18px]">{p.bio}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px] text-zinc-400 lg:mt-3 lg:text-[15px]">
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {p.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </svg>
            {p.joined}
          </span>
        </p>
        <p className="mt-4 hidden font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500 lg:block">
          5 questions coming · scan the feed
        </p>
      </div>
    </header>
  );
}
