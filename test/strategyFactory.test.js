const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyFactory", function () {
  let strategyFactory;
  let owner, user;
  let mockStrategy1, mockStrategy2;
  let token;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // 部署 MockStrategy 合约，支持setMockAPY
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy1 = await MockStrategy.deploy();
    await mockStrategy1.deployed();

    mockStrategy2 = await MockStrategy.deploy();
    await mockStrategy2.deployed();

    // 部署 StrategyFactory
    const StrategyFactory = await ethers.getContractFactory("StrategyFactory");
    strategyFactory = await StrategyFactory.deploy();
    await strategyFactory.deployed();

    // 部署一个Mock ERC20代币，或者直接用任意地址模拟
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Mock Token", "MTK");
    await token.deployed();
  });

  it("should allow owner to add strategy", async () => {
    await strategyFactory.addStrategy(token.address, mockStrategy1.address);
    expect(await strategyFactory.isValidStrategy(token.address, mockStrategy1.address)).to.be.true;
  });

  it("should reject adding duplicate strategy", async () => {
    await strategyFactory.addStrategy(token.address, mockStrategy1.address);
    await expect(
      strategyFactory.addStrategy(token.address, mockStrategy1.address)
    ).to.be.revertedWith("Strategy already exists");
  });

  it("should get best strategy by APY", async () => {
    // 设置不同策略的APY
    await mockStrategy1.setMockAPY(5);  // 5%
    await mockStrategy2.setMockAPY(10); // 10%

    await strategyFactory.addStrategy(token.address, mockStrategy1.address);
    await strategyFactory.addStrategy(token.address, mockStrategy2.address);

    const best = await strategyFactory.getBestStrategy(token.address);
    expect(best).to.equal(mockStrategy2.address);
  });

  it("should return zero address if no active strategies", async () => {
    expect(await strategyFactory.getBestStrategy(token.address)).to.equal(ethers.constants.AddressZero);
  });

  it("should mark strategy inactive on remove", async () => {
    await strategyFactory.addStrategy(token.address, mockStrategy1.address);
    expect(await strategyFactory.isValidStrategy(token.address, mockStrategy1.address)).to.be.true;

    await strategyFactory.removeStrategy(token.address, mockStrategy1.address);
    expect(await strategyFactory.isValidStrategy(token.address, mockStrategy1.address)).to.be.false;
  });

  it("should revert non-owner addStrategy", async () => {
    await expect(
      strategyFactory.connect(user).addStrategy(token.address, mockStrategy1.address)
    ).to.be.revertedWith("Not owner");
  });
});
