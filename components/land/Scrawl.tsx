"use client";
import type { CSSProperties } from "react";

/**
 * A neon-green marker scrawl (Rock Salt) laid over other text, like the "Hey" on artemartemartem.com.
 * It "writes" itself in from the left when `on` turns true. Purely decorative: hidden from screen readers.
 */
export default function Scrawl({
  text,
  on = true,
  className = "",
  rotate = -8,
  delay = 0,
  style,
}: {
  text: string;
  on?: boolean;
  className?: string;
  rotate?: number;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`scrawl ${on ? "on" : ""} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, animationDelay: `${delay}ms`, ...style }}
    >
      {text}
    </span>
  );
}

/** A quick hand-drawn line through a word (draws in when `on`). */
export function Strike({ on = true, className = "", delay = 0 }: { on?: boolean; className?: string; delay?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 200 40" preserveAspectRatio="none" className={`strike ${on ? "on" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <path pathLength={1} d="M4 30 C40 22 70 26 98 18 S160 10 196 6" />
    </svg>
  );
}

/** A loose hand-drawn loop around something (draws in when `on`). */
export function Loop({ on = true, className = "" }: { on?: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 220 90" preserveAspectRatio="none" className={`loop ${on ? "on" : ""} ${className}`}>
      <path pathLength={1} d="M150 8 C90 0 20 10 10 44 C2 76 70 88 120 84 C180 80 214 62 210 38 C206 14 160 4 104 10 C80 13 60 18 48 22" />
    </svg>
  );
}
