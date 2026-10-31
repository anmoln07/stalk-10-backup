import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Anton (OFL), bundled locally: no font requests at runtime.
const anton = localFont({ src: "./fonts/anton.woff2", variable: "--font-anton", display: "swap" });

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
    <html lang="en" className={anton.variable}>
      <body className="grain min-h-[100dvh] bg-ink font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
