const express = require('express');
const router = express.Router();

const swap = require('../services/swap');

// Get quote
router.post('/quote', async (req, res) => {
  try {
    const { provider = 'kraken', from = 'BTC', to = 'USDT', amount } = req.body || {};
    const q = await swap.getQuote({ provider, from, to, amount: Number(amount) });
    res.json(q);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Create order (requires API keys configured as env or per-provider config)
router.post('/order', async (req, res) => {
  try {
    const { provider = 'kraken', from = 'BTC', to = 'USDT', amount } = req.body || {};
    const result = await swap.createOrder({ provider, from, to, amount: Number(amount) });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;