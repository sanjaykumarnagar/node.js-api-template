const axios = require('axios');

let rpcConfig = {
  url: null,
  username: null,
  password: null,
};

function setConfig({ url, username, password }) {
  if (!url || !username || !password) {
    throw new Error('url, username, and password are required for RPC config');
  }
  rpcConfig = { url, username, password };
  return getConfig();
}

function clearConfig() {
  rpcConfig = { url: null, username: null, password: null };
}

function getConfig() {
  return { ...rpcConfig, password: rpcConfig.password ? '***' : null };
}

function isConfigured() {
  return Boolean(rpcConfig.url && rpcConfig.username && rpcConfig.password);
}

async function call(method, params = []) {
  if (!isConfigured()) {
    throw new Error('RPC not configured');
  }
  const { url, username, password } = rpcConfig;
  const { data } = await axios.post(
    url,
    {
      jsonrpc: '1.0',
      id: 'genie',
      method,
      params,
    },
    {
      auth: { username, password },
    }
  );
  if (data.error) {
    throw new Error(data.error.message || 'RPC error');
  }
  return data.result;
}

async function getBlockchainInfo() {
  return call('getblockchaininfo');
}

async function broadcastRawTx(hex) {
  return call('sendrawtransaction', [hex]);
}

async function listUnspentByAddress(address) {
  // Filter by addresses (requires address indexing or importaddress/importdescriptors in your node)
  return call('listunspent', [0, 9999999, [address]]);
}

async function estimateSmartFee(blocks = 2) {
  return call('estimatesmartfee', [blocks]);
}

module.exports = {
  setConfig,
  clearConfig,
  getConfig,
  isConfigured,
  call,
  getBlockchainInfo,
  broadcastRawTx,
  listUnspentByAddress,
  estimateSmartFee,
};