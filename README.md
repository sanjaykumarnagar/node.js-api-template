# Bitcoin Toolkit API (Testnet/Regtest)

A modular Node.js API and minimal UI for educational Bitcoin development. It provides endpoints to:
- Generate mnemonics (BIP39), derive keys (BIP32), and create SegWit addresses (P2WPKH)
- Fetch UTXOs from Blockstream testnet API or your node via RPC
- Build, sign, and broadcast transactions using PSBT (bitcoinjs-lib)
- Estimate fees and perform simple coin selection
- Optional Bitcoin Core RPC integration (for regtest and advanced workflows)
- Exchange integration: Coinbase Advanced Trade + Kraken (API key auth) for market orders
- Experimental swap scaffolding (quotes via public exchange APIs; simulated orders)
- FX rates and simulated bank transfers scaffolding

Important:
- This project is for educational and testing purposes only.
- It does not and will not implement any "flashing" or deceptive transaction features.
- Mainnet support is off by default; if you enable it with your own node/exchange accounts, you are responsible for compliance and safety.

## Run

- Install: `npm install`
- Start: `npm start`
- Server and UI at http://localhost:3000

Health:
- GET `/health`

Config:
- GET `/config`
- POST `/config` with `{ "network": "testnet" }` or `{ "network": "regtest" }` (default is `testnet`)

UI:
- Browser UI is served from `/` and static files under `public/`. It exercises the API for quick testing.

## Bitcoin Core integration (real node)

This app integrates with the real Bitcoin Core (bitcoin/bitcoin) via RPC. To run a local regtest node quickly:

- With Docker:
  - Create a `.env` with:
    RPC_USER=user
    RPC_PASS=pass
  - Start bitcoind (regtest): `docker-compose up -d`
  - RPC will be exposed at `http://127.0.0.1:18443/` with the above credentials.
  - In the UI (RPC Config) or via API POST `/rpc/config`, set url/user/pass.

- From source (submodule optional):
  - You can add the official repo as a submodule:
    git submodule add https://github.com/bitcoin/bitcoin.git vendor/bitcoin
    (Build and run bitcoind per their docs; then point this app to your node via `/rpc/config`.)

Common RPC endpoints exposed here:
- POST `/rpc/wallets/create` { name }
- GET `/rpc/wallets`
- POST `/rpc/wallets/load` { name }
- POST `/rpc/addresses/new` { label?, type: "bech32"|"p2sh-segwit"|"legacy" }
- GET `/rpc/balance`
- POST `/rpc/send` { address, amount }

## Exchange integration (authenticated)

Config:
- GET `/exchange/config` -> returns whether keys are set (masked)
- POST `/exchange/config` body:
  {
    "kraken": { "apiKey": "...", "apiSecret": "..." },
    "coinbase": { "apiKey": "...", "apiSecret": "...", "passphrase": "..." }
  }
- You can also set via environment variables:
  - KRAKEN_API_KEY, KRAKEN_API_SECRET
  - COINBASE_API_KEY, COINBASE_API_SECRET, COINBASE_API_PASSPHRASE

Place a market order:
- POST `/exchange/order/market`
  - Kraken: `{ "provider": "kraken", "symbol": "XBTUSD", "side": "buy", "size": 0.001 }`
  - Coinbase: `{ "provider": "coinbase", "symbol": "BTC-USD", "side": "BUY", "size": 0.001 }`

Notes:
- Symbols differ by exchange (Kraken: XBTUSD; Coinbase: BTC-USD).
- Real trading requires KYC, correct account permissions, and careful key management. Keys are held in-memory only; use a secure secret manager in production.

## Tokens and EVM

Tokens (prefix: `/tokens`)
- GET `/tokens/list?vs_currency=usd&per_page=50&page=1` -> top tokens with market data (CoinGecko)
- GET `/tokens/rates?ids=bitcoin,ethereum&vs=usd,eur` -> current rates for specific ids
- GET `/tokens/contract?id=ethereum&platform=ethereum` -> contract address on Ethereum
- GET `/tokens/by-contract?contract_address=0x...` -> token details by ERC20 contract

