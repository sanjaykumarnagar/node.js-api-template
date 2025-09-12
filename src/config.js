// Simple runtime config with in-memory state
const state = {
  // Supported: 'testnet', 'regtest'
  network: process.env.NETWORK || 'testnet',
};

function get() {
  return { ...state };
}

function set({ network }) {
  if (network && !['testnet', 'regtest'].includes(network)) {
    throw new Error('Unsupported network. Use "testnet" or "regtest".');
  }
  if (network) state.network = network;
  return get();
}

module.exports = { get, set };