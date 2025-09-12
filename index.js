const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const config = require('./src/config');
const bitcoinRoutes = require('./src/routes/bitcoin');

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'bitcoin-toolkit', network: config.get().network });
});

// Runtime-configurable network (testnet/regtest only)
app.get('/config', (req, res) => {
  res.json(config.get());
});

app.post('/config', (req, res) => {
  try {
    const { network } = req.body || {};
    config.set({ network });
    res.json(config.get());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Bitcoin routes
app.use('/btc', bitcoinRoutes);

// Root
app.get('/', (req, res) => {
  res.send('Bitcoin Toolkit API (testnet/regtest) is running. See /health and /btc endpoints.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
