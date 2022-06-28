const Vault = artifacts.require("Vault");

const chai = require("chai");

const { assert } = chai;

const { expectRevert } = require("@openzeppelin/test-helpers");

const ERC20 = artifacts.require(
  "@openzeppelin/contracts/ERC20PresetFixedSupply"
);

const WETH = artifacts.require("canonical-weth/contracts/WETH9");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Vault", (accounts) => {
  const account = accounts[0];
  const depositValue = web3.utils.toWei("1", "ether");

  it("accepts ETH deposits", async () => {
    const vault = await Vault.deployed();
    await vault.depositETH({ from: account, value: depositValue });

    const balance = await vault.getETHBalance(account);
    assert.equal(balance.toString(), depositValue);

    const contractBal = await web3.eth.getBalance(vault.address);
    assert.equal(contractBal.toString(), depositValue);
  });

  it("rejects ETH withdrawals that are too large", async () => {
    const vault = await Vault.deployed();

    const withdrawValue = web3.utils.toWei("2", "ether");
    await expectRevert(
      vault.withdrawETH(withdrawValue, { from: account }),
      "insufficient ETH balance"
    );
  });

  it("rejects ETH withdrawals from other addresses", async () => {
    const vault = await Vault.deployed();

    const withdrawValue = web3.utils.toWei("1", "ether");
    await expectRevert(
      vault.withdrawETH(withdrawValue, { from: accounts[1] }),
      "insufficient ETH balance"
    );
  });

  it("accepts ETH withdrawals", async () => {
    const vault = await Vault.deployed();
    await vault.withdrawETH(depositValue, { from: account });

    const vaultBal = await vault.getETHBalance(account);
    assert.equal(vaultBal.toString(), "0");

    const contractBal = await web3.eth.getBalance(vault.address);
    assert.equal(contractBal.toString(), "0");
  });

  it("rejects further ETH withdrawals", async () => {
    const vault = await Vault.deployed();

    const withdrawValue = web3.utils.toWei("1", "ether");
    await expectRevert(
      vault.withdrawETH(withdrawValue, { from: account }),
      "insufficient ETH balance"
    );
  });

  it("accepts ETH deposits as plain transfers", async () => {
    const vault = await Vault.deployed();
    await vault.send(depositValue, { from: account });

    const balance = await vault.getETHBalance(account);
    assert.equal(balance.toString(), depositValue);

    await vault.withdrawETH(depositValue, { from: account });

    const afterBalance = await vault.getETHBalance(account);
    assert.equal(afterBalance.toString(), "0");
  });

  it("accepts ERC20 deposits and withdrawals", async () => {
    const vault = await Vault.deployed();
    const usdc = await ERC20.new("USD Coin", "USDC", depositValue, account);

    await usdc.approve(vault.address, depositValue, { from: account });
    const allowance = await usdc.allowance(account, vault.address);
    assert.equal(allowance.toString(), depositValue.toString());

    await vault.depositERC20(usdc.address, depositValue, { from: account });

    const balance = await vault.getERC20Balance(usdc.address, account);
    assert.equal(balance.toString(), depositValue.toString());

    await vault.withdrawERC20(usdc.address, depositValue);
    const afterBalance = await vault.getERC20Balance(usdc.address, account);
    assert.equal(afterBalance.toString(), "0");

    await expectRevert(
      vault.withdrawERC20(usdc.address, depositValue),
      "insufficient ERC20 balance"
    );
  });

  it("wraps ether", async () => {
    const weth = await WETH.deployed();
    const vault = await Vault.deployed();

    // Deposit 1 ETH
    await vault.depositETH({ from: account, value: depositValue });
    let ethBalance = await vault.getETHBalance(account);
    assert.equal(ethBalance.toString(), depositValue);

    // Wrap that Ether
    await vault.wrapETH(depositValue, { from: account });
    ethBalance = await vault.getETHBalance(account);
    assert.equal(ethBalance.toString(), "0");
    let wethBalance = await vault.getERC20Balance(weth.address, account);
    assert.equal(wethBalance.toString(), depositValue);
    const vaultWethBal = await weth.balanceOf(vault.address);
    assert.equal(vaultWethBal.toString(), depositValue);

    expectRevert(
      vault.wrapETH(depositValue, { from: account }),
      "insufficient ETH balance"
    );

    // Withdraw the wrapped Ether
    await vault.withdrawERC20(weth.address, depositValue);
    wethBalance = await vault.getERC20Balance(weth.address, account);
    assert.equal(wethBalance.toString(), "0");
    const accWethBalance = await weth.balanceOf(account);
    assert.equal(accWethBalance, depositValue);
  });

  it("unwraps ether", async () => {
    const weth = await WETH.deployed();
    const vault = await Vault.deployed();

    // Deposit 1 ETH
    await vault.depositETH({ from: account, value: depositValue });
    let ethBalance = await vault.getETHBalance(account);
    assert.equal(ethBalance.toString(), depositValue);

    // Wrap that Ether
    await vault.wrapETH(depositValue, { from: account });
    let wethBalance = await vault.getERC20Balance(weth.address, account);
    assert.equal(wethBalance.toString(), depositValue);

    // Unwrap that Ether
    await vault.unwrapETH(depositValue, { from: account });
    ethBalance = await vault.getETHBalance(account);
    assert.equal(ethBalance.toString(), depositValue);
    wethBalance = await vault.getERC20Balance(weth.address, account);
    assert.equal(wethBalance.toString(), "0");
    const vaultWethBal = await weth.balanceOf(vault.address);
    assert.equal(vaultWethBal.toString(), "0");

    expectRevert(
      vault.unwrapETH(depositValue, { from: account }),
      "insufficient WETH balance"
    );

    // Withdraw the Ether
    await vault.withdrawETH(depositValue, { from: account });
    ethBalance = await vault.getETHBalance(account);
    assert.equal(ethBalance.toString(), "0");
  });

  it("rejects ether wraps/unwraps with 0 balance", async () => {
    const vault = await Vault.deployed();

    expectRevert(
      vault.wrapETH(depositValue, { from: account }),
      "insufficient ETH balance"
    );
    expectRevert(
      vault.unwrapETH(depositValue, { from: account }),
      "insufficient WETH balance"
    );
  });

  it("swaps tokens via uniswap", async () => {
    const vault = await Vault.deployed();
    const weth = await WETH.deployed();

    const usdcValue = "1000000000";
    const usdc = await ERC20.new("USD Coin", "USDC", usdcValue, account);

    // Deposit USDC
    await usdc.approve(vault.address, usdcValue, { from: account });
    const allowance = await usdc.allowance(account, vault.address);
    assert.equal(allowance.toString(), usdcValue.toString());

    await vault.depositERC20(usdc.address, usdcValue, { from: account });
    const balance = await vault.getERC20Balance(usdc.address, account);
    assert.equal(balance.toString(), usdcValue);

    // Swap USDC for WETH
    await vault.swapERC20s(
      usdc.address,
      weth.address,
      usdcValue,
      depositValue,
      { from: account }
    );
    const usdcBalance = await vault.getERC20Balance(usdc.address, account);
    assert.equal(usdcBalance.toString(), "0");
    const wethBalance = await vault.getERC20Balance(weth.address, account);
    assert.equal(wethBalance.toString(), depositValue);

    // Cannot swap again.
    expectRevert(
      vault.swapERC20s(usdc.address, weth.address, usdcValue, depositValue, {
        from: account,
      }),
      "insufficient ERC20 balance"
    );
  });
});
