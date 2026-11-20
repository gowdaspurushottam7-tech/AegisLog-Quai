const fs = require("fs");
const path = require("path");
const quais = require("quais");

async function main() {
    console.log("Creating Quai HD wallet...");

    const wallet = quais.QuaiHDWallet.createRandom();

    const account = 0;
    const zone = quais.Zone.Cyprus1;

    const info = await wallet.getNextAddress(account, zone);

    const privateKey = wallet.getPrivateKey(info.address);

    const detectedZone = quais.getZoneForAddress(info.address);

    if (detectedZone !== zone) {
        throw new Error("Generated address is not in Cyprus1");
    }

    const envPath = path.join(__dirname, "..", ".env.local");

    let env = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf8")
        : "";

    env = env.replace(/^ORCHARD_RPC_URL=.*$/m, "");
    env = env.replace(/^ORCHARD_PRIVATE_KEY=.*$/m, "");

    env += "\nORCHARD_RPC_URL=https://orchard.rpc.quai.network/cyprus1";
    env += "\nORCHARD_PRIVATE_KEY=" + privateKey + "\n";

    fs.writeFileSync(envPath, env);

    console.log("Quai wallet created successfully!");
    console.log("Wallet address:", info.address);
    console.log("Wallet zone:", detectedZone);
    console.log("Network: Cyprus1");
    console.log("Private key saved locally in .env.local");
}

main().catch(error => {
    console.error("Wallet creation failed:", error.message);
    process.exitCode = 1;
});
