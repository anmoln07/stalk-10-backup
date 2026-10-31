/* eslint-disable @next/next/no-img-element -- tiny local webp files; plain <img> keeps them instant */
import type { Profile } from "@/content/types";

/**
 * Fake profile in the SOCIALTRACE / X dark style. Must fit one screen with no scroll at
 * 390×844 and 1440×900, so sizes step down on short screens via the `short:` variant.
 */
export default function ProfileCard({ profile }: { profile: Profile }) {
  const p = profile;
  return (
    <article
      data-testid="profile"
      data-profile-id={p.id}
      className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#121211] shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)]"
    >
      <div className="relative h-[72px] short:h-14 sm:h-28" style={{ background: p.banner }} aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,.25)_1px,transparent_0)] [background-size:10px_10px]" />
      </div>
      <div className="px-4 pb-1 sm:px-7">
        <img
          src={`/pfp/${p.avatar}`}
          alt=""
          width={96}
          height={96}
          className="relative z-[1] -mt-10 h-[76px] w-[76px] rounded-full border-4 border-[#121211] object-cover short:-mt-8 short:h-16 short:w-16 sm:-mt-14 sm:h-[104px] sm:w-[104px]"
        />
        <h2 className="mt-1.5 text-[22px] font-extrabold leading-tight tracking-tight sm:mt-2 sm:text-[28px]">{p.name}</h2>
        <p className="text-[15px] text-zinc-500 sm:text-lg">@{p.handle}</p>
        <p className="mt-2 text-[16px] leading-snug text-fg short:mt-1.5 sm:mt-3 sm:text-xl">{p.bio}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[15px] text-zinc-400 short:mt-1.5 sm:text-[17px]">
          <span className="inline-flex items-center gap-1.5">
            <PinIcon />
            {p.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalIcon />
            {p.joined}
          </span>
        </p>
      </div>
      <ul className="mt-3 divide-y divide-white/[0.07] border-t border-white/[0.07] short:mt-2 sm:mt-4">
        {p.posts.map((post, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3 short:py-2 sm:px-7 sm:py-3.5">
            {post.photo && (
              <figure className="shrink-0">
                <img
                  src={`/pfp/${post.photo}`}
                  alt=""
                  width={80}
                  height={80}
                  className="h-[60px] w-[60px] rounded-xl border border-white/10 object-cover short:h-12 short:w-12 sm:h-[76px] sm:w-[76px]"
                />
              </figure>
            )}
            <p className="min-w-0 flex-1 text-[16px] leading-snug text-fg sm:text-[19px]">
              {post.photo && (
                <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-[11px]">
                  Photo
                </span>
              )}
              {post.text}
            </p>
            <span className="shrink-0 pt-0.5 font-mono text-[13px] text-zinc-500 sm:text-sm">{post.time}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
