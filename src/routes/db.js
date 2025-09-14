const express = require('express');
const router = express.Router();

const db = require('../services/db');

// Get current DB config (masked)
router.get('/config', (req, res) => {
  res.json(db.getConfig());
});

// Set DB config
router.post('/config', (req, res) => {
  try {
    const cfg = db.setConfig(req.body || {});
    res.json(cfg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Init sample table and data
router.post('/init', async (req, res) => {
  try {
    const { table = 'items' } = req.body || {};
    const r = await db.initSample(table);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Download table as Excel
router.get('/excel', async (req, res) => {
  try {
    const table = (req.query.table || 'items');
    await db.exportTableToExcel(table, res);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;