// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IStrategy.sol";

contract SimpleStrategy is IStrategy {
    uint256 private apy = 5;  // 默认 5%

    // 允许管理员或测试时修改 APY
    function setMockAPY(uint256 _apy) external {
        apy = _apy;
    }

    // 从调用者地址拉代币到策略合约
    function invest(address token, uint256 amount) external override {
    require(amount > 0, "Amount must be > 0");
}


    // 允许调用者提现
    function withdraw(address token, uint256 amount) external override {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(amount <= bal, "Insufficient balance");
        IERC20(token).transfer(msg.sender, amount);
    }

    // 返回当前 APY，单位同主合约约定，百分比
    function getAPY(address /*token*/) external view override returns (uint256) {
        return apy;
    }

    // 返回策略合约该代币余额
    function getTotalBalance(address token) external view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
