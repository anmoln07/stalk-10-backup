/** Neon-green hand-drawn doodles for the black footer (like the ones on the reference site's contact block). */
const D: Record<string, string[]> = {
  eye: ["M6 52 C26 22 74 20 94 50 C74 80 26 82 6 52 Z", "M50 36 C60 36 66 44 64 53 C62 63 50 66 43 61 C35 55 38 37 50 36 Z", "M49 48 C52 48 54 51 52 54 C50 56 46 54 47 51"],
  glass: ["M40 14 C58 12 70 26 68 42 C66 60 48 70 32 64 C16 58 10 40 18 26 C22 19 30 15 40 14 Z", "M60 60 L88 90", "M64 56 L92 84", "M30 30 C34 26 40 25 44 26"],
  cat: ["M20 36 L18 12 L38 26 C46 24 56 24 64 26 L82 12 L80 38 C88 54 82 80 50 82 C18 80 12 54 20 36 Z", "M36 48 C38 46 40 46 42 48", "M58 48 C60 46 62 46 64 48", "M46 60 L50 64 L54 60", "M30 62 L8 60 M30 66 L10 70 M70 62 L92 60 M70 66 L90 70"],
  phone: ["M30 8 C28 8 26 10 26 14 L26 86 C26 90 28 92 32 92 L68 92 C72 92 74 90 74 86 L74 14 C74 10 72 8 68 8 Z", "M42 16 L58 16", "M46 82 C48 80 52 80 54 82", "M34 30 L66 30 M34 40 L60 40 M34 50 L64 50"],
  at: ["M66 52 C66 64 80 64 82 50 C86 26 64 10 44 14 C20 18 10 44 20 64 C30 84 58 88 76 76", "M62 46 C62 34 46 30 40 40 C34 52 40 64 50 62 C58 60 62 54 62 46 L64 36"],
  smile: ["M50 8 C76 8 92 28 92 50 C92 76 72 92 50 92 C24 92 8 72 8 48 C8 26 26 8 50 8 Z", "M34 38 L34 46 M66 38 L66 46", "M28 60 C38 76 64 78 74 58"],
  arrow: ["M8 70 C30 40 56 30 86 34", "M70 20 L88 34 L72 50"],
  q: ["M30 32 C30 14 70 10 72 32 C74 48 52 50 50 64 L50 70", "M50 84 L50 88"],
  heart: ["M50 84 C20 62 8 44 14 28 C20 12 42 12 50 30 C58 12 80 12 86 28 C92 44 80 62 50 84 Z"],
  star: ["M50 8 L60 38 L92 38 L66 56 L76 88 L50 68 L24 88 L34 56 L8 38 L40 38 Z"],
};

export type DoodleName = keyof typeof D;

export default function Doodle({ name, className = "", on = true, delay = 0 }: { name: DoodleName; className?: string; on?: boolean; delay?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={`doodle ${on ? "on" : ""} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {D[name].map((d, i) => (
        <path key={i} d={d} pathLength={1} style={{ animationDelay: `${delay + i * 120}ms` }} />
      ))}
    </svg>
  );
}
