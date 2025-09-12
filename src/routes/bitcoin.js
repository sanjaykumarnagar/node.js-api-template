const express = require('express');
const router = express.Router();

const svc = require('../services/bitcoin');

// Mnemonic
router.post('/wallets/mnemonic', async (req, res) => {
  try {
    const { strength = 128 } = req.body || {};
    const mnemonic = await svc.generateMnemonic(Number(strength));
    res.json({ mnemonic });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Root from mnemonic
router.post('/wallets/from-mnemonic', async (req, res) => {
  try {
    const { mnemonic, passphrase } = req.body || {};
    const root = await svc.rootFromMnemonic(mnemonic, passphrase);
    res.json(root);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Derive child, return keys and optional address for p2wpkh
router.post('/wallets/derive', async (req, res) => {
  try {
    const { baseKey, path, returnAddress = true } = req.body || {};
    const result = await svc.deriveChild(baseKey, path, { returnAddress });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// New p2wpkh address from xprv/tprv or wif
router.post('/addresses/p2wpkh', async (req, res) => {
  try {
    const { xprvOrWif, path } = req.body || {};
    const result = await svc.addressP2WPKH(xprvOrWif, path);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Fetch UTXOs (testnet/regtest)
router.get('/utxos/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const utxos = await svc.fetchUtxos(address);
    res.json({ address, utxos });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Build PSBT from inputs/outputs
router.post('/tx/psbt/build', async (req, res) => {
  try {
    const { inputs, outputs } = req.body || {};
    const psbt = await svc.buildPsbt({ inputs, outputs });
    res.json({ psbt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Sign PSBT with WIFs array
router.post('/tx/psbt/sign', async (req, res) => {
  try {
    const { psbt, wifs } = req.body || {};
    const { signedPsbt, hex } = await svc.signPsbt(psbt, wifs || []);
    res.json({ psbt: signedPsbt, hex });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Broadcast hex
router.post('/tx/broadcast', async (req, res) => {
  try {
    const { hex } = req.body || {};
    const txid = await svc.broadcast(hex);
    res.json({ txid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;