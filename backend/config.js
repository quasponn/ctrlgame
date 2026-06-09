require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('JWT_SECRET is required in production');
  process.exit(1);
}

function parseCorsOrigins(value) {
  const list = String(value || 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length <= 1 ? list[0] || 'http://localhost:3001' : list;
}

module.exports = {
  PORT: Number(process.env.PORT) || 3001,
  JWT_SECRET: JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_DAYS: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
  CORS_ORIGIN: parseCorsOrigins(process.env.CORS_ORIGIN),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MIN_PASSWORD_LENGTH: Number(process.env.MIN_PASSWORD_LENGTH) || 6,
};
