import Link from "next/link";
export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05060a]/70 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-bold text-black">P</span>
          <span>Proof<span className="text-zinc-500">Feed</span></span>
        </Link>
        <div className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:text-white">Dashboard</Link>
          <Link href="/docs" className="rounded-lg px-3 py-1.5 text-zinc-400 hover:text-white">Docs</Link>
          <a href="/api/feed" className="hidden rounded-lg border border-white/10 px-3 py-1.5 font-mono text-xs text-cyan-300 hover:border-cyan-300/40 sm:inline">GET /api/feed</a>
        </div>
      </nav>
    </header>
  );
}
