// X-style verified badge: blue for people, gold for organisations. Copied from SOCIALTRACE.
export default function Verified({ v, size = 18 }: { v?: "blue" | "gold"; size?: number }) {
  if (!v) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-label={v === "gold" ? "Verified organisation" : "Verified account"} className="shrink-0">
      <path
        fill={v === "gold" ? "#e2b719" : "#1d9bf0"}
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      />
      <path d="m9 12 2 2 4-4" fill="none" stroke={v === "gold" ? "#000" : "#fff"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
