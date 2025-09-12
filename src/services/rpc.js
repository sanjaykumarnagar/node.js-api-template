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

// Common wrappers
async function getBlockchainInfo() {
  return call('getblockchaininfo');
}

async function broadcastRawTx(hex) {
  return call('sendrawtransaction', [hex]);
}

async function listUnspentByAddress(address) {
  // Filter by addresses (requires importaddress/importdescriptors)
  return call('listunspent', [0, 9999999, [address]]);
}

async function estimateSmartFee(blocks = 2) {
  return call('estimatesmartfee', [blocks]);
}

async function createWallet(name, disablePrivateKeys = false, blank = false) {
  return call('createwallet', [name, disablePrivateKeys, blank]);
}

async function listWallets() {
  return call('listwallets', []);
}

async function loadWallet(name) {
  return call('loadwallet', [name]);
}

async function getNewAddress(label = '', type = 'bech32') {
  return call('getnewaddress', [label, type]);
}

async function getBalance(minconf = 0) {
  return call('getbalance', [ '*', minconf ]);
}

async function sendToAddress(address, amount, comment = '', comment_to = '', subtractFeeFromAmount = false) {
  return call('sendtoaddress', [address, amount, comment, comment_to, subtractFeeFromAmount]);
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
  createWallet,
  listWallets,
  loadWallet,
  getNewAddress,
  getBalance,
  sendToAddress,
};