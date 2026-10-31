"use client";
import SiteNav from "./SiteNav";
import Magnetic from "./Magnetic";
import QR from "./QR";
import DemoLoop from "./DemoLoop";
import Dot from "./Dot";
import { useKeys } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";

const MARQUEE = Array.from({ length: 8 }, () => ["LOOK", "REMEMBER", "TAP"]).flat();

export default function TitleScreen({ params, onPlay }: { params: GameParams; onPlay: () => void }) {
  useKeys((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onPlay();
    }
  });

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden" data-testid="title-screen">
      {!params.kiosk && <SiteNav />}

      <section className="relative z-10 mx-auto grid w-full max-w-[1500px] flex-1 items-center gap-8 px-5 pb-6 pt-24 sm:px-10 lg:grid-cols-[1.3fr_1fr] lg:gap-6 lg:pb-10 lg:pt-28">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> A memory game about made-up people
          </p>
          <h1 className="mt-4 font-black uppercase leading-[0.82] tracking-tighter">
            <span className="block whitespace-nowrap text-[13.5vw] sm:text-[11vw] lg:text-[8.6vw] 2xl:text-[8.4rem]">10-Second</span>
            <span className="block text-[13.5vw] text-lime-400 sm:text-[11vw] lg:text-[8.6vw] 2xl:text-[8.4rem]">Sleuth</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-snug text-zinc-300 sm:text-2xl">
            Look at a profile for <span className="font-bold text-fg">10 seconds</span>. Then see how much you remember.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Magnetic>
              <button
                type="button"
                onClick={onPlay}
                autoFocus
                data-testid="play"
                className="inline-flex min-h-[64px] items-center gap-3 rounded-full bg-lime-400 px-9 py-5 font-mono text-lg font-bold uppercase tracking-wider text-black transition-colors duration-200 hover:bg-white"
              >
                Play
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              </button>
            </Magnetic>
            <span className="hidden font-mono text-xs uppercase tracking-[0.25em] text-zinc-500 [@media(pointer:fine)]:inline">
              or press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-zinc-300">Enter</kbd>
            </span>
          </div>
        </div>

        <div className="relative lg:pb-36">
          <div className="pointer-events-none absolute -left-2 -top-8 z-10 flex items-center gap-2 sm:-top-10 lg:-left-6">
            <Dot size={46} animated />
            <span className="rounded-full rounded-bl-sm bg-paper px-3 py-1.5 text-[13px] font-semibold text-zinc-900 shadow-[3px_3px_0_#a3e635]">
              Blink and it&apos;s gone!
            </span>
          </div>
          <DemoLoop />
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-[84px] right-8 z-20 lg:right-12">
        <div className="pointer-events-auto">
          <QR />
        </div>
      </div>

      <div className="relative z-10 -rotate-1 overflow-hidden border-y-2 border-black bg-lime-400 py-3 text-black" aria-hidden>
        <div className="marquee-track flex w-max gap-6 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.3em] sm:text-base">
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-6">
              {MARQUEE.map((w, i) => (
                <span key={i} className="flex items-center gap-6">
                  {w} <span className="text-[10px]">●</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="h-4" />
    </main>
  );
}
