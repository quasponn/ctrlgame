const { db, init, applyDefaultPromotions } = require('./db');
const { seedDatabase } = require('./seed');

function waitForInit() {
  init();
  return new Promise((resolve) => setTimeout(resolve, 500));
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function ensureSeeded() {
  await waitForInit();
  const row = await get(
    `SELECT
       (SELECT COUNT(*) FROM games) AS games,
       (SELECT COUNT(*) FROM users) AS users`
  );
  if (row.games > 0 && row.users > 0) {
    console.log(`Database ready (${row.games} games, ${row.users} users).`);
    return;
  }

  const fast = process.env.SEED_FAST !== '0';
  console.log(
    row.games === 0 && row.users === 0
      ? 'Empty database — loading demo data...'
      : 'Incomplete database — restoring demo data...'
  );
  await seedDatabase({ fast });
  applyDefaultPromotions(true);
  const after = await get('SELECT COUNT(*) AS games FROM games');
  console.log(`Demo data loaded (${after.games} games). Logins: admin/admin123, user/user123`);
}

module.exports = { ensureSeeded };
