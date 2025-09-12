const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ recipients: [], payments: [], transfers: [], audits: [] }), 'utf8');
}

function load() {
  ensure();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { recipients: [], payments: [], transfers: [], audits: [] };
  }
}

function save(db) {
  ensure();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function append(table, record) {
  const db = load();
  if (!db[table]) db[table] = [];
  db[table].push({ ...record, _ts: Date.now() });
  save(db);
  return record;
}

function list(table, limit = 100) {
  const db = load();
  const arr = db[table] || [];
  return arr.slice(-limit).reverse();
}

module.exports = { append, list };