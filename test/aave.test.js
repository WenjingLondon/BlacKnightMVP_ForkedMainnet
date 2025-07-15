const { expect } = require("chai");
const { ethers } = require("hardhat");

const DECIMALS = {
  DAI: 18,
  USDC: 6
};

const { getAddress } = ethers;

const TOKENS = {
  DAI: getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  USDC: getAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
};

const HOLDERS = {
  DAI:  getAddress("0xf6e72Db5454dd049d0788e411b06CfAF16853042"),
  USDC: getAddress("0x28C6c06298d514Db089934071355E5743bf21d60"),

};


const AAVE_ADDRESSES_PROVIDER = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5";

describe("AaveStrategy - Multi Token (Mainnet Fork)", function () {
  this.timeout(300000);

  let wallet, aaveStrategy;

  before(async () => {

    [wallet] = await ethers.getSigners();

    // Transfer enough token to wallet 
    for (const symbol of Object.keys(TOKENS)) {
      const token = await ethers.getContractAt("IERC20", TOKENS[symbol]);

     const whaleAddress = HOLDERS[symbol];

     await hre.network.provider.request({
  method: "hardhat_impersonateAccount",
  params: [whaleAddress],
  });

// ✅ transfer impersonated whale some ETH
  await hre.network.provider.request({
  method: "hardhat_setBalance",
  params: [whaleAddress, "0x1000000000000000000"] // 1 ETH
});

const whale = await ethers.getSigner(whaleAddress);
      
      await token.connect(whale).transfer(wallet.address, ethers.parseUnits("100", DECIMALS[symbol]));

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [whaleAddress],
      });
    }

    // Deploy AaveStrategy.sol
    const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
    aaveStrategy = await AaveStrategy.deploy(AAVE_ADDRESSES_PROVIDER);
    await aaveStrategy.waitForDeployment();
  });

  for (const symbol of Object.keys(TOKENS)) {
    it(`should invest and withdraw ${symbol} successfully`, async () => {
      const token = await ethers.getContractAt("IERC20", TOKENS[symbol]);
      const decimals = DECIMALS[symbol];
      const amount = ethers.parseUnits("100", DECIMALS[symbol]);

      const beforeBalance = await token.balanceOf(wallet.address);

      // approve
      await token.approve(aaveStrategy.target, amount);

      // invest
      const tx = await aaveStrategy.invest(TOKENS[symbol], amount);
      await tx.wait();

      const strategyBalance = await aaveStrategy.getTotalBalance(TOKENS[symbol]);
      expect(strategyBalance).to.be.gte(amount * 95n / 100n); // saving mini 95% successful 

      // withdraw
      await aaveStrategy.withdraw(TOKENS[symbol], ethers.parseUnits("5", decimals));

      const afterBalance = await token.balanceOf(wallet.address);

      expect(afterBalance).to.be.closeTo(
        beforeBalance - amount + ethers.parseUnits("5", decimals),
        ethers.parseUnits("0.01", decimals)
      );
    });
  }
});


