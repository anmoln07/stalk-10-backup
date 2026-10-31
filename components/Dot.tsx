// Dot, the tour guide: a little magnifying glass with a face. Original character, drawn in code.
// animated: floats gently and blinks (CSS in globals.css, off with reduced motion).
export default function Dot({ size = 44, animated = false }: { size?: number; animated?: boolean }) {
  return <span className={`relative inline-block shrink-0 ${animated ? "dot-float" : ""}`} style={{ width: size, height: size }}>
    {animated && <span aria-hidden className="absolute left-[8%] top-[8%] h-[66%] w-[66%] rounded-full bg-lime-400/40 blur-md dot-halo" />}
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="relative">
      <path d="M31 31 L43 43" stroke="#d4d4d8" strokeWidth="6" strokeLinecap="round" />
      <path d="M31 31 L43 43" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="20" r="15" fill="#0a0a08" stroke="#a3e635" strokeWidth="4" />
      <circle cx="20" cy="20" r="11" fill="#a3e635" opacity=".14" />
      <g className={animated ? "dot-blink" : ""} style={{ transformOrigin: "20px 18px" }}>
        <circle cx="15.5" cy="18" r="2.2" fill="#fff" /><circle cx="24.5" cy="18" r="2.2" fill="#fff" />
        <circle cx="16" cy="18.5" r="1" fill="#0a0a08" /><circle cx="25" cy="18.5" r="1" fill="#0a0a08" />
      </g>
      <path d="M15.5 24 Q20 27.5 24.5 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 13 Q13 9 17 9" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </svg>
  </span>;
}
