import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Anton (OFL), bundled locally: no font requests at runtime.
const anton = localFont({ src: "./fonts/anton.woff2", variable: "--font-anton", display: "swap" });
// Inter Tight (OFL, variable) for everything; Rock Salt (Apache 2.0) for the green marker scrawls.
const inter = localFont({ src: "./fonts/inter-tight.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const scrawl = localFont({ src: "./fonts/rock-salt.woff2", variable: "--font-scrawl", display: "swap" });

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
    <html lang="en" className={`${anton.variable} ${inter.variable} ${scrawl.variable}`}>
      <body className="grain min-h-[100dvh] bg-ink font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
