"use client";
import { useCallback, useEffect, useState } from "react";
import { useGameParams } from "@/lib/hooks";
import { profiles } from "@/content/profiles";
import { feedSrc, profileImages } from "@/lib/images";
import TitleScreen from "./TitleScreen";
import PlayClient from "./PlayClient";

type Mode = "title" | "play";

// Keep references so the decoded images stay in the document's memory cache.
const warmed: HTMLImageElement[] = [];
function warmImages() {
  if (warmed.length) return;
  // Every picture a profile can show (~2 MB), so the game keeps working if the Wi-Fi drops.
  const files = new Set(["/logo.svg", ...profiles.flatMap((p) => [`/pfp/${p.avatar}`, ...profileImages(p).map(feedSrc)])]);
  files.forEach((src) => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    warmed.push(img);
  });
}

/**
 * The whole game is one client app: title <-> play switches in memory (the URL follows
 * via history.pushState). After the first load nothing is fetched, so it keeps working
 * if the stall Wi-Fi drops.
 */
export default function App({ initial }: { initial: Mode }) {
  const params = useGameParams();
  const [mode, setMode] = useState<Mode>(initial);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(warmImages);
    else window.setTimeout(warmImages, 300);
    const onPop = () => setMode(window.location.pathname.startsWith("/play") ? "play" : "title");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const nav = useCallback(
    (m: Mode) => {
      const path = (m === "play" ? "/play" : "/") + (params?.query ?? "");
      try {
        if (window.location.pathname + window.location.search !== path) window.history.pushState(null, "", path);
      } catch {}
      if (m === "play") setPlayKey((k) => k + 1);
      setMode(m);
      window.scrollTo(0, 0);
    },
    [params?.query],
  );
  const toPlay = useCallback(() => nav("play"), [nav]);
  const toTitle = useCallback(() => nav("title"), [nav]);

  if (!params) return <main className="min-h-[100dvh] bg-ink" />;
  return mode === "title" ? (
    <TitleScreen params={params} onPlay={toPlay} />
  ) : (
    <PlayClient key={playKey} params={params} onTitle={toTitle} />
  );
}
