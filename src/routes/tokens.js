const express = require('express');
const router = express.Router();

const tokens = require('../services/tokens');

// List tokens with market data
router.get('/list', async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const per_page = Math.min(250, Number(req.query.per_page || 50));
    const vs_currency = (req.query.vs_currency || 'usd');
    const data = await tokens.listTokens({ page, per_page, vs_currency });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get rates for specific ids
router.get('/rates', async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ error: 'ids required (comma-separated coingecko ids)' });
    const vs = (req.query.vs || 'usd,eur').split(',').map(s => s.trim()).filter(Boolean);
    const data = await tokens.getRates({ ids, vs_currencies: vs });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get contract address on Ethereum by token id
router.get('/contract', async (req, res) => {
  try {
    const id = req.query.id;
    const platform = req.query.platform || 'ethereum';
    if (!id) return res.status(400).json({ error: 'id required' });
    const data = await tokens.getContractAddress({ id, platform });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get token details by contract (Ethereum)
router.get('/by-contract', async (req, res) => {
  try {
    const contract_address = req.query.contract_address;
    if (!contract_address) return res.status(400).json({ error: 'contract_address required' });
    const data = await tokens.getTokenByContract({ contract_address });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;