// Two crossing "case tapes", same as SOCIALTRACE's landing.
export default function Tapes() {
  const a = Array(10).fill("Look ● Remember ● Tap ●");
  const b = Array(10).fill("Everyone here is fictional ▲ The lesson is real ▲");
  return (
    <div aria-hidden className="pointer-events-none relative z-10 h-32 overflow-hidden sm:h-40">
      <div className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 -rotate-[6deg] bg-lime-400 py-3 shadow-[0_8px_30px_rgba(0,0,0,.6)] sm:-rotate-[3deg]">
        <div className="tape flex w-max gap-10 whitespace-nowrap font-mono text-2xl font-black uppercase tracking-tight text-black sm:text-4xl">
          {a.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
      <div className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 rotate-[4deg] bg-[#ECEAE2] py-2 sm:rotate-[2deg]">
        <div className="tape-rev flex w-max gap-10 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.2em] text-zinc-900 sm:text-base">
          {b.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}
