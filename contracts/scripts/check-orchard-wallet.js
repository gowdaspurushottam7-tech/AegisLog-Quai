const quais = require("quais");

async function main() {
  console.log("Step 1: Loading wallet...");

  const privateKey = process.env.ORCHARD_PRIVATE_KEY;
  if (!privateKey) throw new Error("Private key not loaded.");

  console.log("Step 2: Connecting to Quai Orchard...");

  const provider = new quais.JsonRpcProvider(
    "https://orchard.rpc.quai.network",
    undefined,
    { usePathing: true }
  );

  const timeout = (promise, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(label + " timed out")), 15000)
      )
    ]);

  console.log("Step 3: Checking network...");
  const network = await timeout(provider.getNetwork(), "Network check");

  console.log("Network Chain ID:", network.chainId.toString());

  console.log("Step 4: Creating wallet...");
  const wallet = new quais.Wallet(privateKey, provider);

  console.log("Wallet address:", wallet.address);

  console.log("Step 5: Checking balance...");
  const balance = await timeout(
    provider.getBalance(wallet.address),
    "Balance check"
  );

  console.log("Wallet balance (wei):", balance.toString());
  console.log("Wallet check completed!");
}

main().catch(error => {
  console.error("Wallet check failed:", error.message);
  process.exitCode = 1;
});
