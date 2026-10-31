"use client";
import { useEffect, useState } from "react";
import { getBest } from "@/lib/storage";
import SiteNav, { pill } from "./SiteNav";
import Magnetic from "./Magnetic";
import QR from "./QR";
import DemoLoop from "./DemoLoop";
import Dot from "./Dot";
import Tapes from "./Tapes";
import { useKeys } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";

// Same cover-sheet layout as SOCIALTRACE's hero: centred title, crop marks, file microtype, scan line.
export default function TitleScreen({ params, onPlay }: { params: GameParams; onPlay: () => void }) {
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => setBest(getBest()), []);
  useKeys((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onPlay();
    }
  });
  const mark = "absolute h-6 w-6 border-zinc-600";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-ink text-white selection:bg-lime-400 selection:text-black" data-testid="title-screen">
      {!params.kiosk && <SiteNav right={best ? <span className={pill}>Best <b className="text-lime-400">{best}/5</b></span> : null} />}

      <section className="relative flex min-h-[calc(100svh-5rem)] w-full flex-col items-center justify-center px-4 pb-6 pt-24 sm:min-h-[calc(100svh-7rem)] sm:pt-32">
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div aria-hidden className="scan pointer-events-none absolute inset-x-0 top-0 h-px bg-lime-400/70 shadow-[0_0_24px_4px_rgba(163,230,53,.35)]" />
        <span aria-hidden className={`${mark} left-4 top-20 border-l border-t sm:left-8 sm:top-24`} />
        <span aria-hidden className={`${mark} right-4 top-20 border-r border-t sm:right-8 sm:top-24`} />
        <span aria-hidden className={`${mark} bottom-2 left-4 border-b border-l sm:left-8`} />
        <span aria-hidden className={`${mark} bottom-2 right-4 border-b border-r sm:right-8`} />

        {/* file microtype: in the flow on phones (big system text can't collide with the title), pinned on larger screens */}
        <div className="relative z-10 mb-8 flex w-full items-center justify-between gap-3 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:absolute sm:inset-x-12 sm:top-[7.5rem] sm:mb-0 sm:w-auto sm:px-0 sm:text-xs sm:tracking-[0.25em]">
          <span>Cipher club<span className="hidden sm:inline"> · stall game</span></span>
          <span className="flex shrink-0 items-center gap-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400" />10 sec look</span>
        </div>

        <div className="rise-in relative z-10 text-center">
          <h1 className="select-none text-[24vw] font-black uppercase leading-[0.82] tracking-tighter sm:text-[13vw] lg:text-[8.5vw] 2xl:text-[130px]" aria-label="Stalk 10">
            Stalk<br /><span className="bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent">10</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl font-mono text-[13px] uppercase leading-relaxed tracking-[0.18em] text-zinc-400 sm:text-base sm:tracking-widest">
            <span className="block sm:inline">Look for 10 seconds.</span>{" "}
            <span className="block sm:inline">
              <span className="relative inline-block"><span className="text-white">Remember</span>
                <span aria-hidden className="draw-line absolute inset-x-0 -bottom-1 h-[3px] bg-lime-400" /></span> what you saw.</span>
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Magnetic>
              <button
                type="button"
                onClick={onPlay}
                data-testid="play"
                className="group inline-flex min-h-[56px] items-center gap-3 rounded-full bg-lime-400 px-9 py-5 font-mono text-lg font-bold uppercase text-black outline-none transition-colors duration-200 hover:bg-white focus-visible:bg-white"
              >
                Play
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </Magnetic>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-zinc-500 sm:inline">[ or press enter ]</span>
          </div>
        </div>

        <div className="rise-in relative z-10 mt-14 w-full max-w-md lg:mt-10 [animation-delay:150ms]">
          <div className="pointer-events-none absolute -left-2 -top-9 z-10 flex items-center gap-2">
            <Dot size={44} animated />
            <span className="rounded-full rounded-bl-sm bg-paper px-3 py-1.5 text-[13px] font-semibold text-zinc-900 shadow-[3px_3px_0_#a3e635]">Blink and it&apos;s gone!</span>
          </div>
          <DemoLoop />
        </div>

        <div className="absolute bottom-6 right-8 z-10 hidden xl:block"><QR /></div>
      </section>
      <Tapes />
    </main>
  );
}
