const express = require('express');
const router = express.Router();

const secrets = require('../services/secrets');

router.get('/', (req, res) => {
  try {
    const masked = req.query.masked !== 'false';
    res.json({ secrets: secrets.getAll(masked) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key required' });
    secrets.set(String(key), value);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/', (req, res) => {
  try {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key required' });
    secrets.remove(String(key));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;