// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IScaledBalanceToken.sol";

interface IAToken is IERC20, IScaledBalanceToken {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
