const express = require('express');
const axios = require('axios');
const router = express.Router();

const banking = require('../services/banking');

// FX rates via exchangerate.host
router.get('/fx', async (req, res) => {
  try {
    const base = (req.query.base || 'USD').toUpperCase();
    const symbols = (req.query.symbols || 'USD,EUR,GBP,JPY,NGN,INR,MXN,BRL').toUpperCase();
    const { data } = await axios.get(`https://api.exchangerate.host/latest`, {
      params: { base, symbols },
    });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Validate SWIFT/BIC format
router.get('/swift/validate', (req, res) => {
  const code = (req.query.code || '').toUpperCase();
  const valid = banking.validateSwiftFormat(code);
  res.json({ code, valid });
});

// Quote transfer with fees and total
router.post('/quote', async (req, res) => {
  try {
    const { amount, baseCurrency, targetCurrency, bank } = req.body || {};
    const q = await banking.quoteTransfer({ amount: Number(amount), baseCurrency, targetCurrency, bank });
    res.json(q);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Initialize confirmation (simulated front bank confirmation / OTP)
router.post('/confirm/init', (req, res) => {
  try {
    const { quote } = req.body || {};
    if (!quote || !quote.quoteId) return res.status(400).json({ error: 'quote with quoteId required' });
    const r = banking.initConfirmation(quote);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Verify confirmation (OTP)
router.post('/confirm/verify', (req, res) => {
  try {
    const { confirmationId, code } = req.body || {};
    const r = banking.verifyConfirmation({ confirmationId, code });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Finalize transfer (simulated payout)
router.post('/transfer', (req, res) => {
  try {
    const { confirmationId } = req.body || {};
    const r = banking.finalizeTransfer({ confirmationId });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Convert BTC to any fiat currency
router.post('/convert-btc', async (req, res) => {
  try {
    const { amountBTC, targetCurrency } = req.body || {};
    const r = await banking.convertBTC({ amountBTC: Number(amountBTC), targetCurrency });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;