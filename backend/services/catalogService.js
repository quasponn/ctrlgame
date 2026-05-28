const { db } = require('../db');
const { filterAndSortCatalog, paginateCatalog } = require('../utils/catalogHelpers');
const { enrichGamePricing } = require('../utils/pricing');

function loadCatalogFromDb() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM games ORDER BY id ASC', [], (err, games) => {
      if (err) return reject(err);
      db.all(
        `SELECT gg.game_id, g.id, g.name FROM game_genres gg
         JOIN genres g ON g.id = gg.genre_id`,
        [],
        (err2, genreRows) => {
          if (err2) return reject(err2);
          db.all(
            `SELECT game_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
             FROM reviews GROUP BY game_id`,
            [],
            (err3, ratingRows) => {
              if (err3) return reject(err3);
              const genresByGame = {};
              (genreRows || []).forEach((r) => {
                if (!genresByGame[r.game_id]) genresByGame[r.game_id] = [];
                genresByGame[r.game_id].push({ id: r.id, name: r.name });
              });
              const ratingByGame = {};
              (ratingRows || []).forEach((r) => {
                ratingByGame[r.game_id] = {
                  avg_rating: r.avg_rating,
                  review_count: r.review_count,
                };
              });
              resolve(
                (games || []).map((g) =>
                  enrichGamePricing({
                    ...g,
                    genres: genresByGame[g.id] || [],
                    avg_rating: ratingByGame[g.id]?.avg_rating ?? null,
                    review_count: ratingByGame[g.id]?.review_count ?? 0,
                  })
                )
              );
            }
          );
        }
      );
    });
  });
}

async function getCatalog(params) {
  const games = await loadCatalogFromDb();
  const filtered = filterAndSortCatalog(games, params);
  return paginateCatalog(filtered, params.page, params.limit);
}

async function getPromotions(limit = 12) {
  const games = await loadCatalogFromDb();
  return games
    .filter((g) => g.discount_percent > 0)
    .sort((a, b) => b.discount_percent - a.discount_percent || a.title.localeCompare(b.title))
    .slice(0, Math.min(Number(limit) || 12, 24));
}

module.exports = { getCatalog, loadCatalogFromDb, getPromotions };
