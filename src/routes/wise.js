const express = require('express');
const router = express.Router();

const wise = require('../services/wise');
const store = require('../services/store');
const audit = require('../services/audit');

router.get('/config', (req, res) => {
  res.json(wise.getConfig());
});

router.post('/config', (req, res) => {
  try {
    const r = wise.setConfig(req.body || {});
    audit.log('wise.config.set', { masked: true });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/recipients', async (req, res) => {
  try {
    const r = await wise.createRecipient(req.body || {});
    store.append('recipients', r);
    audit.log('wise.recipient.created', { id: r.id });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/quotes', async (req, res) => {
  try {
    const r = await wise.createQuote(req.body || {});
    audit.log('wise.quote.created', { id: r.id || r.quoteUuid });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/transfers', async (req, res) => {
  try {
    const r = await wise.createTransfer(req.body || {});
    store.append('transfers', r);
    audit.log('wise.transfer.created', { id: r.id });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/fund', async (req, res) => {
  try {
    const r = await wise.fundTransfer(req.body || {});
    audit.log('wise.transfer.funded', { transferId: req.body && req.body.transferId });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;