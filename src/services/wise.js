const axios = require('axios');

let cfg = {
  apiBase: process.env.WISE_API_BASE || 'https://api.sandbox.transferwise.tech',
  apiToken: process.env.WISE_API_TOKEN || null,
  profileId: process.env.WISE_PROFILE_ID || null,
};

function setConfig({ apiBase, apiToken, profileId }) {
  if (apiBase) cfg.apiBase = apiBase;
  if (apiToken) cfg.apiToken = apiToken;
  if (profileId) cfg.profileId = profileId;
  return getConfig();
}

function getConfig() {
  return {
    apiBase: cfg.apiBase,
    apiToken: !!cfg.apiToken,
    profileId: cfg.profileId || null,
  };
}

function client() {
  if (!cfg.apiToken || !cfg.profileId) {
    throw new Error('Wise not configured: apiToken and profileId required');
  }
  const inst = axios.create({
    baseURL: cfg.apiBase,
    headers: {
      Authorization: `Bearer ${cfg.apiToken}`,
      'Content-Type': 'application/json',
    },
  });
  return inst;
}

// Create recipient account
async function createRecipient({ name, iban, currency, swiftBic, accountNumber, sortCode, ifscCode }) {
  const api = client();
  // Use generic schema; IBAN or local details depending on currency
  const payload = {
    profile: Number(cfg.profileId),
    accountHolderName: name,
    currency,
    type: iban ? 'iban' : 'swift_code',
    details: iban ? { iban } : {
      swiftCode: swiftBic,
      accountNumber,
      sortCode,
      ifscCode,
    },
  };
  const { data } = await api.post('/v1/accounts', payload);
  return data;
}

// Create a quote for transfer
async function createQuote({ sourceCurrency, targetCurrency, targetAmount }) {
  const api = client();
  const payload = {
    profile: Number(cfg.profileId),
    sourceCurrency,
    targetCurrency,
    targetAmount,
    payOut: 'BANK_TRANSFER',
  };
  const { data } = await api.post('/v3/profiles/' + cfg.profileId + '/quotes', payload);
  return data;
}

// Create a transfer
async function createTransfer({ targetAccount, quoteUuid, customerTransactionId }) {
  const api = client();
  const payload = {
    targetAccount: Number(targetAccount),
    quoteUuid,
    customerTransactionId,
    details: { reference: 'Toolkit transfer' },
  };
  const { data } = await api.post('/v1/transfers', payload);
  return data;
}

// Fund transfer (sandbox)
async function fundTransfer({ transferId }) {
  const api = client();
  const { data } = await api.post(`/v3/profiles/${cfg.profileId}/transfers/${transferId}/payments`, {
    type: 'BALANCE',
  });
  return data;
}

module.exports = {
  setConfig,
  getConfig,
  createRecipient,
  createQuote,
  createTransfer,
  fundTransfer,
};