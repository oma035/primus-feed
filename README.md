# ProofFeed: provably real market data for AI agents

A Next.js 14 (App Router, TypeScript, Tailwind) app that serves BTC/ETH/SOL prices from OKX's public API with a **Primus Network zkTLS attestation**. AI agents call one JSON endpoint and get the data, the attestor's signature, the task ID and the on-chain report tx.

- `/` is the landing page
- `/dashboard` is the live feed, showing each price with its proof status and full attestation details
- `/docs` is the guide for agent developers
- `GET /api/feed` returns JSON (CORS `*`, `X-Proof-Status` header)
- `GET /api/cron` forces a fresh attestation (used by Vercel Cron)

## How it works
`lib/feed.ts` builds the feed. When `PRIMUS_PRIVATE_KEY` is set, it spawns `scripts/attest.cjs`, a plain Node process running `@primuslabs/network-core-sdk`:
`init(wallet, chainId)` → `submitTask({address})` → `attest({requests, responseResolves})`.
The prices shown are read **from the attestation's `data`**, not from a separate fetch.
The SDK runs in a child process because it assigns `global.WebSocket`, which Next.js's server runtime blocks with a getter-only property.

### Modes (honest by default)
| proofStatus | when | attestation |
|---|---|---|
| `verified` | key set, attestation succeeded | full object |
| `unverified-demo` | no `PRIMUS_PRIVATE_KEY` | `null`; prices are real OKX data, clearly labelled |
| `failed` | key set but the attempt failed (e.g. no funds) | `null` plus an `error` field |

No proof hash is ever invented.

### Caching / Vercel limits
- Each attestation is an on-chain task (it costs fees and takes about 10–30s). Results are cached in memory for `FEED_CACHE_TTL_SECONDS` (default 300). Concurrent requests share one in-flight attestation.
- `/api/feed` is edge-cached until `cachedUntil` (`s-maxage` = seconds left), and `/dashboard` reads through that cached endpoint, so all viewers and instances share one attestation per TTL.
- Functions use `maxDuration = 60`, and the child process is killed after 55s.
- `vercel.json` runs a daily cron (`0 6 * * *`, works on Hobby) that warms `/api/cron`; set `CRON_SECRET` so only Vercel can call it.
- The in-memory cache is per serverless instance. For a shared cache, add Vercel KV or Upstash.

## Setup
```bash
npm install
cp .env.example .env.local   # leave PRIMUS_PRIVATE_KEY empty for demo mode
npm run dev                  # http://localhost:3000
```

## Environment variables
| var | required | default | notes |
|---|---|---|---|
| `PRIMUS_PRIVATE_KEY` | for live proofs | (none) | **Use a burner wallet.** It pays Primus task fees and gas. |
| `PRIMUS_CHAIN_ID` | no | `84532` | `84532` Base Sepolia, `8453` Base mainnet |
| `PRIMUS_RPC_URL` | no | public Base RPC | |
| `FEED_CACHE_TTL_SECONDS` | no | `300` | |
| `CRON_SECRET` | no | (none) | protects `/api/cron` |

Get Base Sepolia ETH from https://www.alchemy.com/faucets/base-sepolia. Check the Primus docs for which token pays task fees on your chain.

## Deploy to Vercel
```bash
npm i -g vercel
vercel login
vercel link
vercel env add PRIMUS_PRIVATE_KEY   # optional; without it the app runs in demo mode
vercel --prod
```
Or push to GitHub and import the repo at vercel.com/new (framework: Next.js).

## Verifying a proof
Compare `attestation.data` to `points`, check the `timestamp` is fresh, and look up `reportTxHash` on BaseScan. For full verification, use `verifyAndPollTaskResult({ taskId })` from the SDK or `@primuslabs/zktls-contracts` on-chain.

## References
- Primus docs: https://docs.primuslabs.xyz
- Network SDK skill and examples: https://github.com/primus-labs/skills/tree/main/primus-network-core-sdk
- Supported chains: https://github.com/primus-labs/primus-network-startup
