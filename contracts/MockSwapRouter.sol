// SPDX-License-Identifier: MIT
// Mock Uniswap Swap Router for local testing purposes.
pragma solidity >=0.8.0 <0.9.0;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract MockSwapRouter {
    function exactInputSingle(
        ISwapRouter.ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut) {
        // This does not actually swap any tokens - just a minimal no-op for
        // testing purposes.
        return params.amountOutMinimum;
    }
}
