const express = require('express');
const router = express.Router();

const evm = require('../services/evm');

// Configure EVM RPC
router.post('/config', (req, res) => {
  try {
    const { rpcUrl } = req.body || {};
    const r = evm.setRpc(rpcUrl);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Generate new address
router.post('/wallets/new', async (req, res) => {
  const r = await evm.newAddress();
  res.json(r);
});

// Estimate fees for a tx request (basic)
router.post('/fees/estimate', async (req, res) => {
  try {
    const tx = req.body || {};
    const r = await evm.estimateFees(tx);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Send ETH
router.post('/send/eth', async (req, res) => {
  try {
    const { privateKey, to, amountEth, subtractFee = false } = req.body || {};
    const r = await evm.sendETH({ privateKey, to, amountEth, subtractFee });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Send ERC20
router.post('/send/erc20', async (req, res) => {
  try {
    const { privateKey, tokenAddress, to, amountTokens, subtractFee = false } = req.body || {};
    const r = await evm.sendERC20({ privateKey, tokenAddress, to, amountTokens, subtractFee });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Tx status
router.get('/tx/:hash', async (req, res) => {
  try {
    const r = await evm.getTx(req.params.hash);
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;