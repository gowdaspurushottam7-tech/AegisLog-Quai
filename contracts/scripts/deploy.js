const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of LogAnchor contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const LogAnchor = await hre.ethers.getContractFactory("LogAnchor");
  const logAnchor = await LogAnchor.deploy();
  await logAnchor.waitForDeployment();

  const contractAddress = await logAnchor.getAddress();
  console.log("LogAnchor deployed successfully to:", contractAddress);

  // Extract ABI
  const artifact = await hre.artifacts.readArtifact("LogAnchor");

  const config = {
    address: contractAddress,
    abi: artifact.abi,
    network: hre.network.name,
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Target paths: shared, backend, frontend
  const targets = [
    path.resolve(__dirname, "../../shared/contract_config.json"),
    path.resolve(__dirname, "../../backend/contract_config.json"),
    path.resolve(__dirname, "../../frontend/src/contract_config.json")
  ];

  for (const targetPath of targets) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf8");
    console.log(`Saved contract config to: ${targetPath}`);
  }

  console.log("\n--- LogAnchor Deployment Summary ---");
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Network          : ${hre.network.name} (Chain ID 31337)`);
  console.log("------------------------------------\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
