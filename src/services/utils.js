const axios = require('axios');
const config = require('../config');
const rpc = require('./rpc');

function getApiBase() {
  const net = config.get().network;
  if (net === 'testnet') return 'https://blockstream.info/testnet/api';
  if (net === 'regtest') return null; // use RPC
  return 'https://blockstream.info/testnet/api';
}

// Fetch fee estimates (sat/vB) map by confirmation target
async function feeEstimates() {
  const net = config.get().network;
  if (net === 'regtest') {
    if (rpc.isConfigured()) {
      const est = await rpc.estimateSmartFee(2);
      // estimatesmartfee returns BTC/kB or BTC/kvB depending on version. For simplicity, fallback to 1 sat/vB if missing
      const btcPerKvB = est && est.feerate ? est.feerate : null;
      if (!btcPerKvB) return { "2": 1, "3": 1, "6": 1 };
      const satsPerVb = Math.max(1, Math.round((btcPerKvB * 1e8) / 1000)); // sats/vB
      return { "2": satsPerVb };
    }
    return { "2": 1, "3": 1, "6": 1 };
  }
  const base = getApiBase();
  const { data } = await axios.get(`${base}/fee-estimates`);
  // Return common targets only
  const pick = {};
  for (const t of ['1', '2', '3', '6', '10', '25']) {
    if (data[t]) pick[t] = Math.round(data[t]);
  }
  return pick;
}

// Simple greedy coin selection for P2WPKH-only UTXOs.
// utxos: [{ txid, vout, value }] value in sats
// targets: [{ address, value }]
// feeRate: sats per vbyte
function estimateVBytes(inputsCount, outputsCount) {
  const inVb = 68; // typical p2wpkh input
  const outVb = 31; // typical p2wpkh output
  const overhead = 10; // version + locktime + varints
  return overhead + inputsCount * inVb + outputsCount * outVb;
}

function coinSelect(utxos, targets, feeRate) {
  const sorted = [...utxos].sort((a, b) => a.value - b.value);
  const targetValue = targets.reduce((s, t) => s + Number(t.value), 0);

  const outputsCountBase = targets.length + 1; // + change (maybe)
  let selected = [];
  let total = 0;

  for (const u of sorted) {
    selected.push(u);
    total += Number(u.value);
    const inputsCount = selected.length;
    // assume change present while estimating
    const vbytes = estimateVBytes(inputsCount, outputsCountBase);
    const fee = vbytes * feeRate;
    if (total >= targetValue + fee) {
      // compute actual change
      const actualVb = estimateVBytes(inputsCount, targets.length + 1);
      const actualFee = actualVb * feeRate;
      const change = total - targetValue - actualFee;
      return { inputs: selected, fee: actualFee, change };
    }
  }
  return null; // insufficient
}

module.exports = {
  feeEstimates,
  coinSelect,
};