import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, DEFAULT_COVER, formatGamePrice } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GamePatchesSection from '../components/GamePatchesSection';

export default function LibraryPage() {
  const { token, isAuth } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [genresText, setGenresText] = useState('');
  const [patches, setPatches] = useState([]);
  const [patchesLoading, setPatchesLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('page-library');
    return () => document.body.classList.remove('page-library');
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    api
      .getLibrary(token)
      .then((list) => {
        setGames(list);
        if (list.length) setSelected(list[0]);
      })
      .finally(() => setLoading(false));
  }, [isAuth, token]);

  useEffect(() => {
    if (!selected) return;
    api.getGameGenres(selected.id).then((g) => {
      setGenresText(g.length ? g.map((x) => x.name).join(', ') : '');
    });
    setPatchesLoading(true);
    api
      .getGamePatches(selected.id)
      .then(setPatches)
      .catch(() => setPatches([]))
      .finally(() => setPatchesLoading(false));
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => (g.title || '').toLowerCase().includes(q));
  }, [games, search]);

  if (!isAuth) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="steam-library-empty">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="steam-library-empty">
        <div className="steam-empty-card">
          <h2>Библиотека пуста</h2>
          <p>Купленные игры появятся здесь после покупки в магазине.</p>
          <Link to="/" className="steam-empty-btn">
            Перейти в магазин
          </Link>
        </div>
      </div>
    );
  }

  const cover = selected?.cover_url || DEFAULT_COVER;
  const purchased = selected?.purchased_at
    ? new Date(selected.purchased_at).toLocaleDateString('ru-RU')
    : '—';
  const n = games.length;
  const word = n === 1 ? 'игра' : n < 5 ? 'игры' : 'игр';

  return (
    <div className="steam-library">
      <aside className="steam-library-sidebar">
        <div className="steam-sidebar-top">
          <h2 className="steam-sidebar-title">Библиотека</h2>
          <span className="steam-sidebar-count">
            {n} {word}
          </span>
          <input
            type="search"
            className="steam-sidebar-search"
            placeholder="Искать в библиотеке..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="steam-library-list">
          {!filtered.length ? (
            <p className="steam-list-empty">Ничего не найдено</p>
          ) : (
            filtered.map((game) => (
              <button
                key={game.id}
                type="button"
                className={`steam-game-item${selected?.id === game.id ? ' active' : ''}`}
                onClick={() => setSelected(game)}
              >
                <img
                  src={game.cover_url || DEFAULT_COVER}
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_COVER;
                  }}
                />
                <span className="steam-game-item-title">{game.title}</span>
              </button>
            ))
          )}
        </div>
      </aside>
      <section className="steam-library-main">
        {selected && (
          <>
            <div className="steam-hero" style={{ backgroundImage: `url('${cover}')` }}>
              <div className="steam-hero-overlay" />
              <div className="steam-hero-content">
                <h1 className="steam-hero-title">{selected.title}</h1>
                <button
                  type="button"
                  className="steam-play-btn"
                  onClick={() => toast.info(`Запуск «${selected.title}» (демо)`)}
                >
                  ИГРАТЬ
                </button>
              </div>
            </div>
            <div className="steam-detail-body">
              <div className="steam-detail-actions">
                <button
                  type="button"
                  className="steam-play-btn steam-play-btn-secondary"
                  onClick={() => toast.info(`Запуск «${selected.title}» (демо)`)}
                >
                  ИГРАТЬ
                </button>
                <Link to={`/game/${selected.id}`} className="steam-link-btn">
                  Обзор и отзывы
                </Link>
              </div>
              <div className="steam-detail-meta">
                <span>
                  <b>Год:</b> {selected.release_year || '—'}
                </span>
                <span>
                  <b>В библиотеке с:</b> {purchased}
                </span>
                <span>
                  <b>Цена покупки:</b>{' '}
                  {formatGamePrice(selected.price)}
                </span>
              </div>
              <p className="steam-detail-desc">
                {selected.description || 'Описание отсутствует.'}
              </p>
              {genresText && (
                <div className="steam-detail-genres">
                  <b>Жанры:</b> {genresText}
                </div>
              )}
              <GamePatchesSection
                patches={patches}
                loading={patchesLoading}
                className="game-patches-section--library"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
