// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../Interfaces/IStrategy.sol";

contract StrategyFactory {
    struct StrategyInfo {
        address strategy;
        bool isActive;
    }

    mapping(address => StrategyInfo[]) public tokenStrategies;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addStrategy(address _token, address _strategy) external onlyOwner {
        require(_strategy != address(0), "Invalid strategy address");
        StrategyInfo[] storage strategies = tokenStrategies[_token];
        for (uint256 i = 0; i < strategies.length; i++) {
            require(strategies[i].strategy != _strategy, "Strategy already exists");
        }
        strategies.push(StrategyInfo(_strategy, true));
    }

    function removeStrategy(address _token, address _strategy) external onlyOwner {
        StrategyInfo[] storage strategies = tokenStrategies[_token];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].strategy == _strategy) {
                strategies[i].isActive = false;
                break;
            }
        }
    }

    function isValidStrategy(address _token, address _strategy) external view returns (bool) {
        StrategyInfo[] storage strategies = tokenStrategies[_token];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].strategy == _strategy && strategies[i].isActive) {
                return true;
            }
        }
        return false;
    }

    function getBestStrategy(address _token) public view returns (address) {
        uint256 bestAPY = 0;
        address bestStrategy = address(0);

        StrategyInfo[] storage strategies = tokenStrategies[_token];
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive) {
                uint256 apy = IStrategy(strategies[i].strategy).getAPY(_token);
                if (apy > bestAPY) {
                    bestAPY = apy;
                    bestStrategy = strategies[i].strategy;
                }
            }
        }
        return bestStrategy;
    }
}
