const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

let app;

before(() => {
  app = createApp();
});

test('login returns access and refresh tokens', async () => {
  const res = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.ok(res.body.refreshToken);
});

test('refresh issues new token pair', async () => {
  const login = await request(app).post('/api/login').send({ username: 'user', password: 'user123' });
  const res = await request(app).post('/api/refresh').send({ refreshToken: login.body.refreshToken });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.ok(res.body.refreshToken);
  assert.notEqual(res.body.refreshToken, login.body.refreshToken);
});

test('POST /api/games forbidden for regular user', async () => {
  const login = await request(app).post('/api/login').send({ username: 'user', password: 'user123' });
  const res = await request(app)
    .post('/api/games')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ title: 'Hack Game' });
  assert.equal(res.status, 403);
});
