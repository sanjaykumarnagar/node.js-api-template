function getFlags() {
  return {
    enableExchange: process.env.ENABLE_EXCHANGE === '1',
    enableWise: !!process.env.WISE_API_TOKEN,
    enablePayPal: !!process.env.PAYPAL_CLIENT_ID,
    enableGPay: !!process.env.GPAY_MERCHANT_ID,
    enableEvm: true,
    enableTokens: true,
    enableBanking: true,
  };
}

module.exports = { getFlags };