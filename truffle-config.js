require("dotenv").config();

const { PROJECT_ID, MNEMONIC, ETHERSCAN_API_KEY } = process.env;

const HDWalletProvider = require("@truffle/hdwallet-provider");

require("dotenv").config();

module.exports = {
  networks: {
    ropsten: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: MNEMONIC,
          },
          providerOrUrl: `https://ropsten.infura.io/v3/${PROJECT_ID}`,
        }),
      network_id: 3, // Ropsten's id
      gas: 5500000, // Ropsten has a lower block limit than mainnet
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.15", // Fetch exact version from solc-bin (default: truffle's version)
    },
  },

  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
};
