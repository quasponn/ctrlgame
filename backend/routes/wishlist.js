const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/wishlist', authenticateToken, (req, res) => {
  db.all(
    `SELECT games.*, wishlist.added_at FROM wishlist
     JOIN games ON wishlist.game_id = games.id
     WHERE wishlist.user_id = ?
     ORDER BY wishlist.added_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/wishlist', authenticateToken, (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId is required' });
  db.get('SELECT id FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    db.get('SELECT id FROM library WHERE user_id = ? AND game_id = ?', [req.user.id, gameId], (err2, owned) => {
      if (err2) return res.status(500).json({ error: 'Database error' });
      if (owned) return res.status(400).json({ error: 'Game already owned' });
      db.get('SELECT id FROM wishlist WHERE user_id = ? AND game_id = ?', [req.user.id, gameId], (err3, row) => {
        if (err3) return res.status(500).json({ error: 'Database error' });
        if (row) return res.status(400).json({ error: 'Already in wishlist' });
        db.run('INSERT INTO wishlist (user_id, game_id) VALUES (?, ?)', [req.user.id, gameId], function (err4) {
          if (err4) return res.status(500).json({ error: 'Database error' });
          res.json({ success: true });
        });
      });
    });
  });
});

router.delete('/wishlist/:gameId', authenticateToken, (req, res) => {
  db.run('DELETE FROM wishlist WHERE user_id = ? AND game_id = ?', [req.user.id, req.params.gameId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, removed: this.changes > 0 });
  });
});

module.exports = router;
