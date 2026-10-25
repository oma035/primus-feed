import { headers } from "next/headers";
import { getFeed, type Feed } from "@/lib/feed";
import { chainName, explorerTx } from "@/lib/config";
import StatusBadge from "@/components/StatusBadge";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fmt = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 4 : 2 });
const short = (s?: string) => (s ? `${s.slice(0, 10)}…${s.slice(-6)}` : "—");

// Read through our own CDN-cached /api/feed so page views never trigger extra attestations.
async function loadFeed(): Promise<Feed> {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  try {
    const r = await fetch(`${proto}://${host}/api/feed`, { cache: "no-store", signal: AbortSignal.timeout(58_000) });
    if (r.ok) return (await r.json()) as Feed;
  } catch {}
  return getFeed();
}

export default async function Dashboard() {
  const feed = await loadFeed();
  const a = feed.attestation;
  return (
    <main className="relative mx-auto max-w-6xl overflow-x-hidden px-5 py-10">
      <div className="glow pointer-events-none absolute inset-0 -z-10" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Live feed</h1>
          <p className="mt-1 text-sm text-zinc-400">{feed.source}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-0.5 font-medium ${feed.mode === "demo" ? "border-amber-400/30 text-amber-300" : "border-cyan-400/30 text-cyan-300"}`}>
            {feed.mode === "demo" ? "DEMO MODE" : `LIVE · ${a ? chainName(a.chainId) : "no proof"}`}
          </span>
          <AutoRefresh generatedAt={feed.generatedAt} />
        </div>
      </div>

      <div className={`mt-6 break-words rounded-xl border p-4 text-sm [overflow-wrap:anywhere] ${feed.proofStatus === "verified" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200" : feed.proofStatus === "failed" ? "border-rose-400/20 bg-rose-400/5 text-rose-200" : "border-amber-400/20 bg-amber-400/5 text-amber-200"}`}>
        {feed.proofNote}
        {feed.error && <div className="mt-1 font-mono text-xs opacity-70">error: {feed.error}</div>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {feed.points.map((p) => (
          <div key={p.symbol} className="card min-w-0 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-xs font-semibold text-white">{p.symbol}</span>
                <span className="font-mono text-xs text-zinc-500">{p.pair}</span>
              </div>
              <StatusBadge status={feed.proofStatus} />
            </div>
            <div className="mt-5 text-3xl font-semibold tracking-tight text-white tabular-nums">{fmt(p.price)}</div>
            <div className="mt-4 space-y-1 border-t border-white/5 pt-3 font-mono text-[11px] text-zinc-500">
              <div className="flex justify-between gap-3"><span>proof</span><span className={a ? "text-emerald-300" : "text-amber-300"}>{a ? short(a.signature) : "none"}</span></div>
              <div className="flex justify-between gap-3"><span>observed</span><span>{new Date(p.fetchedAt).toISOString().slice(11, 19)} UTC</span></div>
              <a href={p.sourceUrl} target="_blank" className="block truncate text-zinc-600 hover:text-zinc-300">{p.sourceUrl.replace("https://", "")}</a>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-white">Attestation details</h2>
          <StatusBadge status={feed.proofStatus} />
        </div>
        {a ? (
          <dl className="mt-4 grid gap-x-8 gap-y-3 font-mono text-xs sm:grid-cols-2">
            {[
              ["task id", a.taskId],
              ["attestor", a.attestor],
              ["attestor node", a.attestorUrl || "—"],
              ["attested at", new Date(a.timestamp).toISOString()],
              ["attestation time", a.attestationTimeMs ? `${a.attestationTimeMs} ms` : "—"],
              ["chain", `${chainName(a.chainId)} (${a.chainId})`],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-zinc-500">{k}</dt><dd className="break-all text-zinc-200">{v}</dd></div>
            ))}
            <div className="sm:col-span-2"><dt className="text-zinc-500">report tx</dt><dd className="break-all"><a className="text-cyan-300 hover:underline" target="_blank" href={explorerTx(a.chainId, a.reportTxHash)}>{a.reportTxHash}</a></dd></div>
            <div className="sm:col-span-2"><dt className="text-zinc-500">signature</dt><dd className="break-all text-zinc-300">{a.signature}</dd></div>
            <div className="sm:col-span-2"><dt className="text-zinc-500">attested data</dt><dd><pre className="mt-1 overflow-x-auto rounded-lg bg-black/40 p-3 text-zinc-300">{JSON.stringify(a.data, null, 2)}</pre></dd></div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-zinc-400">
            No attestation for this snapshot. {feed.mode === "demo"
              ? "Set PRIMUS_PRIVATE_KEY (a funded Base Sepolia burner wallet) to switch on real zkTLS proofs."
              : "The last attestation attempt failed; it will retry when the cache expires."}
          </p>
        )}
      </div>
    </main>
  );
}
