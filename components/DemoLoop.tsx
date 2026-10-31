/* eslint-disable @next/next/no-img-element */
/** Attract-mode loop: a mini profile blurs away, then a question pops up and gets answered. CSS only. */
export default function DemoLoop() {
  return (
    <div className="relative mx-auto h-[262px] w-full max-w-[340px] sm:h-[300px] sm:max-w-[400px]" aria-hidden>
      {/* the profile */}
      <div className="demo-profile absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-[#121211]">
        <div className="h-14 sm:h-20" style={{ background: "linear-gradient(120deg,#f59e0b,#ef4444 60%,#7c3aed)" }} />
        <div className="flex items-start justify-between px-4 sm:px-5">
          <img src="/pfp/p-cat.webp" alt="" className="-mt-8 h-16 w-16 rounded-full border-4 border-[#121211] object-cover sm:h-[72px] sm:w-[72px]" />
          <svg viewBox="0 0 40 40" className="mt-2 h-11 w-11 -rotate-90">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
            <circle className="demo-ring" cx="20" cy="20" r="18" fill="none" stroke="#a3e635" strokeWidth="4" strokeDasharray="113" strokeLinecap="round" />
          </svg>
        </div>
        <div className="px-4 sm:px-5">
          <p className="text-lg font-extrabold leading-tight">Mira Joshi</p>
          <p className="text-sm text-zinc-500">@mira_snaps</p>
          <p className="mt-1.5 text-[15px]">Cat mum to Biscuit 🐈 Photographer in Pune.</p>
        </div>
        <div className="mt-3 space-y-0 divide-y divide-white/[0.07] border-t border-white/[0.07] text-[14px]">
          <p className="flex justify-between px-4 py-2 sm:px-5">Booked tickets to Goa!! <span className="font-mono text-zinc-500">5h</span></p>
          <p className="hidden justify-between px-4 py-2 sm:flex sm:px-5">Sunday pottery class 🫶 <span className="font-mono text-zinc-500">1d</span></p>
        </div>
      </div>
      {/* the question */}
      <div className="demo-quiz absolute inset-0 flex flex-col justify-center rounded-3xl border-2 border-lime-400/60 bg-ink p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">Question 1 / 5</p>
        <p className="mt-2 text-[26px] font-black uppercase leading-[0.9] tracking-tighter sm:text-3xl">What is Mira&apos;s cat called?</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[15px] font-bold">
          {["Mochi", "Biscuit", "Pepper", "Noodle"].map((o) => (
            <span
              key={o}
              className={`relative rounded-xl border px-3 py-2.5 ${o === "Biscuit" ? "demo-pick" : "border-white/10 bg-white/[0.06]"}`}
            >
              {o}
              {o === "Biscuit" && (
                <span className="demo-tap absolute right-3 top-1/2 -mt-3 h-6 w-6 rounded-full border-2 border-white bg-white/40" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