EVM (prefix: `/evm`)
- POST `/evm/config` -> { rpcUrl } to set RPC (default: Sepolia)
- POST `/evm/wallets/new` -> generate a new EVM wallet
- POST `/evm/fees/estimate` -> estimate EIP-1559 fees for a tx request
- POST `/evm/send/eth` -> { privateKey, to, amountEth, subtractFee? } send ETH (gas deducted from balance; subtractFee reduces sent amount)
- POST `/evm/send/erc20` -> { privateKey, tokenAddress, to, amountTokens } send ERC20 (gas paid in ETH)
- GET `/evm/tx/:hash` -> transaction + receipt

## Swap (public quotes, experimental)
- POST `/swap/quote` -> `{ provider, from, to, amount }` uses public market data (Kraken/Coinbase) to estimate price
- POST `/swap/order` -> simulated order response; to enable real trades you must add authenticated calls and API keys (see Exchange integration)

## Banking and FX
- GET `/banking/fx?base=USD&symbols=USD,EUR,GBP,...` -> live FX rates (exchangerate.host)
- GET `/banking/swift/validate?code=XXXXXX` -> basic SWIFT/BIC format validation
- POST `/banking/quote`
  - Body:
    {
      "amount": 1000,
      "baseCurrency": "USD",
      "targetCurrency": "EUR",
      "bank": {
        "name": "Example Bank",
        "accountName": "John Doe",
        "accountNumber": "DE89 3704 0044 0532 0130 00",
        "currency": "EUR",
        "swift": "DEUTDEFF"
      }
    }
  - Returns: quote with fees breakdown, applied FX rate, amountTarget, totalDebit
- POST `/banking/confirm/init` -> pass the quote object to receive a confirmationId (simulates OTP flow)
- POST `/banking/confirm/verify` -> { confirmationId, code } to verify (simulated OTP)
- POST `/banking/transfer` -> { confirmationId } to finalize (simulated payout; integrate a provider for real transfers)
- POST `/banking/convert-btc` -> { amountBTC, targetCurrency } returns conversion using Coinbase public BTC rates

## Bitcoin Endpoints

Bitcoin (prefix: `/btc`)
- POST `/btc/wallets/mnemonic`
  - Body: `{ "strength": 128 }` one of 128,160,192,224,256
  - Returns: `{ "mnemonic": "..." }`

- POST `/btc/wallets/from-mnemonic`
  - Body: `{ "mnemonic": "...", "passphrase": "" }`
  - Returns: `{ network, xprv, xpub, fingerprint }` (testnet tprv/tpub)

- POST `/btc/wallets/derive`
  - Body: `{ "baseKey": "tprv... or tpub...", "path": "m/84'/1'/0'/0/0", "returnAddress": true }`
  - Returns: `{ publicKey, xpub, xprv?, wif?, address? }`

- POST `/btc/addresses/p2wpkh`
  - Body: `{ "xprvOrWif": "tprv... or WIF", "path": "m/84'/1'/0'/0/0" }`
  - Returns: `{ address, wif }`

- GET `/btc/utxos/:address`
  - Returns: `{ address, utxos: [{ txid, vout, value, ... }] }`
  - Uses Blockstream testnet API by default; if RPC configured, uses your node.

- POST `/btc/tx/psbt/build`
  - Body:
    {
      "inputs": [
        { "txid": "...", "vout": 0, "value": 12345, "address": "tb1..." }
      ],
      "outputs": [
        { "address": "tb1...", "value": 10000 }
      ]
    }
  - Returns: `{ psbt: "base64..." }`

- POST `/btc/tx/psbt/sign`
  - Body: `{ "psbt": "base64...", "wifs": ["cV...", "cT..."] }`
  - Returns: `{ psbt: "base64...", "hex": "..." }`

- POST `/btc/tx/broadcast`
  - Body: `{ "hex": "..." }`
  - Returns: `{ "txid": "..." }` (testnet via Blockstream, or via RPC if configured)

Utils (prefix: `/utils`)
- GET `/utils/fees` -> `{ fees: { "1": 12, "2": 8, ... } }` (sat/vB). For regtest, uses RPC estimatesmartfee or defaults to low values.
- POST `/utils/coinselect`
  - Body: `{ utxos: [{txid,vout,value}], targets: [{address,value}], feeRate: 2 }`
  - Returns: `{ inputs, fee, change }` simple greedy selection for P2WPKH.

## Development

- App entry: `index.js`. API grouped in `src/routes/` and logic in `src/services/`.
- Minimal UI in `public/` to interact with the API quickly.
- Functions are intentionally small and "editable" for customization.
