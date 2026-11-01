import { useEffect, useRef, type RefObject } from "react";

/** A ref that is true while `el` is on screen (canvases skip their per-frame work when it's false). */
export function useVisible(el: RefObject<Element>) {
  const v = useRef(false);
  useEffect(() => {
    const e = el.current;
    if (!e) return;
    const io = new IntersectionObserver(([x]) => { v.current = x.isIntersecting; }, { rootMargin: "100px" });
    io.observe(e);
    return () => io.disconnect();
  }, [el]);
  return v;
}

/** True for ~150 ms after any scroll: decorative canvases skip redraws then, so scrolling stays smooth. */
let lastScroll = 0;
if (typeof window !== "undefined") window.addEventListener("scroll", () => { lastScroll = performance.now(); }, { passive: true });
export const isScrolling = () => performance.now() - lastScroll < 150;
