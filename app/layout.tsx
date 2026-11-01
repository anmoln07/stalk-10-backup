import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Anton (OFL), bundled locally: no font requests at runtime.
const anton = localFont({ src: "./fonts/anton.woff2", variable: "--font-anton", display: "swap" });
// Inter Tight (OFL, variable) for headings/body; Pixelify Sans (OFL) for the retro OS windows; IBM Plex Mono (OFL) for small print.
const inter = localFont({ src: "./fonts/inter-tight.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const pixel = localFont({ src: [{ path: "./fonts/pixel-400.woff2", weight: "400" }, { path: "./fonts/pixel-600.woff2", weight: "600" }], variable: "--font-pixel", display: "swap" });
const mono = localFont({ src: [{ path: "./fonts/mono-400.woff2", weight: "400" }, { path: "./fonts/mono-500.woff2", weight: "500" }], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Stalk 10",
  description: "Look at a profile for 10 seconds. Then see how much you remember. A memory game about made-up people.",
  robots: { index: true, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${pixel.variable} ${mono.variable}`}>
      <body className="grain min-h-[100dvh] bg-ink font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
