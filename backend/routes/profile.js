const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { validatePassword } = require('../utils/validate');
const { revokeAllForUser } = require('../services/refreshTokens');

const router = express.Router();
const { MIN_PASSWORD_LENGTH } = config;

router.get('/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, first_name, last_name, phone, avatar_url, balance, role FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json(row);
    }
  );
});

router.put('/profile', authenticateToken, (req, res) => {
  const first_name = String(req.body.first_name ?? '').trim() || null;
  const last_name = String(req.body.last_name ?? '').trim() || null;
  const phone = String(req.body.phone ?? '').trim() || null;
  const avatar_url = String(req.body.avatar_url ?? '').trim() || null;

  if (avatar_url && !/^https?:\/\//i.test(avatar_url)) {
    return res.status(400).json({ error: 'Ссылка на аватар должна начинаться с http:// или https://' });
  }

  db.run(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, avatar_url = ? WHERE id = ?',
    [first_name, last_name, phone, avatar_url, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.get(
        'SELECT id, username, first_name, last_name, phone, avatar_url, balance, role FROM users WHERE id = ?',
        [req.user.id],
        (err2, row) => {
          if (err2 || !row) return res.status(500).json({ error: 'Database error' });
          res.json(row);
        }
      );
    }
  );
});

router.put('/profile/password', authenticateToken, async (req, res) => {
  const currentPassword = String(req.body.currentPassword ?? '');
  const newPassword = String(req.body.newPassword ?? '');
  const check = validatePassword(newPassword, MIN_PASSWORD_LENGTH);
  if (!check.ok) return res.status(400).json({ error: check.error });
  if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });

  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'Database error' });
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Неверный текущий пароль' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id], async function (err2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      try {
        await revokeAllForUser(req.user.id);
        res.json({ success: true });
      } catch {
        res.status(500).json({ error: 'Database error' });
      }
    });
  });
});

router.post('/profile/topup', authenticateToken, (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err2, row) => {
      if (err2 || !row) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true, added: amount, balance: row.balance });
    });
  });
});

module.exports = router;
