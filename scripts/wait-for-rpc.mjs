import { setTimeout as delay } from "node:timers/promises";

const url = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const maxAttempts = 40;

for (let i = 1; i <= maxAttempts; i += 1) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.result) {
        console.log(`Hardhat RPC ready at ${url}`);
        process.exit(0);
      }
    }
  } catch {
    // retry
  }
  await delay(500);
}

console.warn(`Hardhat RPC not reachable at ${url}. Backend will use labeled mock mode if enabled.`);
process.exit(0);
