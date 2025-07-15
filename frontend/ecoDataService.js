
  async function getEcoAssets() {
  
  const ecoTokens = [
    {
      id: 'toucan-protocol-base-carbon-tonne',
      name: 'Toucan BCT',
      symbol: 'BCT',
      greenTag: 'Carbon Credit',
      website: 'https://toucan.earth'
    },
    {
      id: 'klima-dao',
      name: 'KlimaDAO',
      symbol: 'KLIMA',
      greenTag: 'Green DAO',
      website: 'https://www.klimadao.finance'
    },
    {
      id: 'moss-carbon-credit',
      name: 'MOSS',
      symbol: 'MCO2',
      greenTag: 'Amazon Reforestation',
      website: 'https://moss.earth'
    }
  ];

  const ids = ecoTokens.map(t => t.id).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;

  const res = await fetch(url);

  const json = await res.json();

  // Mock APY & TVL data — to be replaced with real sources later
  const apyMap = {
    'toucan-protocol-base-carbon-tonne': 5.3,
    'klima-dao': 6.1,
    'moss-carbon-credit': 4.8
  };

  const tvlMap = {
    'toucan-protocol-base-carbon-tonne': 1_200_000,
    'klima-dao': 1_500_000,
    'moss-carbon-credit': 800_000
  };

  return ecoTokens.map(token => {
    const marketData = json.find(j => j.id === token.id);
    return {
      ...token,
      price: marketData?.current_price || 0,
      marketCap: marketData?.market_cap || 0,
      change24h: marketData?.price_change_percentage_24h || 0,
      apy: apyMap[token.id],
      tvl: tvlMap[token.id]
    };
  });
}
