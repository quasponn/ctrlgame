import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, decodeToken, getAccessToken, getRefreshToken, isTokenExpired } from '../api/client';

const AuthContext = createContext(null);

function normalizeGameId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? id : n;
}

function normalizeIdList(ids) {
  return (ids || []).map(normalizeGameId);
}

async function loadUserGameState(activeToken) {
  const [libRes, cartRes, wishRes] = await Promise.allSettled([
    api.getLibrary(activeToken),
    api.getCart(activeToken),
    api.getWishlist(activeToken),
  ]);

  return {
    owned:
      libRes.status === 'fulfilled' ? normalizeIdList(libRes.value.map((g) => g.id)) : [],
    cart:
      cartRes.status === 'fulfilled'
        ? normalizeIdList(cartRes.value.map((c) => c.game_id))
        : [],
    wishlist:
      wishRes.status === 'fulfilled' ? normalizeIdList(wishRes.value.map((g) => g.id)) : [],
  };
}

function persistSession({ token, refreshToken, username }) {
  api.saveTokens({ token, refreshToken });
  if (username) localStorage.setItem('username', username);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken());
  const [username, setUsername] = useState(() => localStorage.getItem('username'));
  const [ownedIds, setOwnedIds] = useState([]);
  const [cartIds, setCartIds] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [gameStateVersion, setGameStateVersion] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);

  const role = useMemo(() => (token ? decodeToken(token)?.role : null), [token]);
  const isAuth = Boolean(token);

  const applyGameState = useCallback((state) => {
    setOwnedIds(state.owned);
    setCartIds(state.cart);
    setWishlistIds(state.wishlist);
    setGameStateVersion((v) => v + 1);
  }, []);

  const refreshGameState = useCallback(
    async (authToken) => {
      const activeToken = authToken ?? getAccessToken();
      if (!activeToken) {
        setOwnedIds([]);
        setCartIds([]);
        setWishlistIds([]);
        return;
      }
      const state = await loadUserGameState(activeToken);
      applyGameState(state);
      return state;
    },
    [applyGameState]
  );

  const clearSession = useCallback(() => {
    api.clearTokens();
    setToken(null);
    setUsername(null);
    setOwnedIds([]);
    setCartIds([]);
    setWishlistIds([]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const storedToken = getAccessToken();
      const storedRefresh = getRefreshToken();

      try {
        if (storedToken && !isTokenExpired(storedToken)) {
          if (!cancelled) setToken(storedToken);
          await refreshGameState(storedToken);
        } else if (storedRefresh) {
          const newToken = await api.refreshAccessToken();
          if (!cancelled) setToken(newToken);
          await refreshGameState(newToken);
        } else if (storedToken) {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshGameState]);

  useEffect(() => {
    if (sessionReady && token) refreshGameState();
  }, [sessionReady, token, refreshGameState]);

  const login = async (user, pass) => {
    const data = await api.login(user, pass);
    persistSession({ token: data.token, refreshToken: data.refreshToken, username: user });
    setToken(data.token);
    setUsername(user);
    await refreshGameState(data.token);
  };

  const register = async (user, pass) => {
    await api.register(user, pass);
    await login(user, pass);
  };

  const logout = async () => {
    await api.logout();
    clearSession();
  };

  const markInCart = useCallback((gameId) => {
    const id = normalizeGameId(gameId);
    setCartIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setGameStateVersion((v) => v + 1);
  }, []);

  const markOwned = useCallback((gameId) => {
    const id = normalizeGameId(gameId);
    setOwnedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCartIds((prev) => prev.filter((x) => x !== id));
    setGameStateVersion((v) => v + 1);
  }, []);

  const isOwned = useCallback(
    (id) => ownedIds.includes(normalizeGameId(id)),
    [ownedIds]
  );
  const isInCart = useCallback(
    (id) => cartIds.includes(normalizeGameId(id)),
    [cartIds]
  );
  const isInWishlist = useCallback(
    (id) => wishlistIds.includes(normalizeGameId(id)),
    [wishlistIds]
  );

  const value = {
    token,
    username,
    role,
    isAuth,
    sessionReady,
    isAdmin: role === 'admin',
    ownedIds,
    cartIds,
    wishlistIds,
    gameStateVersion,
    refreshGameState,
    markInCart,
    markOwned,
    login,
    register,
    logout,
    isOwned,
    isInCart,
    isInWishlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
