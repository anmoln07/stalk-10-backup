/* eslint-disable @next/next/no-img-element -- small local webp files; plain <img> keeps them instant */
import type { Card, Profile } from "@/content/types";
import { friend, pfpSrc, repostedFrom, seeded, type Who } from "@/lib/accounts";
import { feedSrc, images } from "@/lib/images";
import { threadOf } from "@/lib/text";
import { replyTime } from "@/lib/buildRun";
import Verified from "./Verified";
import { IconBookmark, IconHeart, IconReply, IconRepost, IconShare, IconViews } from "./Icons";

const k = (n = 0) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
const btn = "flex items-center gap-1.5 text-[13px] text-zinc-500";

export function Avatar({ src, size = 40 }: { src: string; size?: number }) {
  return <img src={src} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full bg-zinc-800 object-cover" draggable={false} />;
}

function Name({ who, time }: { who: Who; time: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1 text-[15px] leading-5">
      <b className="truncate font-bold text-white">{who.name}</b>
      <Verified v={who.verified} size={17} />
      <span className="truncate text-zinc-500">@{who.handle} · {time}</span>
    </div>
  );
}

function Stats({ replies, likes, seed }: { replies: number; likes: number; seed: string }) {
  return (
    <div className="mt-2.5 flex max-w-md justify-between pr-2" aria-hidden>
      <span className={btn}><IconReply size={17} />{replies ? k(replies) : ""}</span>
      <span className={btn}><IconRepost size={17} />{k(Math.floor(likes / 8) + seeded(seed, 0, 3)) }</span>
      <span className={btn}><IconHeart size={17} />{k(likes)}</span>
      <span className={btn}><IconViews size={17} />{k(likes * 31 + seeded(seed, 40, 400))}</span>
      <span className="flex gap-3 text-zinc-500"><IconBookmark size={17} /><IconShare size={17} /></span>
    </div>
  );
}

/** Feed picture, centre-cropped to a tidy shape (square shots show as 4:3, wide ones 16:9). */
function Media({ file, children }: { file: string; children?: React.ReactNode }) {
  const wide = images[file]?.aspect === "16:9";
  return (
    <div className={`relative mt-2.5 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 ${wide ? "aspect-video" : "aspect-[4/3] sm:aspect-[16/10]"}`}>
      <img src={feedSrc(file)} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {children}
    </div>
  );
}

function MemeMedia({ file, caption }: { file: string; caption: string }) {
  const parts = caption.split("|").map((s) => s.trim());
  const [top, bottom] = parts.length > 1 ? parts : [null, parts[0]];
  const cls = "meme-text absolute inset-x-2 text-center font-anton uppercase leading-[1.02] text-white text-[22px] sm:text-[28px]";
  return (
    <Media file={file}>
      {top && <p className={`${cls} top-2`}>{top}</p>}
      {bottom && <p className={`${cls} bottom-2`}>{bottom}</p>}
    </Media>
  );
}

function LinkCard({ file, headline, source }: { file: string; headline: string; source: string }) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-2xl border border-zinc-800">
      <div className="relative aspect-[1.91/1] bg-zinc-900">
        <img src={feedSrc(file)} alt="" draggable={false} className="h-full w-full object-cover" />
        <span className="absolute bottom-2.5 left-2.5 right-2.5 line-clamp-2 rounded bg-black/75 px-2 py-0.5 text-[13px] leading-snug text-white">{headline}</span>
      </div>
      <p className="px-3 py-2 text-[13px] text-zinc-500">From {source}</p>
    </div>
  );
}

/** One post in the X feed: the target's own post, or a meme/news repost, plus up to 2 friend replies. */
export default function XPost({ card: c, profile: p, index }: { card: Card; profile: Profile; index: number }) {
  const from = repostedFrom(c);
  const me: Who = { name: p.name, handle: p.handle, avatar: p.avatar, verified: p.verified ? "blue" : undefined };
  const who = from ?? me;
  const thread = threadOf(c);
  const likes = "likes" in c && c.likes ? c.likes : seeded(("image" in c ? c.image : c.time) + p.id, 900, 48000);
  const seed = `${p.id}-${index}`;
  const text = c.kind === "text" ? c.text : c.kind === "photo" || c.kind === "art" ? c.caption : null;
  return (
    <div className="border-b border-zinc-800" data-testid="card" data-kind={c.kind}>
      <article className="px-4 pb-3 pt-3">
        {from && (
          <p className="mb-1 ml-7 flex items-center gap-2 text-[13px] font-bold text-zinc-500">
            <IconRepost size={15} />
            {p.name} reposted
          </p>
        )}
        <div className="flex gap-3">
          <div className="flex shrink-0 flex-col items-center">
            <Avatar src={pfpSrc(who.avatar)} />
            {thread.length > 0 && <span className="mt-1 w-0.5 flex-1 bg-zinc-700" />}
          </div>
          <div className="min-w-0 flex-1">
            <Name who={who} time={c.time} />
            {text && <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-[#e7e9ea]">{text}</p>}
            {(c.kind === "photo" || c.kind === "art") && <Media file={c.image} />}
            {c.kind === "meme" && <MemeMedia file={c.image} caption={c.caption} />}
            {c.kind === "news" && <LinkCard file={c.image} headline={c.headline} source={c.source} />}
            <Stats replies={thread.length + seeded(seed, 0, 6)} likes={likes} seed={seed} />
          </div>
        </div>
      </article>
      {thread.map((r, i) => {
        const f = friend(r.by);
        const last = i === thread.length - 1;
        return (
          <article key={i} className="flex gap-3 px-4 pb-3" data-testid="reply">
            <div className="flex shrink-0 flex-col items-center">
              <Avatar src={pfpSrc(f.avatar)} />
              {!last && <span className="mt-1 w-0.5 flex-1 bg-zinc-700" />}
            </div>
            <div className="min-w-0 flex-1">
              <Name who={f} time={replyTime(c.time, i)} />
              <p className="text-[13px] text-zinc-500">
                Replying to <span className="text-sky-400">@{who.handle}</span>
              </p>
              <p className="mt-0.5 break-words text-[15px] leading-snug text-[#e7e9ea]">{r.text}</p>
              <Stats replies={0} likes={r.likes ?? 1} seed={`${seed}-r${i}`} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
