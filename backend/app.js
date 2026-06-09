const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { init } = require('./db');
const config = require('./config');

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const cartRoutes = require('./routes/cart');
const libraryRoutes = require('./routes/library');
const wishlistRoutes = require('./routes/wishlist');
const profileRoutes = require('./routes/profile');

function createApp() {
  const app = express();
  const { CORS_ORIGIN } = config;

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    '/api/login',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many login attempts' } })
  );
  app.use(
    '/api/register',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many registration attempts' } })
  );
  app.use(
    '/api/refresh',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: { error: 'Too many refresh attempts' } })
  );

  init();

  app.use('/api', authRoutes);
  app.use('/api', gamesRoutes);
  app.use('/api', cartRoutes);
  app.use('/api', libraryRoutes);
  app.use('/api', wishlistRoutes);
  app.use('/api', profileRoutes);

  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  return app;
}

module.exports = { createApp };
