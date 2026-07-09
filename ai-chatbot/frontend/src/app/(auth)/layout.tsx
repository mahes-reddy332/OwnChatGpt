export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] p-4 text-[var(--text-primary)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 app-grid-bg opacity-80" />
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[15%] right-[10%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
