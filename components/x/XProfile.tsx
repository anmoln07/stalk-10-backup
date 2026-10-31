"use client";
/* eslint-disable @next/next/no-img-element -- small local webp files; plain <img> keeps them instant */
import { useRef, useState } from "react";
import type { Card, Profile } from "@/content/types";
import { friend, pfpSrc, seeded } from "@/lib/accounts";
import { feedSrc } from "@/lib/images";
import Verified from "./Verified";
import XPost, { Avatar } from "./XPost";
import { IconCalendar, IconHeart, IconPin, IconReply, IconRepost, IconViews } from "./Icons";

export type Tab = "posts" | "replies" | "media" | "likes";
const TABS: { id: Tab; label: string; live: boolean }[] = [
  { id: "posts", label: "Posts", live: true },
  { id: "replies", label: "Replies", live: true },
  { id: "media", label: "Media", live: true },
  { id: "likes", label: "Likes", live: false }, // visual only
];

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
  // Tab state lives here, so switching tabs never touches the look timer in PlayClient.
  const [tab, setTab] = useState<Tab>("posts");
  const nav = useRef<HTMLElement>(null);
  const pick = (t: Tab) => {
    setTab(t);
    // if the tabs have scrolled under the sticky top bar, bring them back just below it
    const el = nav.current;
    if (el && el.getBoundingClientRect().top < 60) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 56 });
  };
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
      <nav ref={nav} className="mt-3 flex border-b border-zinc-800" role="tablist" data-testid="tabs">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            disabled={!x.live}
            onClick={() => pick(x.id)}
            data-testid={`tab-${x.id}`}
            className={`flex flex-1 justify-center text-[15px] text-zinc-500 outline-none transition-colors ${x.live ? "hover:bg-white/5 focus-visible:bg-white/10" : "cursor-default"}`}
          >
            <span className={`py-3.5 ${tab === x.id ? "border-b-4 border-sky-500 font-bold text-white" : ""}`}>{x.label}</span>
          </button>
        ))}
      </nav>
      <div data-testid="feed" hidden={tab !== "posts"}>
        {feed.map((c, i) => (
          <XPost key={i} card={c} profile={p} index={i} />
        ))}
      </div>
      {tab === "replies" && <RepliesTab profile={p} />}
      {tab === "media" && <MediaTab profile={p} feed={feed} />}
      <p className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-600">end of feed</p>
    </section>
  );
}

/** Replies tab: the target's own replies to friends, X style ("Replying to @friend"). */
function RepliesTab({ profile: p }: { profile: Profile }) {
  const list = p.replies ?? [];
  if (!list.length) return <p className="p-8 text-center text-zinc-500" data-testid="replies-tab">@{p.handle} hasn&apos;t replied to anyone yet.</p>;
  return (
    <div data-testid="replies-tab">
      {list.map((r, i) => {
        const to = friend(r.to);
        const likes = r.likes ?? 1;
        return (
          <article key={i} className="flex gap-3 border-b border-zinc-800 px-4 py-3" data-testid="profile-reply">
            <Avatar src={pfpSrc(p.avatar)} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1 text-[15px] leading-5">
                <b className="truncate font-bold text-white">{p.name}</b>
                <Verified v={p.verified ? "blue" : undefined} size={17} />
                <span className="truncate text-zinc-500">@{p.handle} · {r.time}</span>
              </div>
              <p className="text-[13px] text-zinc-500">
                Replying to <span className="text-sky-400">@{to.handle}</span>
              </p>
              <p className="mt-0.5 break-words text-[15px] leading-snug text-[#e7e9ea]">{r.text}</p>
              <div className="mt-2.5 flex max-w-md justify-between pr-2 text-[13px] text-zinc-500" aria-hidden>
                <span className="flex items-center gap-1.5"><IconReply size={17} /></span>
                <span className="flex items-center gap-1.5"><IconRepost size={17} />{Math.floor(likes / 6)}</span>
                <span className="flex items-center gap-1.5"><IconHeart size={17} />{likes}</span>
                <span className="flex items-center gap-1.5"><IconViews size={17} />{likes * 23 + 40}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Media tab: a 3-column grid of their own photos and art (like SOCIALTRACE's Media grid). */
function MediaTab({ profile: p, feed }: { profile: Profile; feed: Card[] }) {
  const media = feed.filter((c): c is Extract<Card, { kind: "photo" | "art" }> => c.kind === "photo" || c.kind === "art");
  if (!media.length) return <p className="p-8 text-center text-zinc-500" data-testid="media-tab">No photos or videos yet.</p>;
  return (
    <div className="grid grid-cols-3 gap-0.5" data-testid="media-tab">
      {media.map((c, i) => (
        <div key={i} className="relative aspect-square overflow-hidden bg-zinc-900" title={`@${p.handle}: ${c.caption}`}>
          <img src={feedSrc(c.image)} alt="" draggable={false} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
