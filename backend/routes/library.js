const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/library', authenticateToken, (req, res) => {
  db.all(
    `SELECT games.*, library.purchased_at FROM library
     JOIN games ON library.game_id = games.id
     WHERE library.user_id = ?
     ORDER BY library.purchased_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

module.exports = router;
