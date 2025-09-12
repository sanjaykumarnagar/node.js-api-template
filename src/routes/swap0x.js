const express = require('express');
const router = express.Router();

const zrx = require('../services/swap0x');

router.get('/quote', async (req, res) => {
  try {
    const chainId = Number(req.query.chainId || 11155111);
    const sellToken = req.query.sellToken;
    const buyToken = req.query.buyToken;
    const sellAmount = req.query.sellAmount;
    const takerAddress = req.query.takerAddress;
    const slippagePercentage = req.query.slippagePercentage;
    if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
      return res.status(400).json({ error: 'sellToken, buyToken, sellAmount, takerAddress required' });
    }
    const data = await zrx.getQuote({ chainId, sellToken, buyToken, sellAmount, takerAddress, slippagePercentage });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/build', async (req, res) => {
  try {
    const { chainId = 11155111, sellToken, buyToken, sellAmount, takerAddress, slippagePercentage } = req.body || {};
    const data = await zrx.buildTx({ chainId, sellToken, buyToken, sellAmount, takerAddress, slippagePercentage });
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;