const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCredentials } = require('../utils/validate');

test('rejects empty credentials', () => {
  const r = validateCredentials('', '');
  assert.equal(r.ok, false);
});

test('rejects short password', () => {
  const r = validateCredentials('user', '123');
  assert.equal(r.ok, false);
  assert.match(r.error, /at least 6/);
});

test('accepts valid credentials', () => {
  const r = validateCredentials('user', 'user123');
  assert.equal(r.ok, true);
  assert.equal(r.username, 'user');
});
