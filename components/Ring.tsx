/** Countdown ring. `remaining`/`total` in ms. Turns red and pulses for the last 3 seconds. */
export default function Ring({ remaining, total, size = 88 }: { remaining: number; total: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  const secs = Math.max(0, Math.ceil(remaining / 1000));
  const urgent = remaining <= 3000;
  return (
    <div
      className={`relative shrink-0 ${urgent && secs > 0 ? "urgent" : ""}`}
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${secs} seconds left`}
      data-testid="ring"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="#0a0a08" stroke="rgba(255,255,255,.1)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={urgent ? "#ef4444" : "#a3e635"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-anton leading-none ${urgent ? "text-red-400" : "text-fg"}`}
        style={{ fontSize: size * 0.42 }}
      >
        {secs}
      </span>
    </div>
  );
}
