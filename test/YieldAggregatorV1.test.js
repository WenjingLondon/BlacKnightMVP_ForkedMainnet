const { expect } = require("chai");
const { ethers, parseEther } = require("hardhat");

describe("YieldAggregatorV1 MVP", function () {
  let owner, user, token, strategy, strategyFactory, feeManager, aggregator;

  beforeEach(async () => {
    [owner, user, timelock] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock USD", "mUSD");
    await token.waitForDeployment();

    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    strategy = await MockStrategy.deploy();
    await strategy.waitForDeployment();

    const MockStrategyFactory = await ethers.getContractFactory(
      "MockStrategyFactory"
    );
    console.log("Deploying MockStrategyFactory with address:", strategy.target);
    strategyFactory = await MockStrategyFactory.deploy(strategy.target);
    await strategyFactory.waitForDeployment();

    const FeeManager = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManager.deploy(strategyFactory.target);
    await feeManager.waitForDeployment();

    const YieldAggregatorV1 = await ethers.getContractFactory(
      "YieldAggregatorV1"
    );

    console.log("timelock.address", timelock.address);
    console.log("strategyFactory.target", strategyFactory.target);
    console.log("feeManager.target", feeManager.target);

    aggregator = await YieldAggregatorV1.deploy(
      timelock.address,
      strategyFactory.target,
      feeManager.target
    );
    await aggregator.waitForDeployment();
    console.log("Aggregator deployed at", aggregator.target);

    // 给 user 发 token 并授权 aggregator
    await token.transfer(user.address, ethers.parseEther("1000"));
    await token
      .connect(user)
      .approve(aggregator.target, ethers.parseEther("1000"));
  });

  it("user can withdraw via strategy", async () => {
    // 用户先存款
    await aggregator
      .connect(user)
      .deposit(token.target, ethers.parseEther("100"));

    // 用户进行提现
    await aggregator
      .connect(user)
      .withdraw(token.target, ethers.parseEther("50"));

    // 验证策略合约余额
    const strategyBalance = await strategy.getTotalBalance(token.target);
    expect(strategyBalance).to.equal(ethers.parseEther("50"));

    // 验证用户余额
    const userBalance = await token.balanceOf(user.address);
    expect(userBalance).to.equal(ethers.parseEther("950")); // 1000 - 50
  });
});