// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
pragma abicoder v2;

import "./IWeth.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract Vault {
    mapping(address => uint256) internal ethBalances;
    mapping(address => mapping(address => uint256)) internal erc20Balances;
    IWeth internal immutable weth;
    ISwapRouter internal immutable swapRouter;
    uint24 internal constant POOL_FEE = 3000;

    constructor(IWeth _weth, ISwapRouter _swapRouter) {
        weth = _weth;
        swapRouter = _swapRouter;
    }

    function depositETH() public payable {
        ethBalances[msg.sender] += msg.value;
    }

    receive() external payable {
        if (msg.sender != address(weth)) {
            depositETH();
        }
    }

    function getETHBalance(address addr) public view returns (uint256) {
        return ethBalances[addr];
    }

    function withdrawETH(uint256 withdrawAmount) public {
        require(
            ethBalances[msg.sender] >= withdrawAmount,
            "insufficient ETH balance"
        );

        // Decrement balance before transferring to prevent re-entrancy attacks.
        ethBalances[msg.sender] -= withdrawAmount;
        payable(msg.sender).transfer(withdrawAmount);
    }

    function depositERC20(address tokenAddr, uint256 amount) public {
        require(
            IERC20(tokenAddr).transferFrom(msg.sender, address(this), amount),
            "ERC20 transfer failed"
        );
        erc20Balances[tokenAddr][msg.sender] += amount;
    }

    function withdrawERC20(address tokenAddr, uint256 amount) public {
        require(
            erc20Balances[tokenAddr][msg.sender] >= amount,
            "insufficient ERC20 balance"
        );
        erc20Balances[tokenAddr][msg.sender] -= amount;
        require(
            IERC20(tokenAddr).transfer(msg.sender, amount),
            "ERC20 transfer failed"
        );
    }

    function getERC20Balance(address tokenAddr, address ownerAddr)
        public
        view
        returns (uint256)
    {
        return erc20Balances[tokenAddr][ownerAddr];
    }

    function wrapETH(uint256 amount) public {
        require(ethBalances[msg.sender] >= amount, "insufficient ETH balance");
        ethBalances[msg.sender] -= amount;
        erc20Balances[address(weth)][msg.sender] += amount;
        weth.deposit{value: amount}();
    }

    function unwrapETH(uint256 amount) public {
        require(
            erc20Balances[address(weth)][msg.sender] >= amount,
            "insufficient WETH balance"
        );

        erc20Balances[address(weth)][msg.sender] -= amount;
        ethBalances[msg.sender] += amount;
        weth.withdraw(amount);
    }

    function swapERC20s(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 toAmountMin
    ) public returns (uint256) {
        require(
            erc20Balances[fromToken][msg.sender] >= fromAmount,
            "insufficient ERC20 balance"
        );
        erc20Balances[fromToken][msg.sender] -= fromAmount;

        // Approve the Uniswap router to spend the tokens owned by this contract.
        TransferHelper.safeApprove(fromToken, address(swapRouter), fromAmount);

        // Construct swap parameters and make the swap.
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: fromToken,
                tokenOut: toToken,
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: fromAmount,
                amountOutMinimum: toAmountMin,
                sqrtPriceLimitX96: 0
            });

        uint256 toAmount = swapRouter.exactInputSingle(params);
        erc20Balances[toToken][msg.sender] += toAmount;

        return toAmount;
    }
}
