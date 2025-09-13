const axios = require('axios');
const bip39 = require('bip39');
// Support multiple export shapes of bip32 (v1, v2, CJS/ESM interop)
const bip32lib = require('bip32');
const tinysecp = require('tiny-secp256k1');
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const wif = require('wif');

const config = require('../config');
const rpc = require('./rpc');

// Resolve bip32 instance across versions/export shapes.
let bip32;
if (bip32lib && typeof bip32lib.BIP32Factory === 'function') {
  bip32 = bip32lib.BIP32Factory(tinysecp);
} else if (bip32lib && typeof bip32lib.default === 'function') {
  bip32 = bip32lib.default(tinysecp);
} else if (bip32lib && typeof bip32lib.fromSeed === 'function') {
  // v1-style export already bound
  bip32 = bip32lib;
} else {
  throw new Error('Unsupported bip32 export shape');
}

const ECPair = ECPairFactory(tinysecp);

// Map config network -> bitcoinjs and API host
function getNetwork() {
  const net = config.get().network;
  if (net === 'testnet') return bitcoin.networks.testnet;
  if (net === 'regtest') return bitcoin.networks.regtest;
  // default
  return bitcoin.networks.testnet;
}

function getApiBase() {
  const net = config.get().network;
  if (net === 'testnet') return 'https://blockstream.info/testnet/api';
  // For regtest there's no public API; prefer RPC
  if (net === 'regtest') {
    return null;
  }
  return 'https://blockstream.info/testnet/api';
}

// Utilities
function toXpub(node, network) {
  return node.neutered().toBase58();
}
function toXprv(node, network) {
  return node.toBase58();
}

// Public API

async function generateMnemonic(strength = 128) {
  const s = Number(strength);
  if (![128, 160, 192, 224, 256].includes(s)) {
    throw new Error('Invalid strength. Use one of 128,160,192,224,256');
  }
  return bip39.generateMnemonic(s);
}

async function rootFromMnemonic(mnemonic, passphrase = '') {
  if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }
  const network = getNetwork();
  const seed = await bip39.mnemonicToSeed(mnemonic, passphrase);
  const root = bip32.fromSeed(seed, network);
  return {
    network: config.get().network,
    xprv: toXprv(root, network),
    xpub: toXpub(root, network),
    fingerprint: root.fingerprint.toString('hex'),
  };
}

async function deriveChild(baseKey, path, { returnAddress = true } = {}) {
  if (!baseKey) throw new Error('baseKey required (xprv/xpub)');
  if (!path || typeof path !== 'string') throw new Error('derivation path required, e.g. m/84\'/1\'/0\'/0/0');
  const network = getNetwork();

  const isPriv = baseKey.startsWith('xprv') || baseKey.startsWith('tprv') || baseKey.startsWith('yprv') || baseKey.startsWith('zprv');
  const node = isPriv ? bip32.fromBase58(baseKey, network) : bip32.fromBase58(baseKey, network);

  // Handle absolute paths starting with m/...
  const indexes = path.replace(/^m\//, '').split('/');
  let child = node;
  for (const p of indexes) {
    const hardened = p.endsWith("'");
    const idx = parseInt(p.replace("'", ''), 10);
    if (Number.isNaN(idx)) throw new Error(`Invalid path segment: ${p}`);
    child = hardened ? child.deriveHardened(idx) : child.derive(idx);
  }

  const result = {
    publicKey: child.publicKey.toString('hex'),
    xpub: child.neutered().toBase58(),
  };
  if (isPriv) {
    result.xprv = child.toBase58();
    result.wif = child.toWIF();
  }
  if (returnAddress) {
    const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });
    result.address = address;
  }
  return result;
}

