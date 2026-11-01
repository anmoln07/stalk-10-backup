"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { getBest } from "@/lib/storage";
import QR from "./QR";
import { useKeys } from "@/lib/hooks";
import type { GameParams } from "@/lib/params";
import { TOTAL_QUESTIONS } from "@/content/rules";
import Scrawl, { Loop, Strike } from "./land/Scrawl";
import Doodle from "./land/Doodles";

/**
 * Landing page, after artemartemartem.com: white page, heavy black type, neon-green marker scrawls,
 * a pill of "surveillance" footage that grows to full screen on scroll, a hover list over it,
 * a statement with marker-redacted words that lift as you scroll, and a black footer with the Play button + QR.
 */

// What you'll have to remember, each tied to the moment in /video/feed.mp4 where the tracker locks on.
const FACTS = [
  { text: "her cat's name", scrawl: "Biscuit?", t: 0.4 },
  { text: "where she lives", scrawl: "Pune!", t: 0.8 },
  { text: "what she's drinking", scrawl: "×3", t: 2.1 },
  { text: "where she's flying", scrawl: "Goa", t: 3.7 },
  { text: "her new shoes", scrawl: "yellow?", t: 8.5 },
  { text: "what's just noise", scrawl: "decoy!", t: 10.4 },
];

// Statement copy. [x] = marker-redacted until you scroll to it.
const STATEMENT =
  "You had ten seconds. Her cat is [Biscuit], not [Cookie]. She lives in [Pune], drinks [iced lattes] and flies to [Goa] on [the 15th]. Got all that? Now do it [fifteen times].";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function TitleScreen({ params, onPlay }: { params: GameParams; onPlay: () => void }) {
  const [best, setBest] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [footIn, setFootIn] = useState(false);
  const [statIn, setStatIn] = useState(false);
  // Phones (portrait screens) get a portrait cut of the footage so it fills the pill and full screen without cropping.
  const [tall, setTall] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => setTall(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const stage = useRef<HTMLElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const heroL = useRef<HTMLDivElement>(null);
  const heroR = useRef<HTMLDivElement>(null);
  const heroHint = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const statement = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLElement>(null);
  const hoverRef = useRef(false);
  const listOn = useRef(false);
  hoverRef.current = hovering;

  useEffect(() => setBest(getBest()), []);
  useKeys((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onPlay();
    }
  });

  // One scroll loop drives everything; it writes styles directly so React doesn't re-render per frame.
  useEffect(() => {
    let raf = 0;
    let lastActive = -1;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight, vw = document.documentElement.clientWidth;
      const st = stage.current, p = pill.current;
      if (st && p) {
        const s = -st.getBoundingClientRect().top;
        const G = 0.8 * vh, LEND = 1.9 * vh, END = 2.6 * vh;
        const g = clamp(s / G), sh = clamp((s - LEND) / (END - LEND));
        const e = ease(g) * (1 - ease(sh));
        const small = vw < 768;
        const pw = small ? 148 : 150, ph = small ? 240 : 250;
        p.style.width = `${pw + (vw - pw) * e}px`;
        p.style.height = `${ph + (vh - ph) * e}px`;
        p.style.borderRadius = `${(pw / 2) * (1 - e)}px`;
        const fade = 1 - clamp(g * 1.8);
        const push = ease(g);
        if (heroL.current) { heroL.current.style.opacity = `${fade}`; heroL.current.style.transform = `translateX(${-push * 12}vw)`; }
        if (heroR.current) { heroR.current.style.opacity = `${fade}`; heroR.current.style.transform = `translateX(${push * 12}vw)`; }
        if (heroHint.current) heroHint.current.style.opacity = `${1 - clamp(g * 4)}`;
        const lp = (s - G) / (LEND - G);
        const lo = clamp((s - G * 0.85) / (0.15 * vh)) * (1 - clamp(sh * 3));
        const wasOn = listOn.current;
        listOn.current = lo > 0.2;
        if (listOn.current && !wasOn && video.current) { try { video.current.currentTime = FACTS[lastActive < 0 ? 0 : lastActive].t; } catch {} }
        if (list.current) {
          list.current.style.opacity = `${lo}`;
          list.current.style.pointerEvents = lo > 0.5 ? "auto" : "none";
          list.current.style.transform = `translateY(${(1 - clamp(lp * 3 + 0.3)) * 6}vh)`;
        }
        if (!hoverRef.current && lp >= 0 && lp <= 1) {
          const i = Math.min(FACTS.length - 1, Math.floor(lp * FACTS.length));
          if (i !== lastActive) { lastActive = i; setActive(i); }
        }
      }
      // Marker redactions lift as each word crosses ~70% of the screen.
      const ws = statement.current?.querySelectorAll<HTMLElement>("[data-redact]");
      ws?.forEach((w) => {
        const top = w.getBoundingClientRect().top;
        w.style.setProperty("--r", `${clamp((vh * 0.8 - top) / (vh * 0.2))}`);
      });
      if (ws?.length && ws[ws.length - 1].getBoundingClientRect().top < vh * 0.55) setStatIn(true);
      // Footer: a black pill that opens into the full section.
      const f = foot.current;
      if (f) {
        const top = f.getBoundingClientRect().top;
        const k = ease(clamp((vh - top) / (vh * 0.75)));
        f.style.clipPath = `inset(${(1 - k) * 8}% ${(1 - k) * 40}% ${(1 - k) * 70}% ${(1 - k) * 40}% round ${(1 - k) * 160 + 0}px)`;
        if (k > 0.85) setFootIn(true);
      }
      if (still && video.current && !video.current.paused) video.current.pause();
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // While the list is up, the footage stays on the active fact: it jumps to the moment the tracker locks on
  // and replays that ~2 s clip, so the picture always matches the highlighted line.
  const activeRef = useRef(0);
  activeRef.current = active;
  useEffect(() => {
    const v = video.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seek = () => { try { v.currentTime = FACTS[activeRef.current].t; void v.play().catch(() => {}); } catch {} };
    if (listOn.current) {
      if (v.readyState >= 1) seek();
      else v.addEventListener("loadedmetadata", seek, { once: true });
    }
  }, [active]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const hold = () => {
      if (!listOn.current) return;
      const t = FACTS[activeRef.current].t;
      if (v.currentTime < t - 0.05 || v.currentTime > t + 1.6) { try { v.currentTime = t; } catch {} }
    };
    v.addEventListener("timeupdate", hold);
    return () => v.removeEventListener("timeupdate", hold);
  }, []);

  const playBtn = (big = false, testId?: string) => (
    <button
      type="button"
      onClick={onPlay}
      data-testid={testId}
      className={`play-btn group relative inline-flex items-center justify-center gap-3 rounded-full font-bold tracking-[-0.02em] outline-none ${
        big ? "h-[76px] bg-neon px-12 text-[28px] text-black" : "h-[58px] bg-black px-9 text-[20px] text-white"
      }`}
    >
      <span className="relative z-10">Play</span>
      <svg width={big ? 28 : 22} height={big ? 28 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      <Loop className={`play-loop ${big ? "text-white" : ""}`} />
    </button>
  );

  return (
    <main className="land relative bg-white font-sans text-black selection:bg-neon selection:text-black" data-testid="title-screen">

      {!params.kiosk && (
        <nav className="fixed inset-x-0 top-0 z-50 flex items-start justify-between px-3 pt-2 text-[17px] font-semibold tracking-[-0.03em] text-white mix-blend-difference sm:px-4 sm:text-[22px]">
          <a href="#how" className="nav-link">how it works</a>
          <span className="absolute left-1/2 -translate-x-1/2">stalk 10</span>
          <button type="button" onClick={onPlay} className="nav-link">play</button>
        </nav>
      )}

      {/* ---------- Stage: hero → pill grows to full screen → list over the footage → pill shrinks back ---------- */}
      <section ref={stage} className="relative" style={{ height: "calc(100svh + 260vh)" }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Left: the title + QR */}
          <div ref={heroL} className="absolute inset-x-0 top-[13%] flex flex-col items-start px-5 sm:px-8 md:inset-x-auto md:left-0 md:top-0 md:h-full md:w-[38%] md:items-center md:justify-center md:px-6">
            <h1 className="relative select-none font-extrabold leading-[0.86] tracking-[-0.06em]" aria-label="Stalk 10">
              <span className="block text-[clamp(30px,4.2vw,64px)]">Psst,</span>
              <span className="block whitespace-nowrap text-[clamp(64px,8.6vw,150px)]">Stalk 10</span>
              <Scrawl text="psst!" className="left-[-4%] top-[-30%] text-[clamp(38px,5vw,84px)]" rotate={-12} delay={900} />
              <Strike className="bottom-[-10%] left-[2%] h-[0.32em] w-[96%] text-[clamp(64px,8.6vw,150px)]" delay={1500} />
            </h1>
            <div className="mt-8 hidden lg:block">
              <QR size={210} testId="qr" />
            </div>
          </div>

          {/* Centre: the pill of footage */}
          <div ref={pill} className="pill absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black" style={{ width: 150, height: 250, borderRadius: 75 }}>
            <video ref={video} className="h-full w-full object-cover" src={tall === null ? undefined : tall ? "/video/feed-portrait.mp4" : "/video/feed.mp4"} poster={tall === null ? undefined : tall ? "/video/feed-portrait-poster.jpg" : "/video/feed-poster.jpg"} autoPlay muted loop playsInline preload="auto" aria-hidden />
            <div aria-hidden className="crt pointer-events-none absolute inset-0" />
          </div>

          {/* Right: eye doodle, blurb, Play */}
          <div ref={heroR} className="absolute inset-x-0 bottom-[5%] flex flex-col items-center px-6 text-center md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:w-[38%] md:justify-center md:px-10">
            <Doodle name="eye" className="!relative hidden h-20 w-20 md:block" delay={600} />
            <p className="mt-3 max-w-[330px] text-[16px] leading-[1.3] tracking-[-0.01em] sm:text-[18px]">
              A memory game about made-up people. Look at a profile for <b className="font-bold">10 seconds</b>, then answer what you saw.
              Three rounds, {TOTAL_QUESTIONS} questions, plenty of decoys.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              {playBtn(false, "play")}
              <span className="hidden text-[13px] text-black/45 sm:block">or press Enter</span>
            </div>
          </div>

          <div ref={heroHint} aria-hidden className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 text-[12px] text-black/40 md:flex">
            <span className="inline-block h-[14px] w-[9px] rounded-full border border-current" /> scroll
          </div>

          {/* The hover list over the full-screen footage */}
          <div ref={list} className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pb-6 pt-24 opacity-0 sm:px-4 sm:pb-8" style={{ pointerEvents: "none" }}>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-neon sm:text-[15px]">What you&apos;ll have to remember</p>
            <ul onMouseLeave={() => setHovering(false)}>
              {FACTS.map((f, i) => (
                <li key={f.text} className="relative w-fit">
                  <button
                    type="button"
                    onMouseEnter={() => { setHovering(true); setActive(i); }}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`fact block text-left text-[clamp(34px,6.2vw,100px)] font-extrabold leading-[0.9] tracking-[-0.055em] transition-colors duration-200 ${i === active ? "text-white" : "text-white/35"}`}
                  >
                    {f.text}
                  </button>
                  {i === active && (
                    <>
                      <Scrawl key={`s${i}`} text={f.scrawl} className="left-[30%] top-[-18%] text-[clamp(30px,4.6vw,76px)]" rotate={-9} />
                      <span key={`t${i}`} className="tag absolute -right-3 top-1/2 translate-x-full -translate-y-1/2 whitespace-nowrap bg-white px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
                        seen at 0:{String(Math.round(f.t)).padStart(2, "0")}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Statement with marker redactions ---------- */}
      <section id="how" className="relative px-5 pb-[16vh] pt-[16vh] sm:px-8">
        <p className="mb-8 text-center text-[13px] font-bold uppercase tracking-[0.14em] text-neon-deep sm:text-[14px]">The catch</p>
        <div ref={statement} className="mx-auto max-w-[920px] text-balance text-center text-[clamp(30px,4.1vw,60px)] font-extrabold leading-[1.1] tracking-[-0.05em]">
          {STATEMENT.split(/(\[[^\]]+\])/).map((part, i, all) => {
            const m = part.match(/^\[(.+)\]$/);
            // Punctuation right after a redacted word stays on its line ("Pune," never wraps as "Pune / ,").
            if (!m) return <span key={i}>{all[i - 1]?.startsWith("[") ? part.replace(/^[.,?!]+/, "") : part}</span>;
            const tail = all[i + 1]?.match(/^[.,?!]+/)?.[0] ?? "";
            return (
              <span key={i} className="whitespace-nowrap">
                <span data-redact className="redact relative inline-block">
                  <span aria-hidden className="mark" />
                  <span className="relative">{m[1]}</span>
                  <span aria-hidden className="blot" />
                </span>
                {tail}
              </span>
            );
          })}
        </div>
        <div className="relative mx-auto mt-6 flex max-w-[920px] justify-end pr-[6%]">
          <span className="relative h-[60px] w-[200px]"><Scrawl text="easy, right?" on={statIn} className="right-0 top-2 text-[clamp(22px,2.4vw,34px)]" rotate={-6} /></span>
        </div>

        <ol className="mx-auto mt-[10vh] grid max-w-[1100px] gap-8 border-t border-black/15 pt-8 sm:grid-cols-3 sm:gap-6">
          {[
            ["01", "Look", "A made-up profile shows for ten seconds. Scroll as fast as you like."],
            ["02", "Answer", "Five questions about it, seven seconds each. Three rounds, Easy to Hard."],
            ["03", "Don't get fooled", "Decoys (her friend's dog, not her cat) and look-alikes (Biscotti vs Biscuit)."],
          ].map(([n, h, t]) => (
            <li key={n} className="text-left">
              <span className="text-[13px] font-bold tabular-nums text-black/40">{n}</span>
              <h3 className="mt-2 text-[clamp(26px,2.6vw,36px)] font-extrabold leading-none tracking-[-0.045em]">{h}</h3>
              <p className="mt-3 max-w-[300px] text-[16px] leading-[1.35] text-black/70">{t}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-10 max-w-[1100px] text-[13px] text-black/45">Everyone in this game is fictional.</p>
      </section>

      {/* ---------- Footer: black pill opens into the Play section ---------- */}
      <footer ref={foot} className="foot relative overflow-hidden bg-black px-5 pb-8 pt-44 text-white sm:px-8 sm:pt-28">
        <Doodle name="glass" on={footIn} className="left-[4%] top-[3%] h-20 w-20 sm:top-[10%] sm:h-36 sm:w-36" />
        <Doodle name="cat" on={footIn} delay={150} className="right-[6%] top-[3%] h-20 w-20 sm:top-[8%] sm:h-32 sm:w-32" />
        <Doodle name="phone" on={footIn} delay={300} className="bottom-[22%] left-[7%] hidden h-32 w-32 md:block" />
        <Doodle name="at" on={footIn} delay={450} className="bottom-[30%] right-[9%] hidden h-24 w-24 md:block" />
        <Doodle name="smile" on={footIn} delay={600} className="left-[30%] top-[6%] hidden h-16 w-16 lg:block" />
        <Doodle name="q" on={footIn} delay={750} className="right-[30%] top-[14%] hidden h-16 w-16 lg:block" />
        <Doodle name="heart" on={footIn} delay={900} className="bottom-[12%] left-[30%] hidden h-14 w-14 lg:block" />
        <Doodle name="star" on={footIn} delay={1050} className="bottom-[14%] right-[28%] hidden h-14 w-14 lg:block" />

        <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center text-center">
          <h2 className="relative text-[clamp(52px,8.4vw,140px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            Ready to<br />stalk?
            <Scrawl text="now!" on={footIn} className="right-[-14%] top-[-16%] text-[0.36em]" rotate={-10} delay={300} />
          </h2>
          <div className="mt-12 flex flex-col items-center gap-3">
            {playBtn(true)}
            <span className="hidden text-[14px] text-white/50 sm:block">or press Enter</span>
          </div>
          <div className="mt-16 hidden md:block"><QR size={240} dark /></div>
          {best !== null && (
            <p className="mt-10 text-[15px] text-white/70">Best on this device: <b className="text-neon">{best}/{TOTAL_QUESTIONS}</b></p>
          )}
        </div>
        <div className="relative z-10 mt-20 flex flex-col items-center justify-between gap-2 text-[12px] text-white/45 sm:flex-row">
          <span>A Cipher club stall game</span>
          <span>Everyone in this game is fictional</span>
        </div>
      </footer>
    </main>
  );
}
