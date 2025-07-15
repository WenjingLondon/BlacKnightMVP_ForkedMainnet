// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IScaledBalanceToken {
    function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256);
}
