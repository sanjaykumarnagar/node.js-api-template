const express = require('express');
const router = express.Router();

const payments = require('../services/payments');

router.get('/config', (req, res) => {
  res.json(payments.getConfig());
});

router.post('/config', (req, res) => {
  try {
    const r = payments.setConfig(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/link', (req, res) => {
  try {
    const { provider } = req.body || {};
    if (!provider) return res.status(400).json({ error: 'provider required' });
    const r = payments.linkAccount({ provider });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/payment', (req, res) => {
  try {
    const { provider, amount, currency } = req.body || {};
    if (!provider || !amount || !currency) {
      return res.status(400).json({ error: 'provider, amount, currency required' });
    }
    const r = payments.createPayment({ provider, amount, currency });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/payment/:id', (req, res) => {
  try {
    const r = payments.getPayment({ paymentId: req.params.id });
    res.json(r);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

module.exports = router;