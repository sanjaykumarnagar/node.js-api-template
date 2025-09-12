const express = require('express');
const router = express.Router();

const exConfig = require('../services/exchange/config');
const kraken = require('../services/exchange/kraken');
const coinbase = require('../services/exchange/coinbase');

router.get('/config', (req, res) => {
  res.json(exConfig.get());
});

router.post('/config', (req, res) => {
  try {
    const cfg = exConfig.set(req.body || {});
    res.json(cfg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Place market order
router.post('/order/market', async (req, res) => {
  try {
    const { provider, symbol, side, size } = req.body || {};
    if (!provider || !symbol || !side || !size) {
      return res.status(400).json({ error: 'provider, symbol, side, size required' });
    }
    let result;
    if (provider.toLowerCase() === 'kraken') {
      result = await kraken.createMarketOrder({ pair: symbol, side: side.toLowerCase(), volume: size });
    } else if (provider.toLowerCase() === 'coinbase') {
      result = await coinbase.createMarketOrder({ product_id: symbol, side, size });
    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    res.json({ provider, result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;