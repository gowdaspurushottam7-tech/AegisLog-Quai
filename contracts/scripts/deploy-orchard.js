const hre = require("hardhat");
const quais = require("quais");
const artifact = require("../artifacts/contracts/LogAnchor.sol/LogAnchor.json");

async function main() {
    console.log("Connecting to Quai Orchard...");

    const config = hre.network.config;

    if (Number(config.chainId) !== 15000) {
        throw new Error("Wrong network! Expected Quai Orchard (15000).");
    }

    const privateKey = process.env.ORCHARD_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("ORCHARD_PRIVATE_KEY missing.");
    }

    const provider = new quais.JsonRpcProvider(
        "https://orchard.rpc.quai.network",
        undefined,
        { usePathing: true }
    );

    const wallet = new quais.Wallet(privateKey, provider);

    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);

    console.log("Network:", network.chainId.toString());
    console.log("Deployer:", wallet.address);
    console.log("Balance:", balance.toString(), "wei");

    if (network.chainId !== 15000n) {
        throw new Error("Network verification failed.");
    }

    if (balance === 0n) {
        throw new Error("Wallet has no QUAI. Fund it before deployment.");
    }

    console.log("Preparing LogAnchor deployment...");

    const factory = new quais.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
    );

    const contract = await factory.deploy();

    console.log("Deployment transaction:", contract.deploymentTransaction().hash);

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("================================");
    console.log("AEGISLOG DEPLOYMENT SUCCESSFUL");
    console.log("Contract address:", address);
    console.log("Network: Quai Orchard");
    console.log("Chain ID: 15000");
    console.log("================================");
}

main().catch(error => {
    console.error("Deployment failed:", error.message);
    process.exitCode = 1;
});
