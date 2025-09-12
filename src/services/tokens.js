const axios = require('axios');

// CoinGecko public API helpers
const CG_BASE = 'https://api.coingecko.com/api/v3';

// List top tokens with market data
async function listTokens({ page = 1, per_page = 50, vs_currency = 'usd' } = {}) {
  const { data } = await axios.get(`${CG_BASE}/coins/markets`, {
    params: {
      vs_currency: vs_currency.toLowerCase(),
      order: 'market_cap_desc',
      per_page,
      page,
      sparkline: false,
      price_change_percentage: '1h,24h,7d',
    },
  });
  return data;
}

// Get current rates for specific ids (comma-separated CoinGecko ids)
async function getRates({ ids = [], vs_currencies = ['usd', 'eur'] }) {
  const { data } = await axios.get(`${CG_BASE}/simple/price`, {
    params: {
      ids: ids.join(','),
      vs_currencies: vs_currencies.join(','),
      include_24hr_change: true,
    },
  });
  return data;
}

// Fetch contract address for a token id on Ethereum
async function getContractAddress({ id, platform = 'ethereum' }) {
  const { data } = await axios.get(`${CG_BASE}/coins/${encodeURIComponent(id)}`);
  const addr = data.platforms && data.platforms[platform];
  return { id, platform, contract_address: addr || null };
}

// Fetch token details by contract on Ethereum
async function getTokenByContract({ contract_address }) {
  const { data } = await axios.get(`${CG_BASE}/coins/ethereum/contract/${contract_address}`);
  return data;
}

module.exports = {
  listTokens,
  getRates,
  getContractAddress,
  getTokenByContract,
};