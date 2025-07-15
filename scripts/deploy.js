// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. 部署 SimpleStrategy
  const SimpleStrategy = await hre.ethers.getContractFactory("SimpleStrategy");
  const simpleStrategy = await SimpleStrategy.deploy(); 
  console.log("SimpleStrategy deployed to:", simpleStrategy.target); 

  // 2. 部署 AaveStrategy（传入 Aave LendingPoolAddressesProvider 主网地址）
  const AaveStrategy = await hre.ethers.getContractFactory("AaveStrategy");
  const AAVE_ADDRESSES_PROVIDER = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5";
  const aaveStrategy = await AaveStrategy.deploy(AAVE_ADDRESSES_PROVIDER);
  console.log("AaveStrategy deployed to:", aaveStrategy.target);

  // 3. 部署 StrategyFactory
  const StrategyFactory = await hre.ethers.getContractFactory("StrategyFactory");
  const strategyFactory = await StrategyFactory.deploy();
  console.log("StrategyFactory deployed to:", strategyFactory.target);

  // 4. 注册策略到工厂
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  let tx;

  tx = await strategyFactory.addStrategy(DAI, simpleStrategy.target);
  await tx.wait();
  console.log("SimpleStrategy registered for DAI");

  tx = await strategyFactory.addStrategy(USDC, simpleStrategy.target);
  await tx.wait();
  console.log("SimpleStrategy registered for USDC");

  tx = await strategyFactory.addStrategy(DAI, aaveStrategy.target);
  await tx.wait();
  console.log("AaveStrategy registered for DAI");

  tx = await strategyFactory.addStrategy(USDC, aaveStrategy.target);
  await tx.wait();
  console.log("AaveStrategy registered for USDC");

  // 5. 部署 YieldAggregatorV1 主合约
  const YieldAggregatorV1 = await hre.ethers.getContractFactory("YieldAggregatorV1");
  const timelock = deployer.address;
  const feeReceiver = "0x00Da6A84176a979fBc6c67aeDE352592C947bAd9";

  const aggregator = await YieldAggregatorV1.deploy(
    timelock,
    strategyFactory.target,
    feeReceiver
  );
  console.log("YieldAggregatorV1 deployed to:", aggregator.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});




