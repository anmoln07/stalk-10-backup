"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { getBest } from "@/lib/storage";
import QR from "./QR";
import { useKeys } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";
import { TOTAL_QUESTIONS, QUESTIONS_PER_ROUND, RULES } from "@/content/rules";
import { ranks } from "@/content/ranks";
import { profiles } from "@/content/profiles";
import Window from "./os/Window";
import PlayApp from "./os/PlayApp";
import { Clock, Cube, Glider, Halftone, Sky } from "./os/Art";

/**
 * Landing, after typesafe.ai: a soft cloud sky, a news window, a huge grotesk headline, and PLAY.app + QR on the
 * first screen (it's a stall game: nobody should need to scroll to start). Below: a green "STALK.OS" desktop of
 * 1-bit windows showing how a round works, a dark FAQ, and a wireframe-cube footer. Green, black, white and grey.
 */

const count = (d: string) => profiles.filter((p) => p.difficulty === d).length;
const ROWS = (["easy", "medium", "hard"] as const).map((d) => ({ d, rule: RULES[d], n: count(d) }));

const FAQ: [string, string][] = [
  ["Is anyone in this real?", "No. Every profile, friend, photo caption and reply is made up for the game."],
  ["What's a decoy?", "Something that is on the profile, but not the answer. We ask about her cat; her friend's dog Cookie is a decoy."],
  ["What's a look-alike?", "A near miss that was never on the profile, like Biscotti when the cat is Biscuit. Hard rounds use them."],
  ["How does scoring work?", `One point per right answer, ${TOTAL_QUESTIONS} in total. Your rank goes from ${ranks[ranks.length - 1].name} to ${ranks[0].name}.`],
  ["Can I play on my phone?", "Yes. Scan the QR code on the stall laptop and it opens right here."],
  ["Do you save anything?", "Only your best score, on this device. No accounts, no tracking."],
];

function Corner({ c }: { c: string }) { return <span aria-hidden className={`absolute h-3 w-3 border-black ${c}`} />; }

