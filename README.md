# Bitcoin Toolkit API (Testnet/Regtest)

A modular Node.js API and minimal UI for educational Bitcoin development. It provides endpoints to:
- Generate mnemonics (BIP39), derive keys (BIP32), and create SegWit addresses (P2WPKH)
- Fetch UTXOs from Blockstream testnet API or your node via RPC
- Build, sign, and broadcast transactions using PSBT (bitcoinjs-lib)
- Estimate fees and perform simple coin selection
- Optional Bitcoin Core RPC integration (for regtest and advanced workflows)

Important:
- This project is for educational and testing purposes only.
- It does not and will not implement any "flashing" or deceptive transaction features.
- Mainnet support is intentionally omitted; only testnet/regtest are supported.

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

## Endpoints

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

RPC (optional, prefix: `/rpc`)
- POST `/rpc/config` -> `{ url, username, password }` to set RPC credentials (password masked in responses)
- GET `/rpc/config` -> return current RPC config (masked)
- DELETE `/rpc/config` -> clear RPC config
- GET `/rpc/health` -> `getblockchaininfo` from your node

Notes:
- For regtest, configure your node via `/rpc/config` and import addresses/descriptors so listunspent returns your UTXOs.
- Inputs for PSBT building must include `value` and `address` so the correct witnessUtxo can be constructed.

## Development

- App entry: `index.js`. API grouped in `src/routes/` and logic in `src/services/`.
- Minimal UI in `public/` to interact with the API quickly.
- Functions are intentionally small and "editable" for customization.
