const express = require('express');
const router = express.Router();

const audit = require('../services/audit');

router.get('/', (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json({ audits: audit.recent(limit) });
});

module.exports = router;