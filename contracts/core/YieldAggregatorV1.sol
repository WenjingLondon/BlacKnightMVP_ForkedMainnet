// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IStrategy.sol";
import "../Strategies/StrategyFactory.sol";

contract YieldAggregatorV1 {
    address public immutable owner;
    address public immutable timelock;
    address public immutable feeReceiver;

    StrategyFactory public strategyFactory;

    constructor(
        address _timelock,
        address _strategyFactory,
        address _feeReceiver
    ) {
        require(_timelock != address(0), "Invalid timelock");
        require(_strategyFactory != address(0), "Invalid strategyFactory");
        require(_feeReceiver != address(0), "Invalid feeReceiver");

        owner = msg.sender;
        timelock = _timelock;
        strategyFactory = StrategyFactory(_strategyFactory);
        feeReceiver = _feeReceiver;
    }

    // 用户余额映射：user => token => amount
    mapping(address => mapping(address => uint256)) public balances;

    // 固定提现手续费（0.5% = 50 / 10000）
    uint256 public constant WITHDRAWAL_FEE_BPS = 50; // basis points: 0.5%
    uint256 public constant BPS_DENOMINATOR = 10000;

    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount, uint256 fee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyTimelock() {
        require(msg.sender == timelock, "Only timelock can call this");
        _;
    }

    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        address bestStrategy = strategyFactory.getBestStrategy(token);
        require(bestStrategy != address(0), "No strategy available");

// 主合约将资金转给策略合约
       IERC20(token).transfer(bestStrategy, amount);

// 调用策略合约 invest，资金已经到了策略合约地址，策略合约不要再拉取资金
        IStrategy(bestStrategy).invest(token, amount);
        balances[msg.sender][token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require(balances[msg.sender][token] >= amount, "Insufficient balance");

        // 获取策略
        address strategy = strategyFactory.getBestStrategy(token);
        require(strategy != address(0), "No strategy available");

        // 从策略中提取资金
        IStrategy(strategy).withdraw(token, amount);

        // 计算手续费（0.5%）
        uint256 fee = (amount * WITHDRAWAL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 userAmount = amount - fee;

        // 发钱给用户和平台
        IERC20(token).transfer(msg.sender, userAmount);
        if (fee > 0) {
            IERC20(token).transfer(feeReceiver, fee);
        }

        // 更新余额
        balances[msg.sender][token] -= amount;

        emit Withdrawn(msg.sender, token, userAmount, fee);
    }

    // 设置策略工厂地址
    function setStrategyFactory(address _strategyFactory) external onlyTimelock {
        strategyFactory = StrategyFactory(_strategyFactory);
    }

}