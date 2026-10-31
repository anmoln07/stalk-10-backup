"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR of this site's own URL, generated locally (no network). Hidden on phones. */
export default function QR() {
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = window.location.origin + "/";
    setUrl(u.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    QRCode.toString(u, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0a0a08", light: "#00000000" } })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, []);
  if (!svg) return null;
  return (
    <aside className="hidden items-end gap-4 md:flex" data-testid="qr">
      <div className="text-right">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-lime-400">Play on your phone</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{url}</p>
      </div>
      <div
        className="h-[140px] w-[140px] rotate-2 rounded-2xl bg-paper p-3 shadow-[6px_6px_0_#a3e635] [&>svg]:h-full [&>svg]:w-full"
        role="img"
        aria-label={`QR code for ${url}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </aside>
  );
}
