//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface IStrategyFactory {
    function getBestStrategy(address token) external view returns (address);
    function addStrategy(address token, address strategy) external;
    function removeStrategy(address token, address strategy) external;
    function isValidStrategy(address _strategy) external view returns (bool);
}

