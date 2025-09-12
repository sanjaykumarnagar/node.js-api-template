const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json.enc');
const MASTER_KEY = process.env.SECRET_MASTER_KEY || null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function encrypt(obj) {
  if (!MASTER_KEY) throw new Error('SECRET_MASTER_KEY not set');
  const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(blob) {
  if (!MASTER_KEY) throw new Error('SECRET_MASTER_KEY not set');
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const key = crypto.createHash('sha256').update(MASTER_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}

function load() {
  try {
    ensureDir();
    if (!fs.existsSync(SECRETS_FILE)) return {};
    const blob = fs.readFileSync(SECRETS_FILE, 'utf8');
    return decrypt(blob);
  } catch {
    return {};
  }
}

function save(obj) {
  ensureDir();
  const blob = encrypt(obj);
  fs.writeFileSync(SECRETS_FILE, blob, 'utf8');
}

function getAll(masked = true) {
  const current = load();
  if (!masked) return current;
  const maskedObj = {};
  for (const [k, v] of Object.entries(current)) {
    maskedObj[k] = typeof v === 'string' ? '***' : v && typeof v === 'object' ? '***' : v;
  }
  return maskedObj;
}

function set(k, v) {
  const current = load();
  current[k] = v;
  save(current);
  return true;
}

function remove(k) {
  const current = load();
  delete current[k];
  save(current);
  return true;
}

module.exports = {
  getAll,
  set,
  remove,
};