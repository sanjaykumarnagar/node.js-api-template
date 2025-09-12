const axios = require('axios');

// Map chainId to 0x swap API base
function baseFor(chainId) {
  switch (Number(chainId)) {
    case 1: return 'https://api.0x.org';
    case 137: return 'https://polygon.api.0x.org';
    case 8453: return 'https://base.api.0x.org';
    case 42161: return 'https://arbitrum.api.0x.org';
    // Testnets (availability may vary)
    case 11155111: return 'https://sepolia.api.0x.org';
    case 84532: return 'https://base-sepolia.api.0x.org';
    default:
      return null;
  }
}

// Get 0x quote
// params: { chainId, sellToken, buyToken, sellAmount, takerAddress, slippagePercentage? }
async function getQuote(params) {
  const { chainId, sellToken, buyToken, sellAmount, takerAddress, slippagePercentage } = params || {};
  const base = baseFor(chainId);
  if (!base) throw new Error('Unsupported chainId for 0x API');
  const { data } = await axios.get(`${base}/swap/v1/quote`, {
    params: {
      sellToken, buyToken, sellAmount, takerAddress, slippagePercentage,
    },
  });
  return data;
}

// Build tx from quote (0x returns full tx fields)
async function buildTx(params) {
  const q = await getQuote(params);
  // 0x returns { to, data, value, gas, gasPrice, ... }
  // Return minimal fields for ethers.js sendTransaction
  return {
    quote: q,
    tx: {
      to: q.to,
      data: q.data,
      value: q.value || '0x0',
      // ethers provider will fill gas/fees; callers may override if desired
    },
  };
}

module.exports = { getQuote, buildTx };