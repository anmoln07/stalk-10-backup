import type { Round } from "@/lib/buildRun";
import { RULES, ROUNDS } from "@/content/rules";
import XProfile, { postCount } from "./x/XProfile";
import Verified from "./x/Verified";
import { IconBack, IconBell, IconBookmark, IconHome, IconMail, IconSearch, IconUser } from "./x/Icons";
import Ring from "./Ring";
import Dot from "./Dot";

const NAV = [
  { I: IconHome, l: "Home" },
  { I: IconSearch, l: "Explore" },
  { I: IconBell, l: "Notifications" },
  { I: IconMail, l: "Messages" },
  { I: IconBookmark, l: "Bookmarks" },
  { I: IconUser, l: "Profile" },
];

/**
 * The 10-second look: an X-style profile page (scrolls like the real thing). The countdown ring sits in
 * the sticky top bar on phones and in the sticky right-hand panel on laptops, so it never scrolls away.
 */
export default function LookScreen({ round, remaining, total, leaving }: { round: Round; remaining: number; total: number; leaving: boolean }) {
  const p = round.profile;
  const rule = RULES[round.difficulty];
  const chip = (
    <span className="whitespace-nowrap rounded-full border border-lime-400/40 bg-lime-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-lime-400" data-testid="round-chip">
      R{round.index + 1}/{ROUNDS} · {rule.label}
    </span>
  );
  return (
    <div className={`mx-auto flex min-h-[100dvh] max-w-[1265px] justify-center ${leaving ? "look-out" : "rise-in"}`} data-testid="look">
      {/* left rail: decorative X navigation */}
      <header className="sticky top-0 hidden h-[100dvh] w-[72px] shrink-0 flex-col items-center gap-1 py-3 sm:flex xl:w-[240px] xl:items-stretch xl:px-3" aria-hidden>
        <div className="flex items-center gap-3 p-3">
          <Dot size={30} animated />
          <span className="hidden font-black uppercase tracking-tighter xl:inline">Stalk 10</span>
        </div>
        {NAV.map(({ I, l }) => (
          <span key={l} className="flex items-center gap-5 rounded-full p-3 text-zinc-500">
            <I size={26} />
            <span className="hidden text-xl xl:inline">{l}</span>
          </span>
        ))}
      </header>

      <main className="min-h-[100dvh] w-full min-w-0 max-w-[600px] border-zinc-800 bg-black pb-16 sm:border-x">
        <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-zinc-800 bg-black/85 px-3 py-1.5 backdrop-blur-md sm:px-4" data-testid="topbar">
          <span className="rounded-full p-1.5 text-zinc-300" aria-hidden><IconBack size={20} /></span>
          <div className="min-w-0 flex-1">
            <b className="flex items-center gap-1 truncate text-[17px] leading-tight sm:text-xl">
              <span className="truncate">{p.name}</span>
              <Verified v={p.verified ? "blue" : undefined} size={18} />
            </b>
            <p className="text-[13px] text-zinc-500">{postCount(p).toLocaleString("en-IN")} posts</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            {chip}
            <Ring remaining={remaining} total={total} size={46} />
          </div>
        </div>
        <XProfile profile={p} feed={round.feed} />
      </main>

      {/* right panel (laptops): the timer, round and a nudge to scroll */}
      <aside className="hidden w-[350px] shrink-0 px-6 py-3 lg:block">
        <div className="sticky top-3 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#0d0d0c] p-5">
            <div className="flex items-center justify-between">
              {chip}
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">look only</span>
            </div>
            <div className="mt-5 flex justify-center">
              <Ring remaining={remaining} total={total} size={150} />
            </div>
            <div className="mt-5 flex items-center gap-2.5">
              <Dot size={40} animated />
              <p className="rounded-2xl rounded-bl-sm bg-paper px-3 py-2 text-[14px] font-semibold leading-snug text-zinc-900 shadow-[3px_3px_0_#a3e635]">
                Remember it! Scroll if you dare.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 p-4 text-[15px]">
            <b className="text-lg">Round {round.index + 1} of {ROUNDS}</b>
            <p className="mt-1 text-zinc-400">{rule.blurb}</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">5 questions next · 7 s each</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
