//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface IStrategy {
    function invest(address token, uint256 amount) external; 
    function withdraw(address token, uint256 amount) external;
    function getAPY(address token) external view returns (uint256);
    function getTotalBalance(address token) external view returns (uint256);

   
}
