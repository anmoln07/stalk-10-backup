/** Segmented 1-bit timer bar. Pure CSS: drains over `ms`, blinks for the last ~30%, freezes when `paused`. */
export default function Timer({ ms, paused, runKey }: { ms: number; paused: boolean; runKey: string | number }) {
  return (
    <div className="h-5 w-full border-[1.5px] border-black bg-white p-[2px]" aria-hidden data-testid="timer">
      <div
        key={runKey}
        className="timer-os h-full w-full"
        style={{ animationDuration: `${ms}ms, ${ms}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}
