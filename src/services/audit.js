const store = require('./store');

function log(event, payload) {
  return store.append('audits', { event, payload });
}

function recent(limit = 100) {
  return store.list('audits', limit);
}

module.exports = { log, recent };