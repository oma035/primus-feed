const sample = `{
  "mode": "live",
  "proofStatus": "verified",          // "verified" | "unverified-demo" | "failed"
  "proofNote": "...",
  "source": "OKX public API (/api/v5/market/index-tickers)",
  "generatedAt": 1761385200000,
  "cachedUntil": 1761385500000,
  "points": [
    { "symbol": "BTC", "pair": "BTC-USDT", "price": 0, "sourceUrl": "https://www.okx.com/...", "fetchedAt": 0 }
  ],
  "attestation": {                    // null unless proofStatus === "verified"
    "taskId": "0x…", "attestor": "0x…", "signature": "0x…",
    "reportTxHash": "0x…", "attestorUrl": "…phala.network",
    "timestamp": 0, "attestationTimeMs": 0, "chainId": 84532,
    "data": { "btcPrice": "…", "ethPrice": "…", "solPrice": "…" }
  }
}`;
const py = `import requests
feed = requests.get("https://YOUR-APP.vercel.app/api/feed").json()
assert feed["proofStatus"] == "verified", "refuse unproven data"
prices = {p["symbol"]: p["price"] for p in feed["points"]}`;

function H({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-12 scroll-mt-24 text-xl font-semibold text-white">{children}</h2>;
}
const Code = ({ children }: { children: string }) => (
  <pre className="card mt-3 overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-300">{children}</pre>
);

export default function Docs() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-zinc-300">
      <p className="font-mono text-xs text-violet-300">DOCS</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Using ProofFeed from an agent</h1>
      <p className="mt-3 text-zinc-400">One endpoint, plain JSON, no API key. Check <code className="text-cyan-300">proofStatus</code> before you act on a price.</p>

      <H>Endpoint</H>
      <Code>{`GET /api/feed\n→ 200 application/json   (CORS: *)\n  header X-Proof-Status: verified | unverified-demo | failed`}</Code>

      <H>Response</H>
      <Code>{sample}</Code>

      <H>Example (Python)</H>
      <Code>{py}</Code>

      <H id="modes">Proof modes</H>
      <ul className="mt-3 space-y-2 text-sm">
        <li><span className="text-emerald-300">verified</span> — prices come straight out of a Primus zkTLS attestation (<code>attestation.data</code>), signed by a Primus Network attestor; the task is reported on Base.</li>
        <li><span className="text-amber-300">unverified-demo</span> — no attestation wallet configured. Prices are fetched directly from OKX and are real, but nothing proves it. <code>attestation</code> is <code>null</code>.</li>
        <li><span className="text-rose-300">failed</span> — an attestation was attempted and failed; prices are served unverified with an <code>error</code> field.</li>
      </ul>

      <H>How to check a proof yourself</H>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        <li>Confirm <code>attestation.data</code> matches the prices in <code>points</code>.</li>
        <li>Check freshness: reject if <code>Date.now() - attestation.timestamp</code> is too large for your use case.</li>
        <li>Look up <code>reportTxHash</code> on BaseScan and confirm it was sent to the Primus task contract.</li>
        <li>For full verification, call Primus&apos;s <code>verifyAndPollTaskResult</code> from <code>@primuslabs/network-core-sdk</code> with the <code>taskId</code>, or verify on-chain with <code>@primuslabs/zktls-contracts</code>.</li>
      </ol>

      <H>Freshness &amp; caching</H>
      <p className="mt-3 text-sm">Each attestation costs a small on-chain fee, so one is reused for <code>FEED_CACHE_TTL_SECONDS</code> (default 300s). Responses are edge-cached until the snapshot&apos;s <code>cachedUntil</code>, so all callers share one attestation. A daily Vercel cron (06:00 UTC) hits <code>/api/cron</code>, which requires the <code>CRON_SECRET</code> bearer token.</p>
    </main>
  );
}
