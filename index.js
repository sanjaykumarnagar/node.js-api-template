const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const config = require('./src/config');
const bitcoinRoutes = require('./src/routes/bitcoin');
const rpcRoutes = require('./src/routes/rpc');
const utilsRoutes = require('./src/routes/utils');
const swapRoutes = require('./src/routes/swap');
const exchangeRoutes = require('./src/routes/exchange');
const bankingRoutes = require('./src/routes/banking');

app.use(express.json());

// Serve static UI
app.use(express.static(path.join(__dirname, 'public')));

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

// RPC routes (optional)
app.use('/rpc', rpcRoutes);

// Utility routes (fees, coin selection)
app.use('/utils', utilsRoutes);

// Swap routes (quotes/orders via public exchange APIs)
app.use('/swap', swapRoutes);

// Exchange routes (API key config + authenticated orders)
app.use('/exchange', exchangeRoutes);

// Banking routes (FX, SWIFT validation, quotes, confirmation, simulated transfers)
app.use('/banking', bankingRoutes);

// Root -> UI index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
