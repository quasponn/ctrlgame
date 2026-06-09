const { db, init, applyDefaultPromotions } = require('./db');
const bcrypt = require('bcrypt');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function picsumGallery(seed) {
  const slug = String(seed).replace(/\W/g, '-').toLowerCase();
  return Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/${slug}-frame-${i}/960/540`);
}

async function fetchSteamScreenshots(appId, cover) {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`
    );
    const json = await res.json();
    const entry = json[String(appId)];
    if (!entry?.success || !entry.data?.screenshots?.length) {
      return picsumGallery(`steam-${appId}`);
    }
    const urls = entry.data.screenshots.map((s) => s.path_full).slice(0, 5);
    if (urls.length < 5 && cover) {
      const extra = picsumGallery(`steam-${appId}-extra`);
      while (urls.length < 5) urls.push(extra[urls.length]);
    }
    return urls;
  } catch {
    return picsumGallery(`steam-${appId}`);
  }
}

const defaultPatches = [
  {
    title: 'Патч стабильности',
    description: 'Исправлены вылеты, ошибки сохранений и редкие зависания при загрузке мира.',
    version: '1.2.4',
    daysAgo: 12,
  },
  {
    title: 'Баланс и качество жизни',
    description: 'Переработаны параметры сложности, улучшен интерфейс и добавлены мелкие исправления.',
    version: '1.2.0',
    daysAgo: 38,
  },
  {
    title: 'Контентное обновление',
    description: 'Новые задания, исправления локализации и оптимизация производительности на слабых ПК.',
    version: '1.1.0',
    daysAgo: 95,
  },
];

function patchDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const games = [
  { title: 'The Witcher 3', desc: 'Фэнтезийная РПГ про ведьмака Геральта.', year: 2015, price: 999, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg', genres: [2], steamId: 292030 },
  { title: 'Portal 2', desc: 'Головоломка с порталами и юмором.', year: 2011, price: 259, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg', genres: [4], steamId: 620 },
  { title: 'Dota 2', desc: 'Легендарная MOBA от Valve.', year: 2013, price: 0, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg', genres: [3, 1], steamId: 570 },
  { title: 'DOOM Eternal', desc: 'Динамичный шутер про охотника на демонов.', year: 2020, price: 1999, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/782330/header.jpg', genres: [1], steamId: 782330 },
  { title: 'Cyberpunk 2077', desc: 'Футуристическая RPG в открытом мире.', year: 2020, price: 1999, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg', genres: [2], steamId: 1091500 },
  { title: 'Hades', desc: 'Рогалик про побег из подземного мира.', year: 2020, price: 699, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg', genres: [2, 1], steamId: 1145360 },
  { title: 'Celeste', desc: 'Платформер о преодолении себя.', year: 2018, price: 349, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/header.jpg', genres: [4], steamId: 504230 },
  { title: 'Hollow Knight', desc: 'Атмосферный метроидвания-платформер.', year: 2017, price: 349, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg', genres: [1, 2], steamId: 367520 },
  { title: 'Red Dead Redemption 2', desc: 'Эпическая история на Диком Западе.', year: 2018, price: 2499, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg', genres: [1, 2], steamId: 1174180 },
  { title: 'Sekiro: Shadows Die Twice', desc: 'Сложный экшен в стиле самураев.', year: 2019, price: 2999, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/814380/header.jpg', genres: [1], steamId: 814380 },
  { title: 'Stardew Valley', desc: 'Фермерский симулятор с элементами RPG.', year: 2016, price: 399, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg', genres: [2], steamId: 413150 },
  { title: 'Terraria', desc: 'Песочница с исследованием и строительством.', year: 2011, price: 259, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/105600/header.jpg', genres: [2, 1], steamId: 105600 },
  {
    title: 'The Legend of Zelda: Breath of the Wild',
    desc: 'Открытый мир и приключения.',
    year: 2017,
    price: 4999,
    cover: 'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
    genres: [1, 2],
    customShots: [
      'https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/BotW_Link_climbing.jpg/1280px-BotW_Link_climbing.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/The_Legend_of_Zelda_Breath_of_the_Wild_%28Unveiling_trailer%29.jpg/1280px-The_Legend_of_Zelda_Breath_of_the_Wild_%28Unveiling_trailer%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Breath_of_the_Wild_screenshot.png/1280px-Breath_of_the_Wild_screenshot.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Zelda_Breath_of_the_Wild_artwork.jpg/1280px-Zelda_Breath_of_the_Wild_artwork.jpg',
    ],
  },
  { title: 'Detroit: Become Human', desc: 'Интерактивная драма о симбиотах и выборе.', year: 2018, price: 1899, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1222140/header.jpg', genres: [1], steamId: 1222140 },
  { title: 'Among Us', desc: 'Мультиплеерная игра на дедукцию.', year: 2018, price: 133, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg', genres: [3], steamId: 945360 },
  {
    title: 'Overwatch',
    desc: 'Командный шутер с героями.',
    year: 2016,
    price: 999,
    cover: 'https://upload.wikimedia.org/wikipedia/en/5/51/Overwatch_cover_art.jpg',
    genres: [1],
    customShots: [
      'https://upload.wikimedia.org/wikipedia/en/5/51/Overwatch_cover_art.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Overwatch_2016_logo.png/1280px-Overwatch_2016_logo.png',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Overwatch_cosplay_%28cropped%29.jpg/1280px-Overwatch_cosplay_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Overwatch_Generation_Games_2015_5.JPG/1280px-Overwatch_Generation_Games_2015_5.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Overwatch_-_Winston%2C_Reinhardt%2C_and_Tracer_cosplay.jpg/1280px-Overwatch_-_Winston%2C_Reinhardt%2C_and_Tracer_cosplay.jpg',
    ],
  },
  { title: 'The Elder Scrolls V: Skyrim', desc: 'Огромный фэнтезийный мир.', year: 2011, price: 1299, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/72850/header.jpg', genres: [2], steamId: 72850 },
  { title: 'Dark Souls III', desc: 'Хардкорный экшен-RPG.', year: 2016, price: 1999, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/374320/header.jpg', genres: [1, 2], steamId: 374320 },
  { title: 'Cuphead', desc: 'Ретро-платформер с уникальным стилем.', year: 2017, price: 399, cover: 'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/header.jpg', genres: [1], steamId: 268910 },
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function defaultShots(game) {
  if (game.customShots?.length) return game.customShots;
  const gallery = picsumGallery(game.gallerySeed || game.title || 'game');
  return [game.cover, ...gallery.filter((u) => u !== game.cover)].slice(0, 5);
}

async function seedDatabase({ fast = false } = {}) {
  if (fast) {
    console.log('Быстрое заполнение БД (без Steam API)...\n');
  } else {
    console.log('Загрузка скриншотов из Steam (это займёт ~10 сек.)...\n');
  }

  await run('DELETE FROM refresh_tokens');
  await run('DELETE FROM reviews');
  await run('DELETE FROM game_patches');
  await run('DELETE FROM game_screenshots');
  await run('DELETE FROM game_genres');
  await run('DELETE FROM library');
  await run('DELETE FROM wishlist');
  await run('DELETE FROM cart');
  await run('DELETE FROM games');
  await run('DELETE FROM genres');
  await run('DELETE FROM users');
  await run("DELETE FROM sqlite_sequence WHERE name IN ('games','genres','users')");

  const adminPass = bcrypt.hashSync('admin123', 10);
  const userPass = bcrypt.hashSync('user123', 10);
  await run(
    `INSERT INTO users (username, password_hash, role, first_name, last_name, phone, avatar_url, balance)
     VALUES ('admin', ?, 'admin', 'Иван', 'Админов', '+79990000001', 'https://i.pravatar.cc/150?img=1', 5000)`,
    [adminPass]
  );
  await run(
    `INSERT INTO users (username, password_hash, role, first_name, last_name, phone, avatar_url, balance)
     VALUES ('user', ?, 'user', 'Петр', 'Пользователь', '+79990000002', 'https://i.pravatar.cc/150?img=2', 1200)`,
    [userPass]
  );

  const genreIds = {};
  for (const name of ['Экшен', 'РПГ', 'Стратегия', 'Головоломка']) {
    const r = await run('INSERT INTO genres (name) VALUES (?)', [name]);
    genreIds[name] = r.lastID;
  }
  const g = (id) => genreIds[['Экшен', 'РПГ', 'Стратегия', 'Головоломка'][id - 1]];

  for (const game of games) {
    const r = await run(
      'INSERT INTO games (title, description, release_year, price, cover_url) VALUES (?, ?, ?, ?, ?)',
      [game.title, game.desc, game.year, game.price, game.cover]
    );
    for (const gi of game.genres) {
      await run('INSERT INTO game_genres (game_id, genre_id) VALUES (?, ?)', [r.lastID, g(gi)]);
    }

    let shots;
    if (game.customShots) {
      shots = game.customShots;
    } else if (!fast && game.steamId) {
      shots = await fetchSteamScreenshots(game.steamId, game.cover);
      await delay(350);
    } else {
      shots = defaultShots(game);
    }

    for (let i = 0; i < shots.length; i++) {
      await run('INSERT INTO game_screenshots (game_id, url, sort_order) VALUES (?, ?, ?)', [
        r.lastID,
        shots[i],
        i,
      ]);
    }

    for (let i = 0; i < defaultPatches.length; i++) {
      const p = defaultPatches[i];
      await run(
        `INSERT INTO game_patches (game_id, title, description, version, patch_date, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [r.lastID, p.title, p.description, p.version, patchDate(p.daysAgo), i]
      );
    }

    console.log(`  ✓ ${game.title} — ${shots.length} скриншотов, ${defaultPatches.length} патчей`);
  }

  await run("INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (1, 1, 10, 'Одна из лучших РПГ!')");
  await run("INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (2, 2, 9, 'Очень интересная головоломка!')");
  await run("INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (1, 3, 9, 'Лучшая MOBA!')");
  await run("INSERT INTO reviews (user_id, game_id, rating, comment) VALUES (2, 4, 9, 'Мясо и драйв!')");

  applyDefaultPromotions(true);
  console.log('\nБаза данных успешно заполнена!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  init();
  setTimeout(() => {
    seedDatabase({ fast: process.env.SEED_FAST === '1' })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }, 300);
}
