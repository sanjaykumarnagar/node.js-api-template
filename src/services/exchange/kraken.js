const axios = require('axios');
const crypto = require('crypto');
const { getRaw } = require('./config');

const BASE = 'https://api.kraken.com';

function signKraken(path, request, secret) {
  const message = new URLSearchParams(request).toString();
  const secretBuf = Buffer.from(secret, 'base64');
  const hash = crypto.createHash('sha256');
  const nonce = request.nonce;
  const hashDigest = hash.update(nonce + message).digest();
  const hmac = crypto.createHmac('sha512', secretBuf);
  const signature = hmac.update(path).update(hashDigest).digest('base64');
  return signature;
}

async function privateCall(path, params = {}) {
  const { kraken } = getRaw();
  if (!kraken.apiKey || !kraken.apiSecret) throw new Error('Kraken API not configured');
  const urlPath = `/0/private/${path}`;
  const url = `${BASE}${urlPath}`;
  const nonce = Date.now().toString();
  const body = { nonce, ...params };

  const headers = {
    'API-Key': kraken.apiKey,
    'API-Sign': signKraken(urlPath, body, kraken.apiSecret),
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const { data } = await axios.post(url, new URLSearchParams(body), { headers });
  if (data.error && data.error.length) throw new Error(data.error.join(', '));
  return data.result;
}

// Create market order
// pair example: XBTUSD, XXBTZUSD, etc. side: buy/sell, volume in base currency
async function createMarketOrder({ pair, side, volume }) {
  const params = {
    pair,
    type: side,
    ordertype: 'market',
    volume: String(volume),
    // optional: oflags, userref, validate, etc.
  };
  return privateCall('AddOrder', params);
}

module.exports = {
  createMarketOrder,
};