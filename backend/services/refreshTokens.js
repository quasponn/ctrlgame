const crypto = require('crypto');
const { db } = require('../db');
const config = require('../config');

const { REFRESH_TOKEN_DAYS } = config;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function expiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_DAYS);
  return d.toISOString();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function createRefreshToken(userId) {
  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  await run(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt()]
  );
  return token;
}

async function findUserByRefreshToken(token) {
  const tokenHash = hashToken(token);
  const row = await get(
    `SELECT rt.id AS token_id, u.id, u.username, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ? AND datetime(rt.expires_at) > datetime('now')`,
    [tokenHash]
  );
  return row || null;
}

async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  await run('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

async function revokeRefreshTokenById(tokenId) {
  await run('DELETE FROM refresh_tokens WHERE id = ?', [tokenId]);
}

async function revokeAllForUser(userId) {
  await run('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}

async function rotateRefreshToken(oldToken) {
  const row = await findUserByRefreshToken(oldToken);
  if (!row) return null;
  await revokeRefreshTokenById(row.token_id);
  const newRefresh = await createRefreshToken(row.id);
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    refreshToken: newRefresh,
  };
}

module.exports = {
  createRefreshToken,
  findUserByRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  rotateRefreshToken,
};
