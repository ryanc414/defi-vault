DeFi Vault
----------

Example DeFi smart contract, written in Solidity for Ethereum and all other
EVM compatible blockchains.

Contract code may be found under contracts, in particular `contracts/Vault.go`
contains the smart contract I have written to support ETH + ERC20 deposits
and withdrawals, ETH wrapping/unwrapping and uniswap trading.

Tests are found under test/, this covers the basic functionality of the Vault
contract. Tests may be run via `npm test`, after first installing dependencies
via `npm install`.

The Vault contract is deployed on Goerli here:
https://goerli.etherscan.io/address/0x9697b2b7fb88f979d7bdad5a4cfab0c75d8df87e

