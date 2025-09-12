const express = require('express');
const router = express.Router();

const { feeEstimates, coinSelect } = require('../services/utils');

// Fee estimates
router.get('/fees', async (req, res) => {
  try {
    const fees = await feeEstimates();
    res.json({ fees });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Coin selection
router.post('/coinselect', (req, res) => {
  try {
    const { utxos, targets, feeRate } = req.body || {};
    if (!Array.isArray(utxos) || !Array.isArray(targets) || !Number.isFinite(Number(feeRate))) {
      return res.status(400).json({ error: 'utxos, targets, feeRate required' });
    }
    const result = coinSelect(utxos, targets, Number(feeRate));
    if (!result) return res.status(400).json({ error: 'Insufficient funds' });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;