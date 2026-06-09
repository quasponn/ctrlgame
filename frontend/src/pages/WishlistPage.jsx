import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';

export default function WishlistPage() {
  const { token, isAuth, refreshGameState } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [list, catalog] = await Promise.all([
      api.getWishlist(token),
      api.getCatalog({ limit: 48 }),
    ]);
    const catalogMap = new Map((catalog.items || []).map((g) => [g.id, g]));
    setGames(
      list.map((g) => ({
        ...g,
        ...(catalogMap.get(g.id) || {}),
        genres: catalogMap.get(g.id)?.genres || [],
      }))
    );
    await refreshGameState();
  }, [token, refreshGameState]);

  useEffect(() => {
    if (!isAuth) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const [list, catalog] = await Promise.all([
          api.getWishlist(token),
          api.getCatalog({ limit: 48 }),
        ]);
        if (cancelled) return;
        const catalogMap = new Map((catalog.items || []).map((g) => [g.id, g]));
        setGames(
          list.map((g) => ({
            ...g,
            ...(catalogMap.get(g.id) || {}),
            genres: catalogMap.get(g.id)?.genres || [],
          }))
        );
        await refreshGameState();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuth, token, refreshGameState]);

  if (!isAuth) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <main className="steam-main">
        <p>Загрузка...</p>
      </main>
    );
  }

  return (
    <main className="steam-main">
      <div className="wishlist-page-head">
        <h1 className="steam-page-title">Желаемое</h1>
        <Link to="/profile" className="btn-steam-ghost">
          ← Личный кабинет
        </Link>
      </div>
      {games.length === 0 ? (
        <div className="steam-empty-card">
          <h2>В желаемом пока нет игр</h2>
          <p>Добавляйте игры из магазина кнопкой «В желаемое».</p>
          <Link to="/" className="steam-empty-btn">
            Перейти в магазин
          </Link>
        </div>
      ) : (
        <div id="gamesList" className="wishlist-grid">
          {games.map((game) => (
            <div key={game.id} className="games-list-cell">
              <GameCard game={game} genres={game.genres} onChanged={load} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
