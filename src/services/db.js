const { Pool } = require('pg');
const ExcelJS = require('exceljs');

let cfg = {
  connectionString: process.env.PG_CONNECTION_STRING || null,
  host: process.env.PGHOST || null,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : null,
  database: process.env.PGDATABASE || null,
  user: process.env.PGUSER || null,
  password: process.env.PGPASSWORD || null,
};

function getConfig() {
  const out = { ...cfg };
  if (out.password) out.password = '***';
  return out;
}

function setConfig(input = {}) {
  cfg = { ...cfg, ...input };
  return getConfig();
}

function buildPool() {
  if (cfg.connectionString) {
    return new Pool({ connectionString: cfg.connectionString });
  }
  if (!cfg.host || !cfg.user || !cfg.database) {
    throw new Error('Postgres not configured. Provide connectionString or host/user/database');
  }
  return new Pool({
    host: cfg.host,
    port: cfg.port || 5432,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password || undefined,
    ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined,
  });
}

async function query(text, params) {
  const pool = buildPool();
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
    await pool.end();
  }
}

async function initSample(tableName = 'items') {
  const t = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  await query(`
    CREATE TABLE IF NOT EXISTS ${t} (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      value NUMERIC(18,8) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  // Insert a few rows if empty
  const count = await query(`SELECT COUNT(*) AS c FROM ${t}`);
  const c = Number(count.rows[0].c || 0);
  if (c === 0) {
    await query(`INSERT INTO ${t} (name, value) VALUES 
      ('Alpha', 1.23),
      ('Beta', 4.56),
      ('Gamma', 7.89)
    `);
  }
  return { ok: true, table: t, inserted: c === 0 ? 3 : 0 };
}

async function exportTableToExcel(tableName, res) {
  const t = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const q = await query(`SELECT * FROM ${t} ORDER BY id ASC`);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(t);

  if (q.rows.length) {
    const columns = Object.keys(q.rows[0]);
    ws.addRow(columns);
    for (const row of q.rows) {
      ws.addRow(columns.map(c => row[c]));
    }
  } else {
    ws.addRow(['No data']);
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${t}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

module.exports = {
  getConfig,
  setConfig,
  query,
  initSample,
  exportTableToExcel,
};