export default function TitleScreen({ params, onPlay }: { params: GameParams; onPlay: () => void }) {
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => setBest(getBest()), []);
  useKeys((e) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLElement && e.target.closest("summary"))) {
      e.preventDefault();
      window.dispatchEvent(new Event("stalk10:launch"));
    }
  });

  return (
    <main className="ts relative bg-white font-inter text-[#141414] selection:bg-desk selection:text-black" data-testid="title-screen">
      {/* ---------- Nav ---------- */}
      {!params.kiosk && (
        <nav className="fixed inset-x-0 top-0 z-50 flex items-start justify-between text-[15px] sm:text-[16px]">
          <span className="bg-desk px-2 py-1 font-medium text-black">Stalk 10</span>
          <span className="hidden gap-[3px] sm:flex">
            <a href="#how" className="ts-tab">How it works</a>
            <a href="#faq" className="ts-tab">FAQ</a>
          </span>
          <button type="button" onClick={() => window.dispatchEvent(new Event("stalk10:launch"))} className="ts-tab">Play now</button>
        </nav>
      )}

      {/* ---------- Hero: sky, news, headline, PLAY.app + QR ---------- */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[46svh]"><Sky /></div>
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1280px] flex-col items-center px-4 pb-8 pt-14 sm:px-8 lg:pt-12">
          <Window title="Nov 2026 • Cipher Club News" className="w-full max-w-[360px]" body="bg-[#e8e8e8]">
            <p className="flex items-start justify-between gap-4 px-2 py-1.5 font-plex text-[12px] leading-snug">
              <span>Stalk 10 is live at the stall: 3 rounds, {TOTAL_QUESTIONS} questions.</span>
              <a href="#how" className="shrink-0 underline underline-offset-2">Read rules</a>
            </p>
          </Window>

          <div className="relative mt-8 w-full max-w-[1180px] px-2 pb-6 pt-8 sm:mt-10 sm:px-10 lg:mt-[3vh] lg:pt-6">
            <Corner c="left-0 top-0 border-l border-t" /><Corner c="right-0 top-0 border-r border-t" />
            <Corner c="bottom-0 left-0 border-b border-l" /><Corner c="bottom-0 right-0 border-b border-r" />
            <p aria-hidden className="absolute -left-1 top-1/2 hidden origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-plex text-[9px] tracking-wider text-black/40 lg:block">
              bWlyYV9zbmFwcyBjYXQ9QmlzY3VpdCBjaXR5PVB1bmUgZHJpbms9aWNlZC1sYXR0ZSB0cmlwPUdvYQ
            </p>
            <p className="text-center text-[13px] font-medium sm:text-[14px]">
              Introducing Stalk 10 <span className="hidden tracking-[0.2em] text-black/50 sm:inline">..................</span><span className="sm:hidden"> · </span> A memory game about strangers
            </p>
            <h1 className="mx-auto mt-4 max-w-[1100px] text-balance text-center text-[clamp(40px,min(6vw,10.5vh),100px)] font-medium leading-[0.92] tracking-[-0.045em]">
              You Get 10 Seconds To Stalk A Stranger. Then We Quiz You.
            </h1>

            <div className="mt-8 grid items-center gap-6 lg:mt-[3vh] lg:grid-cols-[1fr_auto_1fr]">
              <div className="hidden justify-self-end lg:block">
                <Window title="Scan.app" body="bg-white">
                  <div className="p-2"><QR size={170} testId="qr" /></div>
                </Window>
              </div>
              <div className="justify-self-center"><PlayApp onPlay={onPlay} testId="play" big /></div>
              <div className="flex flex-col items-center gap-3 lg:items-start lg:justify-self-start">
                <a href="#how" className="ts-link text-[clamp(26px,2.6vw,40px)]">How It Works</a>
                <a href="#faq" className="ts-link text-[clamp(26px,2.6vw,40px)]">Read The FAQ</a>
                {best !== null && <p className="mt-1 font-plex text-[12px] text-black/60">Best on this device: <b className="text-black">{best}/{TOTAL_QUESTIONS}</b></p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STALK.OS desktop: how a round works ---------- */}
      <section id="how" className="relative overflow-hidden bg-desk px-3 py-16 sm:px-8 sm:py-24">
        <Halftone />
        <div className="relative mx-auto max-w-[1180px]">
          <h2 className="max-w-[900px] text-[clamp(36px,5vw,80px)] font-medium leading-[0.95] tracking-[-0.045em]">
            Look. Remember. Don&apos;t Get Fooled.
          </h2>
          <p className="mt-4 max-w-[520px] font-plex text-[13px] leading-relaxed sm:text-[14px]">
            Each round a made-up profile shows for ten seconds. Then {QUESTIONS_PER_ROUND} questions, seven seconds each. Three rounds, Easy to Hard.
          </p>

          <div className="ts-desk relative mt-10 border border-black lg:h-[640px]">
            <span className="absolute left-0 top-0 z-10 bg-black px-1.5 py-0.5 font-pixel text-[13px] text-white">STALK.OS</span>
            <div className="flex flex-col gap-5 p-4 pt-10 lg:block lg:p-0">
              <Window drag title="Clock Tool 1.1" className="lg:absolute lg:right-6 lg:top-6 lg:w-[230px]" body="bg-white">
                <p className="px-2 py-1.5 font-plex text-[12px]"><Clock /></p>
              </Window>

              <Window drag title="Profile.app" className="lg:absolute lg:left-[6%] lg:top-[70px] lg:w-[330px]">
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <img src="/pfp/p-cat.webp" alt="" className="h-12 w-12 border border-black object-cover grayscale contrast-150" />
                    <div className="leading-tight">
                      <p className="font-semibold">Mira Joshi</p>
                      <p className="font-plex text-[12px] text-black/55">@mira_snaps · step 1</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[15px] leading-snug">Cat mum to <mark className="ts-mark">Biscuit</mark> 🐈 Photographer in <mark className="ts-mark">Pune</mark>. Coffee first.</p>
                  <p className="mt-2 border-t border-dashed border-black/30 pt-2 text-[14px]">Third <mark className="ts-mark">iced latte</mark> today. Send help.</p>
                  <p className="mt-2 border-t border-dashed border-black/30 pt-2 text-[14px]">Babysitting Arjun&apos;s dog Cookie this weekend.</p>
                </div>
              </Window>

              <Window drag title="Timer 1.1" className="lg:absolute lg:left-[33%] lg:top-[30px] lg:w-[200px]" body="bg-[#e8e8e8]">
                <div className="px-3 py-2">
                  <p className="ts-count font-pixel text-[64px] leading-none" role="img" aria-label="10 second look" />
                  <div className="mt-2 h-3 border border-black bg-white"><span className="ts-drain block h-full bg-black" /></div>
                  <p className="mt-1.5 font-plex text-[11px]">seconds to look · step 1</p>
                </div>
              </Window>

              <Window drag title="Quiz.exe" className="lg:absolute lg:left-[40%] lg:top-[190px] lg:w-[380px]">
                <div className="p-3">
                  <p className="font-plex text-[11px] text-black/55">Q1 of 5 · 7 sec · step 2</p>
                  <p className="mt-1 text-[19px] font-medium leading-tight tracking-[-0.02em]">What is Mira&apos;s cat called?</p>
                  <ul className="mt-3 grid grid-cols-2 gap-2 font-pixel text-[17px]">
                    {[["Cookie", "decoy"], ["Biscuit", "right"], ["Biscotti", "look-alike"], ["Mochi", ""]].map(([o, k], i) => (
                      <li key={o} className={`flex items-center justify-between border border-black px-2 py-1.5 ${k === "right" ? "bg-black text-white" : "bg-white"}`}>
                        <span>{i + 1}. {o}</span>{k && k !== "right" && <span className="font-plex text-[10px] opacity-60">{k}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </Window>

              <Window drag title="Decoy.alert" className="lg:absolute lg:left-[16%] lg:top-[400px] lg:w-[300px]" body="bg-white">
                <div className="flex gap-3 p-3">
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center border-2 border-black font-pixel text-[22px]">!</span>
                  <div>
                    <p className="font-semibold">Decoy!</p>
                    <p className="text-[14px] leading-snug">Cookie is Arjun&apos;s dog. Mira&apos;s cat is Biscuit.</p>
                    <span className="mt-2 inline-block border-2 border-black px-4 py-0.5 font-pixel text-[14px]">OK</span>
                  </div>
                </div>
              </Window>

              <Window drag title="Rounds.db" className="lg:absolute lg:bottom-[34px] lg:right-[5%] lg:w-[430px]">
                <table className="w-full font-plex text-[12px]">
                  <thead><tr className="bg-[#e8e8e8] text-left">
                    <th className="px-2 py-1 font-medium">Round</th><th className="px-2 py-1 font-medium">Look</th><th className="px-2 py-1 font-medium">Qs</th><th className="px-2 py-1 font-medium">Watch for</th>
                  </tr></thead>
                  <tbody>
                    {ROWS.map(({ d, rule }) => (
                      <tr key={d} className="border-t border-black/20">
                        <td className="px-2 py-1.5"><span className="bg-black px-1 text-white">{rule.label}</span></td>
                        <td className="px-2 py-1.5">10s</td><td className="px-2 py-1.5">{QUESTIONS_PER_ROUND}</td>
                        <td className="px-2 py-1.5">{rule.blurb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Window>

              <Window drag title="Glider 1.1" className="hidden lg:absolute lg:bottom-[34px] lg:left-6 lg:block">
                <Glider />
              </Window>
            </div>
          </div>
          <p className="mt-4 font-plex text-[11px] text-black/70">Tip: drag the windows around.</p>
        </div>
      </section>

      {/* ---------- FAQ (dark) ---------- */}
      <section id="faq" className="bg-[#141414] px-4 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[900px]">
          <h2 className="text-center text-[clamp(32px,4vw,56px)] font-medium tracking-[-0.04em]">We Answer The Obvious</h2>
          <div className="mt-10 border-t border-white/20">
            {FAQ.map(([q, a]) => (
              <details key={q} className="ts-faq group border-b border-white/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-plex text-[13px] sm:text-[14px]">
                  {q}<span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center border border-white/50 text-[12px] group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 pr-10 text-[16px] leading-relaxed text-white/75">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Footer: wireframe cube + wordmark ---------- */}
      <footer className="relative overflow-hidden bg-[#141414] px-4 pb-6 text-white sm:px-8">
        <div className="relative mx-auto grid h-[min(70vh,560px)] max-w-[1180px] place-items-center">
          <Cube className="absolute inset-0 h-full w-full" />
          <div className="relative flex flex-col items-center gap-6">
            <p className="flex items-center gap-3 text-[clamp(48px,7vw,104px)] font-medium tracking-[-0.05em]">
              <svg aria-hidden viewBox="0 0 48 48" className="h-[0.8em] w-[0.8em]" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 24C10 12 38 12 45 24C38 36 10 36 3 24Z" /><circle cx="24" cy="24" r="7" fill="#3CCF7A" /><circle cx="24" cy="24" r="3" fill="#141414" stroke="none" /></svg>Stalk 10
            </p>
            <button type="button" onClick={() => window.dispatchEvent(new Event("stalk10:launch"))} className="ts-link text-[clamp(22px,2.2vw,32px)] text-white">Play now →</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 border-t border-white/15 pt-4 font-plex text-[11px] text-white/50 sm:flex-row sm:justify-between">
          <span>Stalk 10 © 2026 · a Cipher club stall game</span>
          <span>Everyone in this game is fictional</span>
        </div>
      </footer>
    </main>
  );
}
