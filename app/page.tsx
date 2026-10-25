import Link from "next/link";

const steps = [
  { n: "01", t: "Fetch over TLS", d: "A Primus Network attestor joins the HTTPS session to OKX's public price API, so the response can't be forged by us or anyone in between." },
  { n: "02", t: "Attest with zkTLS", d: "The attestor signs exactly what OKX returned (BTC, ETH, SOL index prices) and reports the task on Base." },
  { n: "03", t: "Serve to agents", d: "Agents call /api/feed and get the prices plus the signature, attestor, task ID and on-chain tx to check." },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="glow pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Powered by Primus zkTLS on Base
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Provably real market data <span className="grad-text">for AI agents</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-zinc-400 sm:text-lg">
          Your agent shouldn&apos;t trade on a number it can&apos;t check. ProofFeed serves crypto prices with a zkTLS attestation showing they really came from the exchange.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-200">Open live feed →</Link>
          <Link href="/docs" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-200 hover:border-white/30">Agent docs</Link>
        </div>
        <div className="card mx-auto mt-14 max-w-2xl p-0 text-left">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
            <span className="ml-3 font-mono text-xs text-zinc-500">agent.ts</span>
          </div>
          <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-zinc-300">{`const feed = await fetch("/api/feed").then(r => r.json());

if (feed.proofStatus !== "verified") throw new Error("unproven data");
const btc = feed.points.find(p => p.symbol === "BTC").price;
// feed.attestation → { taskId, attestor, signature, reportTxHash }`}</pre>
        </div>
      </section>
      <section className="relative mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card p-6">
            <div className="font-mono text-xs text-violet-300">{s.n}</div>
            <h3 className="mt-3 font-medium text-white">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.d}</p>
          </div>
        ))}
      </section>
      <section className="relative mx-auto max-w-6xl px-5 pb-24">
        <div className="card flex flex-col items-start justify-between gap-4 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-medium text-white">Honest by default</h3>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">Without a configured attestation wallet the app runs in demo mode: prices are still real, but every point is labelled <span className="text-amber-300">unverified – demo</span>. We never show a proof that doesn&apos;t exist.</p>
          </div>
          <Link href="/docs#modes" className="shrink-0 text-sm text-cyan-300 hover:underline">How modes work →</Link>
        </div>
      </section>
    </main>
  );
}
