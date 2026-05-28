const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

let app;

before(() => {
  app = createApp();
});

test('GET /api/games/catalog returns paginated shape', async () => {
  const res = await request(app).get('/api/games/catalog?page=1&limit=5');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.items));
  assert.equal(typeof res.body.total, 'number');
  assert.equal(typeof res.body.page, 'number');
});

test('GET /api/games/catalog filters by q', async () => {
  const res = await request(app).get('/api/games/catalog?q=zzz_no_match_xyz');
  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 0);
});