async function addressP2WPKH(xprvOrWif, path = "m/84'/1'/0'/0/0") {
  const network = getNetwork();
  let keyNode;
  let wifOut;

  if (xprvOrWif.startsWith('xprv') || xprvOrWif.startsWith('tprv')) {
    keyNode = bip32.fromBase58(xprvOrWif, network);
    // derive path
    const indexes = path.replace(/^m\//, '').split('/');
    for (const p of indexes) {
      const hardened = p.endsWith("'");
      const idx = parseInt(p.replace("'", ''), 10);
      keyNode = hardened ? keyNode.deriveHardened(idx) : keyNode.derive(idx);
    }
    wifOut = keyNode.toWIF();
  } else {
    // treat as WIF
    const decoded = wif.decode(xprvOrWif);
    if (!decoded) throw new Error('Invalid WIF');
    // Create a BIP32 node from WIF to get pubkey
    keyNode = bip32.fromPrivateKey(Buffer.from(decoded.privateKey), Buffer.alloc(32), network);
    wifOut = xprvOrWif;
  }

  const { address } = bitcoin.payments.p2wpkh({ pubkey: keyNode.publicKey, network });
  return { address, wif: wifOut };
}

// Fetch UTXOs for an address (testnet Blockstream API or RPC if configured)
async function fetchUtxos(address) {
  const net = config.get().network;
  if (rpc.isConfigured()) {
    const list = await rpc.listUnspentByAddress(address);
    return (list || []).map(u => ({
      txid: u.txid,
      vout: u.vout,
      value: Math.round(u.amount * 1e8),
      confirmations: u.confirmations,
      spendable: u.spendable,
    }));
  }
  const base = getApiBase();
  if (!base) {
    throw new Error('No public API for this network. Configure RPC via /rpc/config.');
  }
  const { data } = await axios.get(`${base}/address/${address}/utxo`);
  // normalize to { txid, vout, value }
  return (data || []).map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    status: u.status,
  }));
}

// Build PSBT. Inputs must include { txid, vout, value, address }
async function buildPsbt({ inputs, outputs }) {
  const network = getNetwork();
  if (!Array.isArray(inputs) || inputs.length === 0) throw new Error('inputs required');
  if (!Array.isArray(outputs) || outputs.length === 0) throw new Error('outputs required');

  const psbt = new bitcoin.Psbt({ network });

  // Add inputs with witnessUtxo
  for (const inp of inputs) {
    if (!inp.txid || inp.vout === undefined || inp.value === undefined || !inp.address) {
      throw new Error('Each input must include txid, vout, value, address');
    }
    const script = bitcoin.address.toOutputScript(inp.address, network);

    psbt.addInput({
      hash: inp.txid,
      index: inp.vout,
      witnessUtxo: {
        script,
        value: Number(inp.value),
      },
    });
  }

  // Add outputs
  for (const out of outputs) {
    if (!out.address || out.value === undefined) throw new Error('Each output must include address and value');
    psbt.addOutput({
      address: out.address,
      value: Number(out.value),
    });
  }

  return psbt.toBase64();
}

// Sign PSBT with array of WIFs
async function signPsbt(psbtBase64, wifs = []) {
  const network = getNetwork();
  const psbt = bitcoin.Psbt.fromBase64(psbtBase64, { network });

  if (!Array.isArray(wifs) || wifs.length === 0) {
    throw new Error('Provide at least one WIF to sign with');
  }

  // Try each WIF against each input; bitcoinjs will skip if key doesn't match
  for (const w of wifs) {
    const keyPair = ECPair.fromWIF(w, network);
    psbt.signAllInputs(keyPair);
  }

  // Validate and finalize
  psbt.validateSignaturesOfAllInputs();
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  const hex = tx.toHex();
  return { signedPsbt: psbt.toBase64(), hex };
}

// Broadcast raw tx hex (Blockstream for testnet or RPC if configured)
async function broadcast(hex) {
  if (!hex || typeof hex !== 'string') throw new Error('hex required');
  if (rpc.isConfigured()) {
    return rpc.broadcastRawTx(hex);
  }
  const base = getApiBase();
  if (!base) {
    throw new Error('No public broadcast API for this network. Configure RPC via /rpc/config.');
  }
  const { data } = await axios.post(`${base}/tx`, hex, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return data; // txid
}

module.exports = {
  generateMnemonic,
  rootFromMnemonic,
  deriveChild,
  addressP2WPKH,
  fetchUtxos,
  buildPsbt,
  signPsbt,
  broadcast,
};