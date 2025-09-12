const axios = require('axios');
const { ethers } = require('ethers');
const rpc = require('./rpc');

const evmState = {
  rpcUrl: process.env.EVM_RPC_URL || 'https://rpc.sepolia.org',
};
function evmProvider() {
  return new ethers.JsonRpcProvider(evmState.rpcUrl);
}

async function getEthBalance(address) {
  const provider = evmProvider();
  const bal = await provider.getBalance(address);
  return Number(ethers.formatEther(bal));
}

function erc20Iface() {
  return new ethers.Interface([
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ]);
}

async function getErc20Balance(address, tokenAddress) {
  const provider = evmProvider();
  const contract = new ethers.Contract(tokenAddress, erc20Iface(), provider);
  const [bal, dec, sym] = await Promise.all([
    contract.balanceOf(address),
    contract.decimals(),
    contract.symbol(),
  ]);
  const human = Number(ethers.formatUnits(bal, dec));
  return { tokenAddress, symbol: sym, balance: human, raw: bal.toString(), decimals: dec };
}

async function getBtcAddressBalanceBlockstreamTestnet(address) {
  const base = 'https://blockstream.info/testnet/api';
  const { data } = await axios.get(`${base}/address/${address}`);
  const funded = (data.chain_stats?.funded_txo_sum || 0) + (data.mempool_stats?.funded_txo_sum || 0);
  const spent = (data.chain_stats?.spent_txo_sum || 0) + (data.mempool_stats?.spent_txo_sum || 0);
  const sats = funded - spent;
  return sats; // sats
}

async function aggregate({ btc = {}, evm = {} } = {}) {
  const out = { btc: {}, evm: {} };

  // BTC via RPC wallet balance (if configured)
  if (btc && btc.useRpc) {
    if (!rpc.isConfigured()) {
      out.btc.error = 'RPC not configured';
    } else {
      try {
        const bal = await rpc.getBalance(0);
        out.btc.balance = bal;
      } catch (e) {
        out.btc.error = e.message;
      }
    }
  }

  // BTC per-address via explorer (testnet Blockstream)
  if (btc && Array.isArray(btc.addresses) && btc.addresses.length) {
    out.btc.addresses = {};
    let totalSats = 0;
    for (const a of btc.addresses) {
      try {
        const sats = await getBtcAddressBalanceBlockstreamTestnet(a);
        out.btc.addresses[a] = { sats, btc: sats / 1e8 };
        totalSats += sats;
      } catch (e) {
        out.btc.addresses[a] = { error: e.message };
      }
    }
    out.btc.totalAddressBalance = { sats: totalSats, btc: totalSats / 1e8 };
  }

  // EVM ETH balances for addresses
  const addresses = Array.isArray(evm.addresses) ? evm.addresses : [];
  out.evm.eth = {};
  for (const addr of addresses) {
    try {
      out.evm.eth[addr] = await getEthBalance(addr);
    } catch (e) {
      out.evm.eth[addr] = { error: e.message };
    }
  }

  // EVM ERC20 balances
  const tokens = Array.isArray(evm.tokens) ? evm.tokens : [];
  out.evm.erc20 = {};
  for (const addr of addresses) {
    out.evm.erc20[addr] = {};
    for (const t of tokens) {
      try {
        out.evm.erc20[addr][t] = await getErc20Balance(addr, t);
      } catch (e) {
        out.evm.erc20[addr][t] = { error: e.message };
      }
    }
  }

  return out;
}

module.exports = { aggregate };