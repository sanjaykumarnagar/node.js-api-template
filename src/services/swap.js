const axios = require('axios');

// Simple unified interface with pluggable providers.
// This is a minimal educational scaffold. Real trading requires careful compliance,
// custody, error handling, and secure key management.

async function getQuote({ provider, from, to, amount }) {
  if (!amount || amount <= 0) throw new Error('amount required');
  switch ((provider || '').toLowerCase()) {
    case 'kraken':
      return krakenQuote(from, to, amount);
    case 'coinbase':
      return coinbaseQuote(from, to, amount);
    default:
      throw new Error('Unsupported provider');
  }
}

async function createOrder({ provider, from, to, amount }) {
  switch ((provider || '').toLowerCase()) {
    case 'kraken':
      // Placeholder: implement authenticated Kraken private API call using API key/secret.
      // For safety, return a simulated order.
      return { provider: 'kraken', status: 'simulated', from, to, amount };
    case 'coinbase':
      // Placeholder: implement Coinbase Advanced Trade API call with OAuth or API key/secret.
      return { provider: 'coinbase', status: 'simulated', from, to, amount };
    default:
      throw new Error('Unsupported provider');
  }
}

// Public quote via Kraken ticker
async function krakenQuote(from, to, amount) {
  const pair = normalizeKrakenPair(from, to);
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pair}`;
  const { data } = await axios.get(url);
  if (data.error && data.error.length) throw new Error(data.error.join(', '));
  const key = Object.keys(data.result)[0];
  const info = data.result[key];
  const ask = Number(info.a[0]); // price in quote currency per unit base
  return {
    provider: 'kraken',
    pair,
    price: ask,
    amount,
    estimatedReceive: amount * ask,
  };
}

// Public quote via Coinbase exchange rates
async function coinbaseQuote(from, to, amount) {
  const url = `https://api.coinbase.com/v2/exchange-rates?currency=${encodeURIComponent(from)}`;
  const { data } = await axios.get(url);
  const rate = Number(data.data.rates[to]);
  if (!rate) throw new Error('No rate available for pair');
  return {
    provider: 'coinbase',
    pair: `${from}-${to}`,
    price: rate,
    amount,
    estimatedReceive: amount * rate,
  };
}

function normalizeKrakenPair(from, to) {
  // Very minimal mapping for common assets
  const map = sym => {
    const s = sym.toUpperCase();
    if (s === 'BTC') return 'XBT';
    if (s === 'XBT') return 'XBT';
    if (s === 'ETH') return 'ETH';
    if (s === 'USDT') return 'USDT';
    if (s === 'USD') return 'USD';
    if (s === 'EUR') return 'EUR';
    return s;
  };
  return map(from) + map(to);
}

module.exports = {
  getQuote,
  createOrder,
};