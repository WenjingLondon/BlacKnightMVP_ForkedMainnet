
const hre = require("hardhat");
const { parseUnits, getAddress } = require("ethers"); // v6 新语法

async function fundWhaleWithETH(whaleAddress) {
  const [funder] = await hre.ethers.getSigners();

  const tx = await funder.sendTransaction({
    to: whaleAddress,
    value: hre.ethers.parseEther("1"),
  });

  await tx.wait();
  console.log(`✅ Funded whale ${whaleAddress} with 1 ETH`);
}

async function impersonateAndTransfer(tokenAddress, whaleAddress, recipient, amount, decimals) {
  await fundWhaleWithETH(whaleAddress);
  // Impersonate whale
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });

  const whaleSigner = await hre.ethers.getSigner(whaleAddress);

  const token = await hre.ethers.getContractAt("IERC20", tokenAddress);

  const parsedAmount = parseUnits(amount, decimals); // ✅ v6 正确用法

  const tx = await token.connect(whaleSigner).transfer(recipient, parsedAmount);
  await tx.wait();

  console.log(`✅ Transferred ${amount} tokens from ${whaleAddress} to ${recipient}`);
}

async function main() {
  const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const tokens = [
    {
      name: "DAI",
      tokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      whale: "0x28C6c06298d514Db089934071355E5743bf21d60",
      amount: "1000",
      decimals: 18,
    },
    {
      name: "USDC",
      tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      whale: "0x28C6c06298d514Db089934071355E5743bf21d60",
      amount: "1000",
      decimals: 6,
    },
  ];

  for (const token of tokens) {
    console.log(`🔄 Sending ${token.name}...`);

    // 统一做地址格式规范（checksum）
    const tokenAddressChecked = getAddress(token.tokenAddress.trim());
    const whaleAddressChecked = getAddress(token.whale.trim());

    await impersonateAndTransfer(
      tokenAddressChecked,
      whaleAddressChecked,
      recipient,
      token.amount,
      token.decimals
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


