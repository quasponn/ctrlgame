const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { salePriceSql } = require('../utils/pricing');

const priceExpr = salePriceSql('games');

const router = express.Router();

router.get('/cart', authenticateToken, (req, res) => {
  db.all(
    `SELECT cart.id, cart.game_id, cart.quantity, games.title,
            games.price AS original_price, games.discount_percent,
            ${priceExpr} AS price FROM cart
     JOIN games ON cart.game_id = games.id
     WHERE cart.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/cart', authenticateToken, (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId is required' });
  db.get('SELECT id FROM library WHERE user_id = ? AND game_id = ?', [req.user.id, gameId], (err, owned) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (owned) return res.status(400).json({ error: 'Game already owned' });
    db.get('SELECT id FROM cart WHERE user_id = ? AND game_id = ?', [req.user.id, gameId], (err2, row) => {
      if (err2) return res.status(500).json({ error: 'Database error' });
      if (row) return res.status(400).json({ error: 'Already in cart' });
      db.run('INSERT INTO cart (user_id, game_id, quantity) VALUES (?, ?, 1)', [req.user.id, gameId], function (err3) {
        if (err3) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
      });
    });
  });
});

router.delete('/cart/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

router.delete('/cart', authenticateToken, (req, res) => {
  db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

router.post('/checkout', authenticateToken, (req, res) => {
  db.all(
    `SELECT cart.game_id, ${priceExpr} AS price FROM cart
     JOIN games ON cart.game_id = games.id
     WHERE cart.user_id = ?`,
    [req.user.id],
    (err, items) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
      const total = items.reduce((sum, item) => sum + item.price, 0);
      db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err2, user) => {
        if (err2 || !user) return res.status(500).json({ error: 'Database error' });
        if (user.balance < total) {
          return res.status(400).json({
            error: 'Insufficient balance',
            message: 'Недостаточно средств на балансе',
            balance: user.balance,
            required: total,
          });
        }
        db.serialize(() => {
          const stmt = db.prepare('INSERT OR IGNORE INTO library (user_id, game_id) VALUES (?, ?)');
          items.forEach((item) => stmt.run(req.user.id, item.game_id));
          stmt.finalize((err3) => {
            if (err3) return res.status(500).json({ error: 'Database error' });
            const gameIds = items.map((item) => item.game_id);
            const wishlistPlaceholders = gameIds.map(() => '?').join(',');
            db.run(
              `DELETE FROM wishlist WHERE user_id = ? AND game_id IN (${wishlistPlaceholders})`,
              [req.user.id, ...gameIds],
              () => {}
            );
            db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [total, req.user.id], function (err4) {
              if (err4) return res.status(500).json({ error: 'Database error' });
              db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id], function (err5) {
                if (err5) return res.status(500).json({ error: 'Database error' });
                res.json({
                  success: true,
                  purchased: items.length,
                  spent: total,
                  balance: user.balance - total,
                });
              });
            });
          });
        });
      });
    }
  );
});

module.exports = router;
