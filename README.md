# Bitcoin Toolkit API (Testnet/Regtest)

A modular Node.js API for educational Bitcoin development. It provides endpoints to:
- Generate mnemonics (BIP39), derive keys (BIP32), and create SegWit addresses (P2WPKH)
- Fetch UTXOs from Blockstream testnet API
- Build, sign, and broadcast transactions using PSBT (bitcoinjs-lib)

Important:
- This project is for educational and testing purposes only.
- It does not and will not implement any "flashing" or deceptive transaction features.
- Mainnet support is intentionally omitted; only testnet/regtest are supported.

## Run

- Install: `npm install`
- Start: `npm start`
- Server runs at http://localhost:3000

Health:
- GET `/health`

Config:
- GET `/config`
- POST `/config` with `{ "network": "testnet" }` or `{ "network": "regtest" }` (default is `testnet`)

## Endpoints (prefix: `/btc`)

Wallet/Mnemonic:
- POST `/btc/wallets/mnemonic`
  - Body: `{ "strength": 128 }` one of 128,160,192,224,256
  - Returns: `{ "mnemonic": "..." }`

- POST `/btc/wallets/from-mnemonic`
  - Body: `{ "mnemonic": "...", "passphrase": "" }`
  - Returns: `{ network, xprv, xpub, fingerprint }` (testnet tprv/tpub)

- POST `/btc/wallets/derive`
  - Body: `{ "baseKey": "tprv... or tpub...", "path": "m/84'/1'/0'/0/0", "returnAddress": true }`
  - Returns: `{ publicKey, xpub, xprv?, wif?, address? }`

Addresses:
- POST `/btc/addresses/p2wpkh`
  - Body: `{ "xprvOrWif": "tprv... or WIF", "path": "m/84'/1'/0'/0/0" }`
  - Returns: `{ address, wif }`

UTXOs (testnet via Blockstream API):
- GET `/btc/utxos/:address`
  - Returns: `{ address, utxos: [{ txid, vout, value, status }] }`

PSBT/Transactions:
- POST `/btc/tx/psbt/build`
  - Body: 
    ```
    {
      "inputs": [
        { "txid": "...", "vout": 0, "value": 12345, "address": "tb1..." }
      ],
      "outputs": [
        { "address": "tb1...", "value": 10000 }
      ]
    }
    ```
  - Returns: `{ psbt: "base64..." }`

- POST `/btc/tx/psbt/sign`
  - Body: `{ "psbt": "base64...", "wifs": ["cV...", "cT..."] }`
  - Returns: `{ psbt: "base64...", "hex": "..." }`

- POST `/btc/tx/broadcast`
  - Body: `{ "hex": "..." }`
  - Returns: `{ "txid": "..." }` (testnet, via Blockstream)

Notes:
- For regtest, you must run your own Bitcoin node/indexer and adapt the `fetchUtxos` and `broadcast` functions to your setup.
- Inputs for PSBT building must include `value` and `address` so the correct witnessUtxo can be constructed.

## Development

- Code is organized with routes under `src/routes/` and Bitcoin logic under `src/services/`.
- Functions are intentionally small and "editable" for customization.
