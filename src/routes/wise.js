const express = require('express');
const router = express.Router();

const wise = require('../services/wise');

router.get('/config', (req, res) => {
  res.json(wise.getConfig());
});

router.post('/config', (req, res) => {
  try {
    const r = wise.setConfig(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/recipients', async (req, res) => {
  try {
    const r = await wise.createRecipient(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/quotes', async (req, res) => {
  try {
    const r = await wise.createQuote(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/transfers', async (req, res) => {
  try {
    const r = await wise.createTransfer(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/fund', async (req, res) => {
  try {
    const r = await wise.fundTransfer(req.body || {});
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;