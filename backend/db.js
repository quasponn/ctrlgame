const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

const init = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      balance REAL DEFAULT 1000
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      release_year INTEGER,
      price REAL NOT NULL DEFAULT 0,
      cover_url TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS game_genres (
      game_id INTEGER,
      genre_id INTEGER,
      PRIMARY KEY (game_id, genre_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      game_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 10),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE(user_id, game_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE(user_id, game_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE(user_id, game_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS game_screenshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS game_patches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      version TEXT,
      patch_date DATETIME NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )`);

    db.all('PRAGMA table_info(games)', [], (err, cols) => {
      if (err || !cols) return;
      const hasDiscount = cols.some((c) => c.name === 'discount_percent');
      const addColumn = () => {
        if (hasDiscount) {
          applyDefaultPromotions();
          return;
        }
        db.run(
          'ALTER TABLE games ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0',
          () => applyDefaultPromotions()
        );
      };
      addColumn();
    });
  });
};

const DEFAULT_PROMOTIONS = {
  'Cyberpunk 2077': 50,
  'The Witcher 3': 70,
  'Portal 2': 75,
  'Hades': 40,
  'Among Us': 60,
  'Celeste': 30,
  'Dark Souls III': 25,
  'DOOM Eternal': 35,
};

function applyDefaultPromotions(force = false) {
  const apply = () => {
    Object.entries(DEFAULT_PROMOTIONS).forEach(([title, percent]) => {
      db.run('UPDATE games SET discount_percent = ? WHERE title = ?', [percent, title]);
    });
  };
  if (force) {
    apply();
    return;
  }
  db.get('SELECT COUNT(*) AS c FROM games WHERE discount_percent > 0', [], (err, row) => {
    if (err || (row && row.c > 0)) return;
    apply();
  });
}

module.exports = { db, init, applyDefaultPromotions }; 
