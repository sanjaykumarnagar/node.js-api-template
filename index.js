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
const tokensRoutes = require('./src/routes/tokens');
const evmRoutes = require('./src/routes/evm');
const portfolioRoutes = require('./src/routes/portfolio');
const swap0xRoutes = require('./src/routes/swap0x');
const wiseRoutes = require('./src/routes/wise');
const paymentsRoutes = require('./src/routes/payments');
const flagsRoutes = require('./src/routes/flags');
const secretsRoutes = require('./src/routes/secrets');
const auditRoutes = require('./src/routes/audit');
const bundleRoutes = require('./src/routes/bundle');
const dbRoutes = require('./src/routes/db');

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

// Tokens routes (rates, contracts via CoinGecko)
app.use('/tokens', tokensRoutes);

// EVM routes (ETH/ERC20 send, fees, tx status)
app.use('/evm', evmRoutes);

// Portfolio aggregation
app.use('/portfolio', portfolioRoutes);

// 0x swap routes
app.use('/0x', swap0xRoutes);

// Wise integration routes
app.use('/wise', wiseRoutes);

// Payments stubs (PayPal, Google Pay)
app.use('/payments', paymentsRoutes);

// Feature flags
app.use('/flags', flagsRoutes);

// Secrets manager API
app.use('/secrets', secretsRoutes);

// Audit log
app.use('/audit', auditRoutes);

// Database routes (PostgreSQL + Excel export)
app.use('/db', dbRoutes);

// Bundle download (zip)
app.use('/', bundleRoutes);

// Root -> UI index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
