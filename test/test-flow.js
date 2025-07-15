const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldAggregatorV1 Flow Test", function () {
  this.timeout(300000);

  let dai, usdc;
  let deployer, user;
  let aggregator, strategyFactory;
  let simpleStrategy, aaveStrategy;

  const DECIMALS = {
    DAI: 18,
    USDC: 6
  };

  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const HOLDERS = {
    DAI: "0xf6e72Db5454dd049d0788e411b06CfAF16853042", // whale: DAI
    USDC: "0x28C6c06298d514Db089934071355E5743bf21d60" // whale: USDC
  };

  before(async () => {
    deployer = (await ethers.getSigners())[0]; 
    const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";  
    user = await ethers.getSigner(userAddress);


    // 从鲸鱼账户 impersonate 并转 token 给测试 user
    for (const symbol of ["DAI", "USDC"]) {
      const whale = HOLDERS[symbol];
      const tokenAddress = symbol === "DAI" ? DAI : USDC;
      const decimals = DECIMALS[symbol];

      const token = await ethers.getContractAt("IERC20", tokenAddress);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whale],
      });

      await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [whale, "0x1000000000000000000"], // 1 ETH for gas
      });

      const whaleSigner = await ethers.getSigner(whale);

      await token.connect(whaleSigner).transfer(user.address, ethers.parseUnits("1000", decimals));

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [whale],
      });

      console.log(`[${symbol}] Transferred 1000 to user`);
    }

    dai = await ethers.getContractAt("IERC20", DAI);
    usdc = await ethers.getContractAt("IERC20", USDC);

    // 获取已部署合约
    const Aggregator = await ethers.getContractFactory("YieldAggregatorV1");
    aggregator = await Aggregator.attach("0xF0F53654c24ae511099D032020975C4baa273d12");

    const Factory = await ethers.getContractFactory("StrategyFactory");
    strategyFactory = await Factory.attach("0xC590836DeFBc8Ed2B0D4481da40D305A5b38de6C");

    const SimpleStrategy = await ethers.getContractFactory("SimpleStrategy");
    simpleStrategy = await SimpleStrategy.attach("0xAC199d7CFf037468FCCBf17BbD3bb2dddFD92590");

    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    aaveStrategy = await AaveStrategy.attach("0xAB386e04A54AF65993e1cD00977E122eF9F332E2");

    // mock APY（simpleStrategy APY < aave APY）
    const tx = await simpleStrategy.connect(deployer).setMockAPY(200); // 2.00%
    await tx.wait();
  });

  async function runTestFlow(symbol, tokenContract, amountRaw) {
    const amount = ethers.parseUnits(amountRaw.toString(), DECIMALS[symbol]);

    // 1. 用户 approve aggregator
    await tokenContract.connect(user).approve(aggregator.target, amount);

    // 2. 调用主合约 deposit()
    const depositTx = await aggregator.connect(user).deposit(tokenContract.target, amount);
    await depositTx.wait();

    console.log(`[${symbol}] Deposited ${amountRaw} successfully`);

    // 3. 检查策略余额是否收到资金
    const bestStrategy = await strategyFactory.getBestStrategy(tokenContract.target);
    const Strategy = await ethers.getContractAt("IStrategy", bestStrategy);
    const bal = await Strategy.getTotalBalance(tokenContract.target);

    expect(bal).to.be.gte((amount * 95n) / 100n);// 至少入账 95%

    console.log(`[${symbol}] Strategy received:`, ethers.formatUnits(bal, DECIMALS[symbol]));

    // 4. 用户提现
    const withdrawTx = await aggregator.connect(user).withdraw(tokenContract.target, ethers.parseUnits("10", DECIMALS[symbol]));
    await withdrawTx.wait();

    const userBalance = await tokenContract.balanceOf(user.address);
    console.log(`[${symbol}] User token balance after withdraw:`, ethers.formatUnits(userBalance, DECIMALS[symbol]));
  }

  it("should handle full flow for DAI", async () => {
    await runTestFlow("DAI", dai, 100);
  });

  it("should handle full flow for USDC", async () => {
    await runTestFlow("USDC", usdc, 100);
  });
});

