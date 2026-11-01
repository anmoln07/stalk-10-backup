/** Stalk 10 mark: a 13×7 pixel eye + "STALK" in the pixel face + "10" in a green box. */
const EYE = [
  "....XXXXX....",
  "..XX.....XX..",
  ".X...GGG...X.",
  "X...GGBGG...X",
  ".X...GGG...X.",
  "..XX.....XX..",
  "....XXXXX....",
];

export function PixelEye({ className = "", ink = "currentColor" }: { className?: string; ink?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 13 7" className={className} shapeRendering="crispEdges">
      {EYE.flatMap((row, y) => [...row].map((c, x) =>
        c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c === "G" ? "#3ccf7a" : c === "B" ? "#0b0b0b" : ink} />,
      ))}
    </svg>
  );
}

export default function Logo({ size = "sm", dark = false }: { size?: "sm" | "lg"; dark?: boolean }) {
  const lg = size === "lg";
  return (
    <span className={`inline-flex items-center font-pixel font-semibold leading-none ${lg ? "gap-[0.3em] text-[clamp(48px,7vw,104px)]" : "gap-2 text-[17px]"}`}>
      <PixelEye className={lg ? "h-[0.62em] w-auto" : "h-[13px] w-auto"} ink={dark ? "#fff" : "#0b0b0b"} />
      <span className="tracking-[0.02em]">STALK</span>
      <span className={`border-[1.5px] bg-[#3ccf7a] px-[0.18em] pb-[0.06em] pt-[0.1em] text-[#0b0b0b] ${dark ? "border-white" : "border-[#0b0b0b]"}`}>10</span>
    </span>
  );
}
