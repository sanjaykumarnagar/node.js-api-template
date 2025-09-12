const express = require('express');
const axios = require('axios');
const router = express.Router();

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

// Simulated bank transfer endpoint
router.post('/transfer', async (req, res) => {
  try {
    const { amount, currency, iban_or_routing, swift_bic, recipient_name } = req.body || {};
    if (!amount || !currency || !recipient_name) {
      return res.status(400).json({ error: 'amount, currency, recipient_name required' });
    }
    // Placeholder response: implement with a provider like Wise/Stripe/Circle.
    res.json({
      status: 'simulated',
      provider: 'none',
      details: { amount, currency, iban_or_routing, swift_bic, recipient_name },
      note: 'Integrate a payments provider (Wise/Stripe/Circle/Bank APIs) for real bank transfers.',
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;