import type { Metadata } from "next";
import App from "@/components/App";

export const metadata: Metadata = { title: "Play · 10-Second Sleuth" };

export default function Page() {
  return <App initial="play" />;
}
