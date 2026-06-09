const API = '/api';

const AUTH_PATHS = ['/login', '/register', '/refresh', '/logout'];

export function saveTokens({ token, refreshToken }) {
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
}

export function getAccessToken() {
  return localStorage.getItem('token');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function authHeaders(token) {
  const t = token ?? getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const res = await fetch(`${API}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Session expired');
    err.status = res.status;
    throw err;
  }
  saveTokens(data);
  return data.token;
}

async function request(path, options = {}, retried = false) {
  const headers = { ...options.headers };
  const explicitToken = options.token;
  if (explicitToken) {
    headers.Authorization = `Bearer ${explicitToken}`;
  } else {
    Object.assign(headers, authHeaders());
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));
  if (
    !res.ok &&
    (res.status === 401 || res.status === 403) &&
    !retried &&
    !isAuthPath &&
    getRefreshToken()
  ) {
    try {
      await refreshAccessToken();
      return request(path, options, true);
    } catch {
      clearTokens();
    }
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function normalizeCatalog(data) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, pages: 1, limit: data.length };
  }
  if (data?.items) return data;
  return { items: [], total: 0, page: 1, pages: 1, limit: 12 };
}

async function fetchCatalog(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.genreId) qs.set('genreId', params.genreId);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();

  try {
    const data = await request(`/games/catalog${query ? `?${query}` : ''}`);
    return normalizeCatalog(data);
  } catch (err) {
    if (err.status !== 404) throw err;
    const games = await request('/games');
    const enriched = await Promise.all(
      games.map(async (g) => {
        let genres = [];
        try {
          genres = await request(`/games/${g.id}/genres`);
        } catch {
          genres = [];
        }
        return { ...g, genres, avg_rating: null, review_count: 0 };
      })
    );
    return clientSideCatalogFallback(enriched, params);
  }
}

function clientSideCatalogFallback(games, params) {
  let list = [...games];
  const q = String(params.q || '')
    .trim()
    .toLowerCase();
  if (params.genreId) {
    list = list.filter((g) => g.genres?.some((x) => String(x.id) === String(params.genreId)));
  }
  if (q) list = list.filter((g) => (g.title || '').toLowerCase().includes(q));
  if (params.sort === 'asc') list.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
  if (params.sort === 'desc') list.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
  const limit = Math.min(Math.max(Number(params.limit) || 12, 1), 48);
  const page = Math.max(Number(params.page) || 1, 1);
  const total = list.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * limit;
  return {
    items: list.slice(start, start + limit),
    total,
    page: currentPage,
    pages,
    limit,
  };
}

export const api = {
  getGames: () => request('/games'),
  getCatalog: fetchCatalog,
  getPromotions: (limit = 12) =>
    request(`/games/promotions${limit ? `?limit=${limit}` : ''}`),
  getGame: (id) => request(`/games/${id}`),
  getGameGenres: (id) => request(`/games/${id}/genres`),
  getGameReviews: (id) => request(`/games/${id}/reviews`),
  getGamePatches: (id) => request(`/games/${id}/patches`),
  addReview: (id, body, token) =>
    request(`/games/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body),
    }),
  getGenres: () => request('/genres'),
  createGame: (body, token) =>
    request('/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body),
    }),
  updateGame: (id, body, token) =>
    request(`/games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body),
    }),
  deleteGame: (id, token) =>
    request(`/games/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  setGameGenres: (id, genreIds, token) =>
    request(`/games/${id}/genres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ genreIds }),
    }),
  createGenre: (name, token) =>
    request('/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ name }),
    }),
  login: (username, password) =>
    request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  register: (username, password) =>
    request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  getProfile: (token) => request('/profile', { headers: authHeaders(token) }),
  updateProfile: (body, token) =>
    request('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body),
    }),
  topup: (amount, token) =>
    request('/profile/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ amount }),
    }),
  changePassword: (currentPassword, newPassword, token) =>
    request('/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getCart: (token) => request('/cart', { headers: authHeaders(token) }),
  addToCart: (gameId, token) =>
    request('/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ gameId }),
    }),
  removeFromCart: (cartId, token) =>
    request(`/cart/${cartId}`, { method: 'DELETE', headers: authHeaders(token) }),
  clearCart: (token) => request('/cart', { method: 'DELETE', headers: authHeaders(token) }),
  checkout: (token) => request('/checkout', { method: 'POST', headers: authHeaders(token) }),
  getLibrary: (token) => request('/library', { headers: authHeaders(token) }),
  getWishlist: (token) => request('/wishlist', { headers: authHeaders(token) }),
  addToWishlist: (gameId, token) =>
    request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ gameId }),
    }),
  removeFromWishlist: (gameId, token) =>
    request(`/wishlist/${gameId}`, { method: 'DELETE', headers: authHeaders(token) }),
  logout: () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.resolve({ success: true });
    return request('/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => ({ success: true }));
  },
  refreshAccessToken,
  saveTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
};

export const DEFAULT_COVER = 'https://cdn.cloudflare.steamstatic.com/steam/apps/1222140/header.jpg';

export function formatGamePrice(price) {
  if (price == null) return '—';
  if (Number(price) === 0) return 'Бесплатно';
  return `${price} ₽`;
}

export function getEffectivePrice(game) {
  if (!game) return 0;
  if (game.sale_price != null) return Number(game.sale_price);
  const price = Number(game.price) || 0;
  const discount = Number(game.discount_percent) || 0;
  if (discount > 0 && price > 0) return Math.round(price * (1 - discount / 100));
  return price;
}

export function isGameOnSale(game) {
  return Number(game?.discount_percent) > 0 && Number(game?.price) > 0;
}

export function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - 30_000;
}
