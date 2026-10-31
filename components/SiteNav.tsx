import Image from "next/image";

/** Glass nav pill (SOCIALTRACE family look). Clicking it goes back to the title. */
export default function SiteNav({ onHome }: { onHome?: () => void }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-4 sm:top-5">
      <a
        href="/"
        onClick={(e) => {
          if (!onHome) return;
          e.preventDefault();
          onHome();
        }}
        className="pointer-events-auto flex min-h-[48px] items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-2.5 pr-5 shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-xl transition-colors hover:border-lime-400/40"
        aria-label="10-Second Sleuth, back to title"
        data-testid="nav"
      >
        <Image src="/logo.svg" alt="" width={26} height={26} priority />
        <span className="font-mono text-[13px] font-bold uppercase tracking-[0.18em] sm:text-sm">
          10-Second <span className="text-lime-400">Sleuth</span>
        </span>
      </a>
    </nav>
  );
}
