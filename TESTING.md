# How to test ProofFeed (no coding needed)

1. Open https://primus-feed.vercel.app. You should see the dark home page with the headline "Provably real market data for AI agents". Tap **Open live feed**.
2. On the **Dashboard** you'll see BTC, ETH and SOL prices. Check that they're close to what CoinMarketCap shows. The badge on each card tells you the mode:
   - **Red "attestation failed"**: the proof wallet has no test ETH. The box at the top says so and shows the wallet address and a faucet link. The prices are real but not proven. This is the current state.
   - **Green "zkTLS verified"**: the proof worked. The "Attestation details" box fills in with a task ID, attestor, signature and a blue **report tx** link. Tap it to open the transaction on BaseScan.
   - **Yellow "unverified – demo"**: no wallet is set up at all.
3. Tap **refresh** at the top right. The "snapshot Xs ago" counter resets. A new proof is made at most every 5 minutes.
4. Open **Docs** and check that the page reads properly on your phone.
5. Raw data for agents: open https://primus-feed.vercel.app/api/feed in a browser, or run:
   `curl -s https://primus-feed.vercel.app/api/feed`
   Look for `"proofStatus"`, which will be `verified`, `failed` or `unverified-demo`.

**To get a real proof:** send about 0.01 Base Sepolia ETH from a faucet (for example https://www.alchemy.com/faucets/base-sepolia) to `0x837a399054eB56D95836C44dbEc1efa511B80445`. Wait a minute, then refresh the dashboard. Tap refresh again if needed, since the failed state can stay cached for up to a minute.
