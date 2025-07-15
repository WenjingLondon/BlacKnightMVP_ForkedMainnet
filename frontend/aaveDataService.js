import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

const DATA_PROVIDER_ADDRESS = "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d";
const UI_POOL_DATA_PROVIDER = "0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb";

const ASSET_ADDRESSES = [
  { name: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
  { name: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { name: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" }
];

const ProtocolDataProviderABI = [
"function getReserveData(address asset) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40)",
  "function getReserveConfigurationData(address asset) view returns (uint256,uint256,uint256,uint256,bool,bool,bool,bool,bool,bool)"
];

const UiPoolDataProviderABI = [
  "function getReservesData(address user) view returns ((address, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint8, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)[], uint256[], uint256)",
  "function getUserReservesData(address user) view returns ((address, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool, bool, bool, uint8)[], uint256, uint256, uint256, uint256, uint256)"
];

const LendingPoolAddressProviderABI = [
  "function getLendingPool() view returns (address)",
  "function getAddress(bytes32 id) view returns (address)"
];

function rayToPercent(ray) {
  return Number(ray) / 1e27 * 100;
}

export async function getAaveMarketData() {
  const protocolDataProvider = new ethers.Contract(DATA_PROVIDER_ADDRESS, ProtocolDataProviderABI, provider);

  const results = [];

  for (const asset of ASSET_ADDRESSES) {
    const reserveData = await protocolDataProvider.getReserveData(asset.address);
    const configData = await protocolDataProvider.getReserveConfigurationData(asset.address);

    results.push({
      asset: asset.name,
      supplyAPY: rayToPercent(reserveData[3]),
      borrowAPY: rayToPercent(reserveData[4]),
      ltv: Number(configData[0]),                     // Already parsed LTV
      liquidationThreshold: Number(configData[1])     // ✅ Use this directly
      
    });
  }

  return results;
}

async function renderTable() {
  const data = await getAaveMarketData();
  const tbody = document.querySelector("#aave-table tbody");
  tbody.innerHTML = ""; 

  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.asset}</td>
      <td>${item.supplyAPY}</td>
      <td>${item.borrowAPY}</td>
      <td>${item.ltv}</td>
      <td>${item.liquidationThreshold}</td>
    `;
    tbody.appendChild(row);
  });

  return data; 
}


async function getRecommendation() {
  const data = await getAaveMarketData();  
  const formatted = {};
  data.forEach(item => {
    const prefix = item.asset.toLowerCase();
    formatted[`${prefix}_supply`] = item.supplyAPY;
    formatted[`${prefix}_borrow`] = item.borrowAPY;
    formatted[`${prefix}_ltv`] = item.ltv;
    formatted[`${prefix}_liquidation`] = item.liquidationThreshold;
  });

  const res = await fetch("http://localhost:5000/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formatted)
  });

  const result = await res.json();
  document.getElementById("result").innerHTML = result.recommendation || result.error;
}


document.addEventListener("DOMContentLoaded", async () => {
  await renderTable();

  const btn = document.getElementById("recommendBtn");
  if (btn) {
    btn.addEventListener("click", getRecommendation);
  }
});

