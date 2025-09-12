const express = require('express');
const router = express.Router();

const { getFlags } = require('../services/flags');

router.get('/', (req, res) => {
  res.json(getFlags());
});

module.exports = router;