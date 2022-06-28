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
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    goerli: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: MNEMONIC,
          },
          providerOrUrl: `https://goerli.infura.io/v3/${PROJECT_ID}`,
        }),
      network_id: 5,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.15",
    },
  },

  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
};
