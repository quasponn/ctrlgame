/** Точечное обновление каталога */
const { db, init } = require('./db');

init();

function finish(msg) {
  console.log(msg || 'Каталог обновлён.');
  process.exit(0);
}

db.serialize(() => {
  // Удалить Minecraft
  db.run("DELETE FROM game_genres WHERE game_id IN (SELECT id FROM games WHERE title = 'Minecraft')");
  db.run("DELETE FROM reviews WHERE game_id IN (SELECT id FROM games WHERE title = 'Minecraft')");
  db.run("DELETE FROM library WHERE game_id IN (SELECT id FROM games WHERE title = 'Minecraft')");
  db.run("DELETE FROM cart WHERE game_id IN (SELECT id FROM games WHERE title = 'Minecraft')");
  db.run("DELETE FROM games WHERE title = 'Minecraft'");

  // Удалить Genshin если остался
  db.run("DELETE FROM game_genres WHERE game_id IN (SELECT id FROM games WHERE title LIKE '%Genshin%')");
  db.run("DELETE FROM library WHERE game_id IN (SELECT id FROM games WHERE title LIKE '%Genshin%')");
  db.run("DELETE FROM cart WHERE game_id IN (SELECT id FROM games WHERE title LIKE '%Genshin%')");
  db.run("DELETE FROM games WHERE title LIKE '%Genshin%'");

  db.get("SELECT id FROM games WHERE title = 'Dota 2'", (err, row) => {
    if (row) {
      db.run(
        `UPDATE games SET
          description = 'Легендарная MOBA от Valve.',
          release_year = 2013,
          price = 0,
          cover_url = 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg'
         WHERE id = ?`,
        [row.id],
        () => finish('Minecraft удалён. Dota 2 уже в каталоге.')
      );
      return;
    }
    db.run(
      `INSERT INTO games (title, description, release_year, price, cover_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Dota 2',
        'Легендарная MOBA от Valve.',
        2013,
        0,
        'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg',
      ],
      function () {
        const gameId = this.lastID;
        db.run('INSERT OR IGNORE INTO game_genres (game_id, genre_id) VALUES (?, 3)', [gameId]);
        db.run('INSERT OR IGNORE INTO game_genres (game_id, genre_id) VALUES (?, 1)', [gameId], () =>
          finish('Minecraft удалён. Dota 2 добавлена.')
        );
      }
    );
  });
});
