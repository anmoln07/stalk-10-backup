/** Thin timer bar. Pure CSS: drains over `ms`, turns red for the last ~30%, freezes when `paused`. */
export default function Timer({ ms, paused, runKey }: { ms: number; paused: boolean; runKey: string | number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10" aria-hidden data-testid="timer">
      <div
        key={runKey}
        className="timer-fill h-full w-full rounded-full bg-lime-400"
        style={{ animationDuration: `${ms}ms, ${ms}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}
