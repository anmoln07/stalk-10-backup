import Image from "next/image";

/** Floating liquid-glass top bar, same as SOCIALTRACE's SiteNav. Clicking the logo goes back to the title. */
export default function SiteNav({ onHome, right }: { onHome?: () => void; right?: React.ReactNode }) {
  return (
    <nav className="glass fixed inset-x-3 top-3 z-40 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pl-3 pr-2 sm:inset-x-6 sm:top-4 sm:pl-4" data-testid="nav">
      <a
        href="/"
        onClick={(e) => {
          if (!onHome) return;
          e.preventDefault();
          onHome();
        }}
        className="relative flex min-h-[36px] items-center gap-2 font-mono text-base font-bold uppercase tracking-tighter sm:text-lg"
        aria-label="stalk10, back to title"
      >
        <Image src="/logo.svg" alt="" width={28} height={28} priority />
        <span>STALK<span className="text-lime-400">10</span></span>
      </a>
      <div className="relative flex min-h-[36px] items-center gap-2">{right}</div>
    </nav>
  );
}

export const pill = "glass-pill flex items-center gap-2 rounded-full px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider sm:px-4 sm:text-sm";
