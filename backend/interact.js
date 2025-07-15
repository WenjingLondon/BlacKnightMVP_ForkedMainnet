const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  
  const [signer] = await hre.ethers.getSigners();

  const yieldAggregatorAddress = "0x289BD64Deb826c134dA670f8B759FB4CA018dF4B";

  // 载入YieldAggregator ABI
  const aggregatorArtifactPath = path.resolve(__dirname, "../artifacts/contracts/core/YieldAggregatorV1.sol/YieldAggregatorV1.json");
  const aggregatorArtifact = JSON.parse(fs.readFileSync(aggregatorArtifactPath, "utf8"));
  const aggregatorAbi = aggregatorArtifact.abi;

  const yieldAggregator = new hre.ethers.Contract(yieldAggregatorAddress, aggregatorAbi, signer);

  // 简单ERC20 ABI，只用 approve
  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
  ];

  const tokens = {
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  };

  // 投资和提现的示例数量（根据代币精度调整）
  // DAI、USDC通常是18和6位小数，WBTC是8位，这里示例用18位，实际根据你代币调整
  const investAmounts = {
    DAI: hre.ethers.parseUnits("10", 18),
    USDC: hre.ethers.parseUnits("10", 6),
  };
  const withdrawAmounts = {
    DAI: hre.ethers.parseUnits("5", 18),
    USDC: hre.ethers.parseUnits("5", 6),
  };

  for (const [name, tokenAddr] of Object.entries(tokens)) {
    console.log(`\n=== 处理代币 ${name} ===`);

    const tokenContract = new hre.ethers.Contract(tokenAddr, erc20Abi, signer);

    // 先检查 allowance 是否足够
    const allowance = await tokenContract.allowance(signer.address, yieldAggregatorAddress);
    console.log(`当前Allowance: ${allowance.toString()}`);


    if (allowance < investAmounts[name]) {
      console.log(`授权投资合约花费 ${name}...`);
      const approveTx = await tokenContract.approve(yieldAggregatorAddress, investAmounts[name]);
      await approveTx.wait();
      console.log("授权成功！");
    } else {
      console.log("Allowance足够，无需再次授权");
    }

    // 调用 deposit
    console.log(`调用 deposit(${tokenAddr}, ${investAmounts[name].toString()})`);
    const depositTx = await yieldAggregator.deposit(tokenAddr, investAmounts[name]);
    await depositTx.wait();
    console.log("投资完成");

    // 调用 withdraw
    console.log(`调用 withdraw(${tokenAddr}, ${withdrawAmounts[name].toString()})`);
    const withdrawTx = await yieldAggregator.withdraw(tokenAddr, withdrawAmounts[name]);
    await withdrawTx.wait();
    console.log("提现完成");
  }

  console.log("\n所有代币投资与提现流程测试完成！");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
