const express = require('express');
const router = express.Router();

const payments = require('../services/payments');
const store = require('../services/store');
const audit = require('../services/audit');

router.get('/config', (req, res) => {
  res.json(payments.getConfig());
});

router.post('/config', (req, res) => {
  try {
    const r = payments.setConfig(req.body || {});
    audit.log('payments.config.set', { masked: true });
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
    store.append('payments', { type: 'link', ...r });
    audit.log('payments.link', { provider, linkId: r.linkId });
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
    store.append('payments', { type: 'payment', ...r });
    audit.log('payments.payment.created', { provider, paymentId: r.paymentId, amount, currency });
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