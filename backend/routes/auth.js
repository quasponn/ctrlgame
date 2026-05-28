const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const config = require('../config');
const { validateCredentials } = require('../utils/validate');
const { signAccessToken } = require('../utils/accessToken');
const {
  createRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  rotateRefreshToken,
} = require('../services/refreshTokens');

const router = express.Router();
const { MIN_PASSWORD_LENGTH } = config;

async function issueTokenPair(user) {
  const token = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { token, refreshToken };
}

router.post('/register', async (req, res) => {
  const check = validateCredentials(req.body.username, req.body.password, MIN_PASSWORD_LENGTH);
  if (!check.ok) return res.status(400).json({ error: check.error });
  const { username, password } = check;
  db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
    if (row) return res.status(400).json({ error: 'Username already exists' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function (err2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true, userId: this.lastID });
    });
  });
});

router.post('/login', (req, res) => {
  const check = validateCredentials(req.body.username, req.body.password, MIN_PASSWORD_LENGTH);
  if (!check.ok) return res.status(400).json({ error: check.error });
  const { username, password } = check;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid username or password' });
    try {
      const tokens = await issueTokenPair(user);
      res.json(tokens);
    } catch {
      res.status(500).json({ error: 'Database error' });
    }
  });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = String(req.body.refreshToken ?? '').trim();
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  try {
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) return res.status(401).json({ error: 'Invalid or expired refresh token' });
    const token = signAccessToken(rotated);
    res.json({ token, refreshToken: rotated.refreshToken });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/logout', async (req, res) => {
  const refreshToken = String(req.body.refreshToken ?? '').trim();
  if (!refreshToken) return res.json({ success: true });
  try {
    await revokeRefreshToken(refreshToken);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
