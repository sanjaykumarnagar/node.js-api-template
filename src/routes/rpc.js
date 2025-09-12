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

module.exports = router;