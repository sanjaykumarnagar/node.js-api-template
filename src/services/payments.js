const { v4: uuidv4 } = require('uuid');

const state = {
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || null,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || null,
  },
  gpay: {
    merchantId: process.env.GPAY_MERCHANT_ID || null,
    merchantName: process.env.GPAY_MERCHANT_NAME || null,
  },
  links: new Map(), // id -> { provider, status, info }
  payments: new Map(), // id -> { provider, status, amount, currency }
};

function getConfig() {
  return {
    paypal: { clientId: !!state.paypal.clientId, clientSecret: !!state.paypal.clientSecret },
    gpay: { merchantId: !!state.gpay.merchantId, merchantName: !!state.gpay.merchantName },
  };
}

function setConfig({ paypal, gpay }) {
  if (paypal) {
    if (paypal.clientId) state.paypal.clientId = paypal.clientId;
    if (paypal.clientSecret) state.paypal.clientSecret = paypal.clientSecret;
  }
  if (gpay) {
    if (gpay.merchantId) state.gpay.merchantId = gpay.merchantId;
    if (gpay.merchantName) state.gpay.merchantName = gpay.merchantName;
  }
  return getConfig();
}

// Stubs for account linking
function linkAccount({ provider }) {
  const id = uuidv4();
  state.links.set(id, { provider, status: 'linked' });
  return { linkId: id, provider, status: 'linked' };
}

// Stubs for payment creation
function createPayment({ provider, amount, currency }) {
  const id = uuidv4();
  state.payments.set(id, { provider, amount, currency, status: 'created' });
  return { paymentId: id, provider, amount, currency, status: 'created' };
}

function getPayment({ paymentId }) {
  const p = state.payments.get(paymentId);
  if (!p) throw new Error('Not found');
  return { paymentId, ...p };
}

module.exports = {
  getConfig,
  setConfig,
  linkAccount,
  createPayment,
  getPayment,
};