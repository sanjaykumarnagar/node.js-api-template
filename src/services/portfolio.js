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