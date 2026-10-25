/* eslint-disable @typescript-eslint/no-explicit-any -- SDK results are untyped JSON */
import "server-only";
import { spawn } from "node:child_process";
import path from "node:path";
import { ASSETS, CACHE_TTL_MS, SOURCE, primusConfig, tickerUrl } from "./config";

export type ProofStatus = "verified" | "unverified-demo" | "failed";

export interface Attestation {
  taskId: string;
  attestor: string;
  signature: string;
  reportTxHash: string;
  attestorUrl?: string;
  timestamp: number;
  attestationTimeMs?: number;
  data: Record<string, string>;
  chainId: number;
}

export interface DataPoint {
  symbol: string;
  pair: string;
  price: number | null;
  sourceUrl: string;
  fetchedAt: number;
}

export interface Feed {
  mode: "live" | "demo";
  proofStatus: ProofStatus;
  proofNote: string;
  source: string;
  generatedAt: number;
  cachedUntil: number;
  points: DataPoint[];
  attestation: Attestation | null;
  error?: string;
  wallet?: string;
}

let cache: Feed | null = null;
let inflight: Promise<Feed> | null = null;

async function fetchPrice(instId: string): Promise<number | null> {
  try {
    const r = await fetch(tickerUrl(instId), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    const v = Number(j?.data?.[0]?.idxPx);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

async function plainPoints(): Promise<DataPoint[]> {
  return Promise.all(
    ASSETS.map(async (a) => ({
      symbol: a.symbol,
      pair: a.instId,
      price: await fetchPrice(a.instId),
      sourceUrl: tickerUrl(a.instId),
      fetchedAt: Date.now(),
    })),
  );
}

function runAttestation(payload: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), "scripts", "attest.cjs");
    const child = spawn(process.execPath, [script], { env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("Attestation timed out")); }, 55_000);
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", () => {
      clearTimeout(timer);
      const line = stdout.split("\n").find((l) => l.startsWith("@@RESULT@@"));
      if (!line) {
        const key = stderr.split("\n").find((l) => /Error|Cannot find/.test(l)) || stderr.slice(-200);
        return reject(new Error(`Attestor process crashed: ${key.trim()}`));
      }
      const msg = JSON.parse(line.slice(10));
      if (msg.ok) return resolve(msg.result);
      const err: any = new Error(msg.error);
      err.wallet = msg.address;
      return reject(err);
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

async function attestedFeed(): Promise<Feed> {
  const cfg = primusConfig();
  const now = Date.now();
  const requests = ASSETS.map((a) => ({ url: tickerUrl(a.instId), method: "GET", header: {}, body: "" }));
  const responseResolves = ASSETS.map((a) => [
    { keyName: `${a.symbol.toLowerCase()}Price`, parseType: "json", parsePath: "$.data[0].idxPx" },
  ]);
  const result: any = await runAttestation({ rpcUrl: cfg.rpcUrl, chainId: cfg.chainId, requests, responseResolves });
  const r = result?.[0];
  if (!r?.attestation?.data || !r?.signature) throw new Error("Attestor returned no attestation");
  const data = JSON.parse(r.attestation.data) as Record<string, string>;

  const points: DataPoint[] = ASSETS.map((a) => {
    const v = Number(data[`${a.symbol.toLowerCase()}Price`]);
    return {
      symbol: a.symbol,
      pair: a.instId,
      price: Number.isFinite(v) ? v : null,
      sourceUrl: tickerUrl(a.instId),
      fetchedAt: r.attestation.timestamp,
    };
  });

  return {
    mode: "live",
    proofStatus: "verified",
    proofNote: "Prices are taken from the zkTLS attestation itself, signed by a Primus Network attestor and reported on-chain.",
    source: SOURCE,
    generatedAt: now,
    cachedUntil: now + CACHE_TTL_MS,
    points,
    attestation: {
      taskId: r.taskId,
      attestor: r.attestor,
      signature: r.signature,
      reportTxHash: r.reportTxHash,
      attestorUrl: r.attestorUrl,
      timestamp: r.attestation.timestamp,
      attestationTimeMs: r.attestationTime,
      data,
      chainId: cfg.chainId,
    },
  };
}

function hintFor(error: string, wallet?: string): string {
  if (/insufficient (balance|funds)/i.test(error))
    return `Attestation wallet${wallet ? ` ${wallet}` : ""} has no Base Sepolia ETH to pay the Primus task fee + gas. Fund it from a faucet (e.g. alchemy.com/faucets/base-sepolia), then refresh. Prices below are real but unverified.`;
  if (/timed out/i.test(error)) return "The Primus attestor took too long (>55s). Prices below are real but unverified; it will retry automatically.";
  return "Attestation failed, so these prices are served unverified. Do not treat them as proven.";
}

async function demoFeed(error?: string, wallet?: string): Promise<Feed> {
  const now = Date.now();
  const failed = Boolean(error);
  return {
    mode: failed ? "live" : "demo",
    proofStatus: failed ? "failed" : "unverified-demo",
    proofNote: failed
      ? hintFor(error!, wallet)
      : "Demo mode: real prices fetched directly from OKX, but NOT attested. No proof exists for these values.",
    source: SOURCE,
    generatedAt: now,
    cachedUntil: now + (failed ? 60_000 : 30_000),
    points: await plainPoints(),
    attestation: null,
    ...(error ? { error } : {}),
    ...(wallet ? { wallet } : {}),
  };
}

export async function buildFeed(): Promise<Feed> {
  if (!primusConfig().enabled) return demoFeed();
  try {
    return await attestedFeed();
  } catch (e: any) {
    console.error("[primus-feed] attestation failed", e);
    return demoFeed(String(e?.message || e).slice(0, 300), e?.wallet);
  }
}

export async function getFeed(force = false): Promise<Feed> {
  if (!force && cache && cache.cachedUntil > Date.now()) return cache;
  if (!inflight) {
    inflight = buildFeed()
      .then((f) => (cache = f))
      .finally(() => (inflight = null));
  }
  return inflight;
}
