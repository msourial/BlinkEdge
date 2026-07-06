export default function Home() {
  return (
    <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--color-primary)" }}>
          BlinkEdge
        </h1>
        <p className="text-ink-muted">NeonChrome design system loaded.</p>
        <p className="text-ink-faint text-sm mt-2">Camera + HUD widgets coming next.</p>
      </div>
    </main>
  );
}
