const Vault = artifacts.require('Vault');
const MockUNI = artifacts.require('MockSwapRouter');

const WETH = artifacts.require('canonical-weth/WETH9');

const ropstenWETHAddr = '0xc778417e063141139fce010982780140aa0cd5ab';
const uniSwapRouterAddr = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

async function getDeployedWETH(deployer, network) {
  if (network === 'ropsten') {
    return ropstenWETHAddr;
  }

  await deployer.deploy(WETH);
  const weth = await WETH.deployed();
  return weth.address;
}

async function getDeployedUni(deployer, network) {
  if (network !== 'test') {
    return uniSwapRouterAddr;
  }

  await deployer.deploy(MockUNI);
  const uni = await MockUNI.deployed();
  return uni.address;
}

module.exports = async function (deployer, network) {
  const WETHAddr = await getDeployedWETH(deployer, network);
  const uniAddr = await getDeployedUni(deployer, network);

  await deployer.deploy(Vault, WETHAddr, uniAddr);
};
