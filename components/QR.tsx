"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QR of this site's own URL, generated locally (no network).
 * `size` is the code itself in px; it always sits on white with a quiet zone so phones can read it from a distance.
 */
export default function QR({ size = 150, dark = false, testId }: { size?: number; dark?: boolean; testId?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = window.location.origin + "/";
    setUrl(u.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    QRCode.toString(u, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#00000000" } })
      .then(setSvg)
      .catch(() => setSvg(null));
  }, []);
  if (!svg) return null;
  return (
    <aside className="flex flex-col items-center gap-3" data-testid={testId}>
      <div
        className="rounded-[22px] bg-white p-4 [&>svg]:h-full [&>svg]:w-full"
        style={{ width: size + 32, height: size + 32 }}
        role="img"
        aria-label={`QR code for ${url}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className={`text-center text-[15px] font-semibold leading-tight ${dark ? "text-white" : "text-black"}`}>
        Scan to play on your phone
        <span className={`mt-1 block text-[12px] font-normal ${dark ? "text-white/60" : "text-black/50"}`}>{url}</span>
      </p>
    </aside>
  );
}
