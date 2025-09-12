const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// In-memory store for pending confirmations
const state = {
  confirmations: new Map(), // id -> { data, otp, status }
};

// Basic SWIFT/BIC format check: 8 or 11 chars, alphanumeric, bank(4) country(2 letters) location(2) branch(3 optional)
function validateSwiftFormat(code) {
  if (!code || typeof code !== 'string') return false;
  const c = code.trim().toUpperCase();
  if (!(c.length === 8 || c.length === 11)) return false;
  if (!/^[A-Z0-9]+$/.test(c)) return false;
  const bank = c.slice(0, 4);
  const country = c.slice(4, 6);
  const location = c.slice(6, 8);
  const branch = c.length === 11 ? c.slice(8) : null;
  if (!/^[A-Z]{4}$/.test(bank)) return false;
  if (!/^[A-Z]{2}$/.test(country)) return false;
  if (!/^[A-Z0-9]{2}$/.test(location)) return false;
  if (branch && !/^[A-Z0-9]{3}$/.test(branch)) return false;
  return true;
}

async function fetchFxRate(base, target) {
  const { data } = await axios.get('https://api.exchangerate.host/latest', {
    params: { base: base.toUpperCase(), symbols: target.toUpperCase() },
  });
  const rate = data && data.rates && data.rates[target.toUpperCase()];
  if (!rate) throw new Error('FX rate unavailable');
  return Number(rate);
}

async function btcToFiatRate(target) {
  // Use Coinbase exchange rates for BTC
  const url = `https://api.coinbase.com/v2/exchange-rates?currency=BTC`;
  const { data } = await axios.get(url);
  const rate = Number(data.data.rates[target.toUpperCase()]);
  if (!rate) throw new Error('No BTC rate for target currency');
  // 1 BTC = rate target units
  return rate;
}

// Simple fee model (editable): percentage + flat fee + FX margin
function calculateFees({ amountBase, baseCurrency, targetCurrency }) {
  const pct = 0.005; // 0.5%
  const flat = 2.5; // flat in base currency
  const fxMarginPct = 0.002; // 0.2% applied to fx
  const fee = amountBase * pct + flat;
  return { pct, flat, fxMarginPct, fee };
}

async function quoteTransfer({ amount, baseCurrency, targetCurrency, bank }) {
  if (!amount || amount <= 0) throw new Error('amount must be positive');
  if (!baseCurrency || !targetCurrency) throw new Error('baseCurrency and targetCurrency required');
  if (!bank || !bank.accountName || !bank.accountNumber || !bank.swift) {
    throw new Error('bank details incomplete (accountName, accountNumber, swift required)');
  }
  if (!validateSwiftFormat(bank.swift)) {
    throw new Error('Invalid SWIFT/BIC format');
  }
  const rate = await fetchFxRate(baseCurrency, targetCurrency);
  const fees = calculateFees({ amountBase: amount, baseCurrency, targetCurrency });
  const appliedRate = rate * (1 - fees.fxMarginPct);
  const amountConverted = amount * appliedRate;
  const totalDebit = amount + fees.fee;

  return {
    quoteId: uuidv4(),
    baseCurrency: baseCurrency.toUpperCase(),
    targetCurrency: targetCurrency.toUpperCase(),
    fxRate: rate,
    appliedFxRate: appliedRate,
    amountBase: amount,
    amountTarget: Math.round(amountConverted * 100) / 100,
    fees: {
      percentage: fees.pct,
      flat: fees.flat,
      fxMarginPct: fees.fxMarginPct,
      total: Math.round(fees.fee * 100) / 100,
    },
    totalDebit: Math.round(totalDebit * 100) / 100,
    bank: {
      name: bank.name || null,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      swift: bank.swift.toUpperCase(),
      currency: bank.currency ? bank.currency.toUpperCase() : targetCurrency.toUpperCase(),
    },
    expiresInSeconds: 180,
  };
}

function initConfirmation(quote) {
  const id = quote.quoteId || uuidv4();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  state.confirmations.set(id, { data: quote, otp, status: 'pending' });
  return { confirmationId: id, status: 'otp_sent' };
}

function verifyConfirmation({ confirmationId, code }) {
  const entry = state.confirmations.get(confirmationId);
  if (!entry) throw new Error('Invalid confirmationId');
  if (entry.status !== 'pending') throw new Error('Invalid status');
  if (String(code).trim() !== entry.otp) throw new Error('Invalid code');
  entry.status = 'confirmed';
  return { ok: true };
}

function finalizeTransfer({ confirmationId }) {
  const entry = state.confirmations.get(confirmationId);
  if (!entry) throw new Error('Invalid confirmationId');
  if (entry.status !== 'confirmed') throw new Error('Not confirmed');
  entry.status = 'completed';
  const reference = `TRX-${confirmationId.slice(0, 8).toUpperCase()}`;
  return {
    status: 'completed',
    reference,
    executedAt: new Date().toISOString(),
    details: entry.data,
    note: 'Simulated transfer. Integrate a regulated provider (Wise/Stripe/Circle/Bank API) for real payouts.',
  };
}

async function convertBTC({ amountBTC, targetCurrency }) {
  if (!amountBTC || amountBTC <= 0) throw new Error('amountBTC must be positive');
  const rate = await btcToFiatRate(targetCurrency);
  return {
    amountBTC,
    targetCurrency: targetCurrency.toUpperCase(),
    rate,
    amountTarget: amountBTC * rate,
  };
}

module.exports = {
  validateSwiftFormat,
  fetchFxRate,
  btcToFiatRate,
  calculateFees,
  quoteTransfer,
  initConfirmation,
  verifyConfirmation,
  finalizeTransfer,
  convertBTC,
};