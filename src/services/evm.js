const { ethers } = require('ethers');

// Simple EVM service for ETH/ERC20 send with fee estimation and optional fee deduction.
// Defaults to Ethereum Sepolia via public RPC; set EVM_RPC_URL to override.
const state = {
  rpcUrl: process.env.EVM_RPC_URL || 'https://rpc.sepolia.org',
};

function setRpc(url) {
  if (!url) throw new Error('url required');
  state.rpcUrl = url;
  return { rpcUrl: state.rpcUrl };
}

function getProvider() {
  return new ethers.JsonRpcProvider(state.rpcUrl);
}

function getWallet(privateKey) {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

function erc20Iface() {
  return new ethers.Interface([
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint256 amount) returns (bool)',
  ]);
}

async function estimateFees(txRequest) {
  const provider = getProvider();
  const feeData = await provider.getFeeData(); // EIP-1559
  const gasLimit = txRequest.gasLimit ? ethers.toBigInt(txRequest.gasLimit) : await provider.estimateGas(txRequest);
  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits('20', 'gwei');
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.parseUnits('1', 'gwei');
  const fee = gasLimit * (maxFeePerGas);
  return {
    gasLimit: gasLimit.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    estimatedFeeWei: fee.toString(),
    estimatedFeeEth: ethers.formatEther(fee),
  };
}

async function sendETH({ privateKey, to, amountEth, subtractFee = false }) {
  if (!privateKey || !to || !amountEth) throw new Error('privateKey, to, amountEth required');
  const wallet = getWallet(privateKey);
  const amountWei = ethers.parseEther(String(amountEth));

  // Prepare tx
  const feeData = await wallet.provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits('20', 'gwei');
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? ethers.parseUnits('1', 'gwei');
  const gasLimit = await wallet.estimateGas({ to, value: amountWei });

  let value = amountWei;
  if (subtractFee) {
    const estimatedFee = gasLimit * maxFeePerGas;
    if (value <= estimatedFee) throw new Error('Amount too small to cover fees');
    value = value - estimatedFee;
  }

  const tx = await wallet.sendTransaction({ to, value, gasLimit, maxFeePerGas, maxPriorityFeePerGas });
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
}

async function sendERC20({ privateKey, tokenAddress, to, amountTokens, subtractFee = false }) {
  if (!privateKey || !tokenAddress || !to || amountTokens == null) throw new Error('privateKey, tokenAddress, to, amountTokens required');
  const wallet = getWallet(privateKey);
  const contract = new ethers.Contract(tokenAddress, erc20Iface(), wallet);

  const decimals = await contract.decimals();
  const amount = ethers.parseUnits(String(amountTokens), decimals);

  // Build the tx
  const data = contract.interface.encodeFunctionData('transfer', [to, amount]);
  const txReq = { to: tokenAddress, data };
  const fees = await estimateFees(txReq);

  // For ERC20, fee must be paid in ETH; subtractFee reduces token amount to leave ETH untouched.
  const tx = await wallet.sendTransaction({
    to: tokenAddress,
    data,
    gasLimit: fees.gasLimit,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
  });
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
}

async function getTx(hash) {
  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(hash);
  const tx = await provider.getTransaction(hash);
  return { tx, receipt };
}

async function newAddress() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic && wallet.mnemonic.phrase ? wallet.mnemonic.phrase : null,
  };
}

module.exports = {
  setRpc,
  estimateFees,
  sendETH,
  sendERC20,
  getTx,
  newAddress,
};