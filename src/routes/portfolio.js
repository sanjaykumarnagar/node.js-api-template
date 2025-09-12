const express = require('express');
const router = express.Router();

const portfolio = require('../services/portfolio');

// POST /portfolio
// Body: { btc: { useRpc: true }, evm: { addresses: ["0x..."], tokens: ["0xToken1","0xToken2"] } }
router.post('/', async (req, res) => {
  try {
    const data = await portfolio.aggregate(req.body || {});
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;