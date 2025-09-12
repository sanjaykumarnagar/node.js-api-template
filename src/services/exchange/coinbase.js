const axios = require('axios');
const crypto = require('crypto');
const { getRaw } = require('./config');

// Coinbase Advanced Trade API v3-ish headers (subject to change; verify with docs)
// Docs: https://docs.cloud.coinbase.com/advanced-trade-api
const BASE = 'https://api.coinbase.com';

function sign({ timestamp, method, requestPath, body, secret }) {
  const prehash = timestamp + method.toUpperCase() + requestPath + (body || '');
  const key = Buffer.from(secret, 'base64');
  const hmac = crypto.createHmac('sha256', key);
  return hmac.update(prehash).digest('base64');
}

async function privateCall(method, path, payload = null) {
  const { coinbase } = getRaw();
  if (!coinbase.apiKey || !coinbase.apiSecret || !coinbase.passphrase) {
    throw new Error('Coinbase API not configured');
  }

  const requestPath = `/api/v3${path}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = payload ? JSON.stringify(payload) : '';
  const signature = sign({
    timestamp,
    method,
    requestPath,
    body,
    secret: coinbase.apiSecret,
  });

  const headers = {
    'CB-ACCESS-KEY': coinbase.apiKey,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-ACCESS-PASSPHRASE': coinbase.passphrase,
    'Content-Type': 'application/json',
  };

  const url = `${BASE}${requestPath}`;
  const { data } = await axios({
    url,
    method,
    headers,
    data: body || undefined,
  });

  if (data.message) {
    // API sometimes uses 'message' for error text
    throw new Error(data.message);
  }
  return data;
}

// Create market order
// product_id: 'BTC-USD', 'BTC-USDT', etc. side: BUY/SELL, quote/size options vary
async function createMarketOrder({ product_id, side, size }) {
  const payload = {
    product_id,
    side: side.toUpperCase(), // BUY or SELL
    order_configuration: {
      market_market_ioc: {
        base_size: String(size),
      },
    },
  };
  return privateCall('POST', '/brokerage/orders', payload);
}

module.exports = {
  createMarketOrder,
};