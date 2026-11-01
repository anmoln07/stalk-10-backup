// Dot, the tour guide: a chibi magnifying glass with a sprout, happy ^^ eyes and rosy cheeks.
// Original character, drawn in code. animated: floats, sprout wiggles, eyes blink (CSS in globals.css,
// all off with reduced motion).
export default function Dot({ size = 44, animated = false }: { size?: number; animated?: boolean }) {
  return <span className={`relative inline-block shrink-0 ${animated ? "dot-float" : ""}`} style={{ width: size, height: size }}>
    {animated && <span aria-hidden className="absolute left-[8%] top-[12%] h-[66%] w-[66%] rounded-full bg-lime-400/40 blur-md dot-halo" />}
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="relative overflow-visible">
      {/* sprout */}
      <g className={animated ? "dot-sprout" : ""} style={{ transformOrigin: "20px 6px" }}>
        <path d="M20 6.4 Q19.6 3.6 20.6 1.6" fill="none" stroke="#84cc16" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20.6 2.4 Q22.4 -1.4 26.6 -0.6 Q25.4 3.4 20.8 3.2 Z" fill="#a3e635" />
        <path d="M20.2 3.4 Q17.6 0.2 14 1.4 Q15.6 4.8 20 4.4 Z" fill="#84cc16" />
      </g>
      {/* handle */}
      <path d="M31.5 31.5 L41 41" stroke="#ECEAE2" strokeWidth="8" strokeLinecap="round" />
      <path d="M33.5 33.5 L41 41" stroke="#a3e635" strokeWidth="8" strokeLinecap="round" />
      {/* lens */}
      <circle cx="20" cy="21" r="15.5" fill="#1a1d14" stroke="#a3e635" strokeWidth="4" />
      <circle cx="20" cy="21" r="12.5" fill="#a3e635" opacity=".12" />
      {/* happy ^^ eyes */}
      <g className={animated ? "dot-blink" : ""} style={{ transformOrigin: "20px 19px" }}>
        <path d="M12.2 20.4 Q14.6 17 17 20.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M23 20.4 Q25.4 17 27.8 20.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* cheeks */}
      <ellipse cx="11" cy="24.5" rx="2.3" ry="1.3" fill="#fb7185" opacity=".6" />
      <ellipse cx="29" cy="24.5" rx="2.3" ry="1.3" fill="#fb7185" opacity=".6" />
      {/* open smile + tongue */}
      <path d="M16.6 24 Q20 28.4 23.4 24 Z" fill="#0a0a08" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M18.4 25.7 Q20 27.6 21.6 25.7 Q20 25 18.4 25.7Z" fill="#fb7185" />
      {/* glass shine */}
      <path d="M9.6 14 Q12 10 16.4 9.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".5" />
    </svg>
  </span>;
}
