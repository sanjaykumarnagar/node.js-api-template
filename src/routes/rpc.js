const express = require('express');
const router = express.Router();

const rpc = require('../services/rpc');

// Configure RPC
router.post('/config', (req, res) => {
  try {
    const { url, username, password } = req.body || {};
    const cfg = rpc.setConfig({ url, username, password });
    res.json({ ok: true, config: cfg });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get RPC config
router.get('/config', (req, res) => {
  res.json(rpc.getConfig());
});

// Clear RPC config
router.delete('/config', (req, res) => {
  rpc.clearConfig();
  res.json({ ok: true });
});

// Health via getblockchaininfo
router.get('/health', async (req, res) => {
  try {
    const info = await rpc.getBlockchainInfo();
    res.json({ ok: true, info });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Wallet management
router.post('/wallets/create', async (req, res) => {
  try {
    const { name, disablePrivateKeys = false, blank = false } = req.body || {};
    const r = await rpc.createWallet(name, disablePrivateKeys, blank);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/wallets', async (req, res) => {
  try {
    const r = await rpc.listWallets();
    res.json({ wallets: r });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/wallets/load', async (req, res) => {
  try {
    const { name } = req.body || {};
    const r = await rpc.loadWallet(name);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Addresses and balance
router.post('/addresses/new', async (req, res) => {
  try {
    const { label = '', type = 'bech32' } = req.body || {};
    const addr = await rpc.getNewAddress(label, type);
    res.json({ address: addr });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const { minconf } = req.query;
    const bal = await rpc.getBalance(minconf ? Number(minconf) : 0);
    res.json({ balance: bal });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Send
router.post('/send', async (req, res) => {
  try {
    const { address, amount, comment = '', comment_to = '', subtractFeeFromAmount = false } = req.body || {};
    if (!address || !Number.isFinite(Number(amount))) {
      return res.status(400).json({ error: 'address and numeric amount required' });
    }
    const txid = await rpc.sendToAddress(address, Number(amount), comment, comment_to, Boolean(subtractFeeFromAmount));
    res.json({ txid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;