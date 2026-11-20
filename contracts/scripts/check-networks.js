const hre = require("hardhat");

for (const [name, network] of Object.entries(hre.config.networks)) {
  console.log(
    name,
    "| Chain ID:", network.chainId,
    "| RPC:", network.url || "Local network",
    "| Wallet configured:", !!(network.accounts && network.accounts.length)
  );
}
