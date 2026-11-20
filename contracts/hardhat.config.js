require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + "/.env.local" });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
  optimizer: {
    enabled: true,
    runs: 200,
  },
  evmVersion: "london",
},
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    orchard: {
      url: process.env.ORCHARD_RPC_URL || "https://orchard.rpc.quai.network/cyprus1",
      chainId: 15000,
      accounts: process.env.ORCHARD_PRIVATE_KEY
        ? [process.env.ORCHARD_PRIVATE_KEY]
        : [],
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
