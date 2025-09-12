let state = {
  kraken: {
    apiKey: process.env.KRAKEN_API_KEY || null,
    apiSecret: process.env.KRAKEN_API_SECRET || null,
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY || null,
    apiSecret: process.env.COINBASE_API_SECRET || null,
    passphrase: process.env.COINBASE_API_PASSPHRASE || null,
  },
};

function get() {
  return {
    kraken: { apiKey: !!state.kraken.apiKey, apiSecret: !!state.kraken.apiSecret },
    coinbase: { apiKey: !!state.coinbase.apiKey, apiSecret: !!state.coinbase.apiSecret, passphrase: !!state.coinbase.passphrase },
  };
}

function set({ kraken, coinbase }) {
  if (kraken) {
    if (typeof kraken.apiKey === 'string') state.kraken.apiKey = kraken.apiKey;
    if (typeof kraken.apiSecret === 'string') state.kraken.apiSecret = kraken.apiSecret;
  }
  if (coinbase) {
    if (typeof coinbase.apiKey === 'string') state.coinbase.apiKey = coinbase.apiKey;
    if (typeof coinbase.apiSecret === 'string') state.coinbase.apiSecret = coinbase.apiSecret;
    if (typeof coinbase.passphrase === 'string') state.coinbase.passphrase = coinbase.passphrase;
  }
  return get();
}

function getRaw() {
  return JSON.parse(JSON.stringify(state));
}

module.exports = { get, set, getRaw };