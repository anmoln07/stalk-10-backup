import type { Metadata } from "next";
import App from "@/components/App";

export const metadata: Metadata = { title: "Play · Stalk 10" };

export default function Page() {
  return <App initial="play" />;
}
