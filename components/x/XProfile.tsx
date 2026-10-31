/* eslint-disable @next/next/no-img-element -- small local webp files; plain <img> keeps them instant */
import type { Card, Profile } from "@/content/types";
import { pfpSrc, seeded } from "@/lib/accounts";
import { feedSrc } from "@/lib/images";
import Verified from "./Verified";
import XPost from "./XPost";
import { IconCalendar, IconPin } from "./Icons";

const n = (x: number) => (x >= 1e4 ? (x / 1000).toFixed(1).replace(/\.0$/, "") + "K" : x.toLocaleString("en-IN"));

// Banner fallback when a profile has no banner image: a gradient picked from its id.
const GRADIENTS = [
  "linear-gradient(120deg,#14b8a6,#0f172a)",
  "linear-gradient(120deg,#ea580c,#7f1d1d)",
  "linear-gradient(120deg,#6366f1,#ec4899)",
  "linear-gradient(120deg,#06b6d4,#1e3a8a)",
  "linear-gradient(120deg,#ef4444,#f59e0b)",
  "linear-gradient(120deg,#a855f7,#facc15)",
];

export const followCounts = (p: Profile) => ({
  followers: p.followers ?? seeded(p.id + "f", 180, 2400),
  following: p.following ?? seeded(p.id + "g", 90, 700),
});
export const postCount = (p: Profile) => seeded(p.id + "p", 120, 1900);

/** The X profile page (copied from SOCIALTRACE's Profile): banner, avatar, bio, counts, tabs, then the feed. */
export default function XProfile({ profile: p, feed }: { profile: Profile; feed: Card[] }) {
  const { followers, following } = followCounts(p);
  return (
    <section data-testid="profile" data-profile-id={p.id} data-difficulty={p.difficulty}>
      {p.banner ? (
        <img src={feedSrc(p.banner)} alt="" className="aspect-[3/1] w-full object-cover" draggable={false} />
      ) : (
        <div className="aspect-[3/1]" style={{ background: GRADIENTS[seeded(p.id, 0, GRADIENTS.length - 1)] }} />
      )}
      <header className="px-4">
        <div className="-mt-[42px] flex items-end justify-between sm:-mt-[72px]">
          <div className="rounded-full border-4 border-black bg-black">
            <img src={pfpSrc(p.avatar)} alt="" className="h-[80px] w-[80px] rounded-full object-cover sm:h-[134px] sm:w-[134px]" draggable={false} />
          </div>
          <span className="mb-1 rounded-full bg-white px-4 py-1.5 text-[15px] font-bold text-black" aria-hidden>Follow</span>
        </div>
        <h2 className="mt-2 flex items-center gap-1 text-xl font-extrabold leading-tight">
          {p.name}
          <Verified v={p.verified ? "blue" : undefined} size={20} />
        </h2>
        <p className="text-[15px] text-zinc-500">@{p.handle}</p>
        <p className="mt-3 text-[15px] leading-snug" data-testid="bio">{p.bio}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-zinc-500">
          <span className="flex items-center gap-1"><IconPin size={16} />{p.location}</span>
          <span className="flex items-center gap-1"><IconCalendar size={16} />{p.joined}</span>
        </p>
        <p className="mt-2 text-[15px] text-zinc-500">
          <b className="text-white">{n(following)}</b> Following <b className="ml-4 text-white">{n(followers)}</b> Followers
        </p>
      </header>
      <nav className="mt-3 flex border-b border-zinc-800" aria-hidden>
        {["Posts", "Replies", "Media", "Likes"].map((x, i) => (
          <span key={x} className="flex flex-1 justify-center text-[15px] text-zinc-500">
            <span className={`py-3.5 ${i === 0 ? "border-b-4 border-sky-500 font-bold text-white" : ""}`}>{x}</span>
          </span>
        ))}
      </nav>
      <div data-testid="feed">
        {feed.map((c, i) => (
          <XPost key={i} card={c} profile={p} index={i} />
        ))}
      </div>
      <p className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-600">end of feed</p>
    </section>
  );
}
