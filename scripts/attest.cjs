// Runs one Primus Network zkTLS attestation in a plain Node process.
// Isolated from Next.js because the SDK assigns `global.WebSocket`, which Next locks.
// Input: JSON on stdin { rpcUrl, chainId, requests, responseResolves }. Key from env PRIMUS_PRIVATE_KEY.
// Output: one JSON line on stdout { ok, result | error }.
const { PrimusNetwork } = require("@primuslabs/network-core-sdk");
const { ethers } = require("ethers");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", async () => {
  const out = (o) => process.stdout.write("\n@@RESULT@@" + JSON.stringify(o) + "\n");
  try {
    const { rpcUrl, chainId, requests, responseResolves } = JSON.parse(input);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIMUS_PRIVATE_KEY, provider);
    const primus = new PrimusNetwork();
    await primus.init(wallet, chainId);
    const submitParams = { address: wallet.address };
    const submitResult = await primus.submitTask(submitParams);
    const result = await primus.attest({ ...submitParams, ...submitResult, requests, responseResolves });
    out({ ok: true, result });
    process.exit(0);
  } catch (e) {
    out({ ok: false, error: String((e && (e.message || e.code)) || e) });
    process.exit(1);
  }
});
