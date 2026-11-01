"use client";
import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * A 1-bit, classic-Mac style window (after the TypeSafe reference): black title strip with a pixel label,
 * hard black border, square corners, a hard drop shadow. `drag` lets you move it by its title bar
 * (pointer devices only; it never leaves its parent).
 */
export default function Window({
  title,
  children,
  className = "",
  style,
  body = "bg-white",
  drag = false,
  testId,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  body?: string;
  drag?: boolean;
  testId?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const start = (e: React.PointerEvent) => {
    if (!drag || e.pointerType === "touch" || !el.current) return;
    const w = el.current;
    const parent = w.offsetParent as HTMLElement | null;
    if (!parent) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = w.offsetLeft, oy = w.offsetTop;
    w.style.zIndex = String(++topZ);
    const move = (m: PointerEvent) => {
      const x = Math.max(0, Math.min(parent.clientWidth - w.offsetWidth, ox + m.clientX - sx));
      const y = Math.max(0, Math.min(parent.clientHeight - w.offsetHeight, oy + m.clientY - sy));
      w.style.left = `${x}px`; w.style.top = `${y}px`; w.style.right = "auto"; w.style.bottom = "auto";
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div ref={el} className={`os-win ${className}`} style={style} data-testid={testId} onPointerDown={() => { if (drag && el.current) el.current.style.zIndex = String(++topZ); }}>
      <div className={`os-title ${drag ? "cursor-grab active:cursor-grabbing" : ""}`} onPointerDown={start}>
        <span className="os-title-text">{title}</span>
      </div>
      <div className={`os-body ${body}`}>{children}</div>
    </div>
  );
}

let topZ = 20;
