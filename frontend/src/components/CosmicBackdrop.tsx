export function CosmicBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 cosmic-grid opacity-40" />

      <div className="absolute -top-28 -left-20 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl animate-drift-slow" />
      <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-cyan-400/20 blur-3xl animate-drift-reverse" />
      <div className="absolute -bottom-32 left-1/3 w-[26rem] h-[26rem] rounded-full bg-indigo-500/25 blur-3xl animate-drift-slow" />

      <div className="absolute top-[16%] left-[12%] w-8 h-8 rounded-md bg-white/20 rotate-12 animate-float-slow" />
      <div className="absolute top-[26%] right-[18%] w-6 h-6 rounded-full bg-cyan-300/50 animate-float-reverse" />
      <div className="absolute bottom-[24%] right-[28%] w-10 h-10 rounded-lg bg-primary/30 rotate-45 animate-float-slow" />
      <div className="absolute bottom-[18%] left-[20%] w-7 h-7 rounded-md bg-blue-300/30 -rotate-12 animate-float-reverse" />
    </div>
  );
}
