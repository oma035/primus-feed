export const ASSETS = [
  { symbol: "BTC", instId: "BTC-USDT" },
  { symbol: "ETH", instId: "ETH-USDT" },
  { symbol: "SOL", instId: "SOL-USDT" },
] as const;

export const SOURCE = "OKX public API (/api/v5/market/index-tickers)";
export const tickerUrl = (instId: string) =>
  `https://www.okx.com/api/v5/market/index-tickers?instId=${instId}`;

export const CACHE_TTL_MS = Number(process.env.FEED_CACHE_TTL_SECONDS || 300) * 1000;

export function primusConfig() {
  const privateKey = process.env.PRIMUS_PRIVATE_KEY;
  const chainId = Number(process.env.PRIMUS_CHAIN_ID || 84532);
  const rpcUrl =
    process.env.PRIMUS_RPC_URL ||
    (chainId === 8453 ? "https://mainnet.base.org" : "https://sepolia.base.org");
  return { enabled: Boolean(privateKey), privateKey, chainId, rpcUrl };
}

export const chainName = (id: number) =>
  id === 8453 ? "Base" : id === 84532 ? "Base Sepolia" : `chain ${id}`;
export const explorerTx = (id: number, tx: string) =>
  id === 8453 ? `https://basescan.org/tx/${tx}` : `https://sepolia.basescan.org/tx/${tx}`;
