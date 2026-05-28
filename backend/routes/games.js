const express = require('express');
const { db } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getCatalog, getPromotions } = require('../services/catalogService');
const { enrichGamePricing } = require('../utils/pricing');

const router = express.Router();

router.get('/games/catalog', async (req, res) => {
  try {
    const result = await getCatalog({
      q: req.query.q,
      genreId: req.query.genreId,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/games/promotions', async (req, res) => {
  try {
    const items = await getPromotions(req.query.limit);
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/games', (req, res) => {
  db.all('SELECT * FROM games', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

router.get('/games/:id', (req, res) => {
  db.get('SELECT * FROM games WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Game not found' });
    db.all(
      'SELECT url FROM game_screenshots WHERE game_id = ? ORDER BY sort_order ASC',
      [req.params.id],
      (err2, shots) => {
        if (err2) return res.status(500).json({ error: 'Database error' });
        row.screenshots = shots.map((s) => s.url);
        if (!row.screenshots.length && row.cover_url) {
          row.screenshots = [row.cover_url];
        }
        res.json(enrichGamePricing(row));
      }
    );
  });
});

router.post('/games', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, release_year } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  db.run(
    'INSERT INTO games (title, description, release_year) VALUES (?, ?, ?)',
    [title, description, release_year],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id: this.lastID, title, description, release_year });
    }
  );
});

router.put('/games/:id', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, release_year } = req.body;
  db.run(
    'UPDATE games SET title = ?, description = ?, release_year = ? WHERE id = ?',
    [title, description, release_year, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
      res.json({ id: req.params.id, title, description, release_year });
    }
  );
});

router.delete('/games/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM games WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ success: true });
  });
});

router.get('/genres', (req, res) => {
  db.all('SELECT * FROM genres', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

router.post('/genres', authenticateToken, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO genres (name) VALUES (?)', [name], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ id: this.lastID, name });
  });
});

router.put('/genres/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name } = req.body;
  db.run('UPDATE genres SET name = ? WHERE id = ?', [name, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Genre not found' });
    res.json({ id: req.params.id, name });
  });
});

router.delete('/genres/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM genres WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Genre not found' });
    res.json({ success: true });
  });
});

router.post('/games/:id/genres', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  const { genreIds } = req.body;
  if (!Array.isArray(genreIds)) return res.status(400).json({ error: 'genreIds must be an array' });
  const placeholders = genreIds.map(() => '(?, ?)').join(',');
  const values = genreIds.flatMap((genreId) => [gameId, genreId]);
  db.run('DELETE FROM game_genres WHERE game_id = ?', [gameId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (genreIds.length === 0) return res.json({ success: true });
    db.run(`INSERT INTO game_genres (game_id, genre_id) VALUES ${placeholders}`, values, function (err2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
  });
});

router.get('/games/:id/genres', (req, res) => {
  db.all(
    `SELECT genres.id, genres.name FROM genres
     JOIN game_genres ON genres.id = game_genres.genre_id
     WHERE game_genres.game_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.get('/games/:id/patches', (req, res) => {
  db.all(
    `SELECT id, game_id, title, description, version, patch_date
     FROM game_patches
     WHERE game_id = ?
     ORDER BY patch_date DESC, sort_order ASC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/games/:id/patches', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, version, patch_date } = req.body;
  const gameId = req.params.id;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const date = patch_date || new Date().toISOString().slice(0, 10);
  db.get(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM game_patches WHERE game_id = ?',
    [gameId],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      const sortOrder = row?.next_order ?? 1;
      db.run(
        `INSERT INTO game_patches (game_id, title, description, version, patch_date, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [gameId, title, description || null, version || null, date, sortOrder],
        function (err2) {
          if (err2) return res.status(500).json({ error: 'Database error' });
          res.json({
            id: this.lastID,
            game_id: Number(gameId),
            title,
            description,
            version,
            patch_date: date,
          });
        }
      );
    }
  );
});

router.put('/patches/:patchId', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, version, patch_date } = req.body;
  db.run(
    'UPDATE game_patches SET title = ?, description = ?, version = ?, patch_date = ? WHERE id = ?',
    [title, description, version, patch_date, req.params.patchId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Patch not found' });
      res.json({ id: req.params.patchId, title, description, version, patch_date });
    }
  );
});

router.delete('/patches/:patchId', authenticateToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM game_patches WHERE id = ?', [req.params.patchId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Patch not found' });
    res.json({ success: true });
  });
});

router.get('/games/:id/reviews', (req, res) => {
  db.all(
    `SELECT reviews.*, users.username FROM reviews
     JOIN users ON reviews.user_id = users.id
     WHERE reviews.game_id = ?
     ORDER BY reviews.created_at DESC`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/games/:id/reviews', authenticateToken, (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;
  const gameId = req.params.id;
  if (!rating || rating < 1 || rating > 10) return res.status(400).json({ error: 'Rating must be 1-10' });
  db.run(
    'INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (?, ?, ?, ?)',
    [userId, gameId, rating, comment],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id: this.lastID, user_id: userId, game_id: gameId, rating, comment });
    }
  );
});

router.put('/reviews/:id', authenticateToken, (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;
  db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id], (err, review) => {
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    db.run('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [rating, comment, req.params.id], function (err2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      res.json({ id: req.params.id, rating, comment });
    });
  });
});

router.delete('/reviews/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM reviews WHERE id = ?', [req.params.id], (err, review) => {
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    db.run('DELETE FROM reviews WHERE id = ?', [req.params.id], function (err2) {
      if (err2) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    });
  });
});

module.exports = router;
