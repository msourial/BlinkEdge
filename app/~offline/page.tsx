"use client";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, rgba(10,10,15,0.8) 0%, #0a0a0f 100%)",
      }}
    >
      <div className="flex flex-col items-center text-center max-w-sm gap-4">
        <h1 className="font-mono text-xl font-semibold text-slate-200">
          You&apos;re Offline
        </h1>
        <p className="font-sans text-sm text-slate-400">
          This screen was cached earlier. Some data may be outdated.
        </p>
        <button
          onClick={() => window.history.back()}
          className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/25 border-2 border-cyan-400 text-cyan-200 font-bold tracking-widest uppercase rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
