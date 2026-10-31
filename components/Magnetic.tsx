"use client";
import { useEffect, useRef, useState } from "react";

/** Pulls its child toward the cursor. Fine pointers only; never on touch or with reduced motion. */
export default function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      setOn(false);
    }
  }, []);
  const move = (e: React.PointerEvent) => {
    if (!on || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className="inline-block transition-transform duration-300 ease-spring will-change-transform"
    >
      {children}
    </span>
  );
}
