const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/user/game-status', authenticateToken, (req, res) => {
  const uid = req.user.id;
  db.all('SELECT game_id FROM library WHERE user_id = ?', [uid], (errLib, library) => {
    if (errLib) return res.status(500).json({ error: 'Database error' });
    db.all('SELECT game_id FROM cart WHERE user_id = ?', [uid], (errCart, cart) => {
      if (errCart) return res.status(500).json({ error: 'Database error' });
      db.all('SELECT game_id FROM wishlist WHERE user_id = ?', [uid], (errWish, wishlist) => {
        res.json({
          owned: (library || []).map((r) => r.game_id),
          cart: (cart || []).map((r) => r.game_id),
          wishlist: errWish ? [] : (wishlist || []).map((r) => r.game_id),
        });
      });
    });
  });
});

module.exports = router;
