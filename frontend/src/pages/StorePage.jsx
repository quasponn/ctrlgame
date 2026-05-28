import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import GameCardSkeleton from '../components/GameCardSkeleton';
import StoreFilterPanel from '../components/StoreFilterPanel';
import StoreHeroCarousel from '../components/StoreHeroCarousel';
import StorePromotions from '../components/StorePromotions';
import { GAMES_UPDATED_EVENT } from '../components/Layout';

const PAGE_SIZE = 12;

function EditGameForm({ game, genres, onDone, onCancel }) {
  const { token } = useAuth();
  const [title, setTitle] = useState(game.title);
  const [description, setDescription] = useState(game.description || '');
  const [releaseYear, setReleaseYear] = useState(game.release_year || '');
  const [selectedGenres, setSelectedGenres] = useState(
    () => new Set((game.genres || []).map((g) => g.id))
  );
  const [msg, setMsg] = useState('');

  const toggleGenre = (id) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.updateGame(
        game.id,
        { title, description, release_year: releaseYear || null },
        token
      );
      await api.setGameGenres(game.id, [...selectedGenres], token);
      setMsg('Сохранено!');
      setTimeout(onDone, 500);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <form className="edit-game-modal" onSubmit={save}>
      <label>
        Название:
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Описание:
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>
      <label>
        Год:
        <input type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} />
      </label>
      <label>
        Жанры:
        <div className="genre-checkboxes">
          {genres.map((g) => (
            <label key={g.id}>
              <input
                type="checkbox"
                checked={selectedGenres.has(g.id)}
                onChange={() => toggleGenre(g.id)}
              />
              {g.name}
            </label>
          ))}
        </div>
      </label>
      <button type="submit" className="btn-steam-green">
        Сохранить
      </button>
      <button type="button" className="btn-steam-ghost" onClick={onCancel}>
        Отмена
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}

export default function StorePage() {
  const { isAuth, refreshGameState, gameStateVersion } = useAuth();
  const [heroGames, setHeroGames] = useState([]);
  const [displayGames, setDisplayGames] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [genres, setGenres] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreId, setGenreId] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHero = useCallback(async () => {
    try {
      const data = await api.getCatalog({ limit: 8 });
      setHeroGames(data.items || []);
    } catch {
      setHeroGames([]);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCatalog({
        q: searchQuery,
        genreId,
        sort,
        page,
        limit: PAGE_SIZE,
      });
      setDisplayGames(data.items || []);
      setCatalogMeta({ total: data.total, page: data.page, pages: data.pages });
      if (isAuth) await refreshGameState();
    } catch {
      setDisplayGames([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, genreId, sort, page, isAuth, refreshGameState]);

  useEffect(() => {
    loadHero();
    api.getGenres().then(setGenres);
  }, [loadHero]);

  useEffect(() => {
    const delay = searchQuery.trim() ? 300 : 0;
    const timer = setTimeout(loadCatalog, delay);
    return () => clearTimeout(timer);
  }, [loadCatalog]);

  useEffect(() => {
    if (isAuth) refreshGameState();
  }, [isAuth, refreshGameState]);

  useEffect(() => {
    const onUpdate = () => {
      loadHero();
      loadCatalog();
      api.getGenres().then(setGenres);
    };
    window.addEventListener(GAMES_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, onUpdate);
  }, [loadHero, loadCatalog]);

  return (
    <main className="steam-main">
      <StoreHeroCarousel games={heroGames} />
      <StorePromotions />

      <section className="steam-section">
        <div className="steam-section-head">
          <h2>Популярное и рекомендуемое</h2>
          <div className="store-toolbar">
            <input
              type="search"
              className="store-search-input"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Поиск игр"
            />
            <button
              type="button"
              className={`store-filter-btn ${filterOpen ? 'is-active' : ''}`}
              onClick={() => setFilterOpen((open) => !open)}
              aria-expanded={filterOpen}
              aria-controls="store-filter-panel"
            >
              Фильтр
              <span className={`store-filter-chevron ${filterOpen ? 'is-open' : ''}`} aria-hidden>
                ▾
              </span>
              {(genreId || sort) && <span className="store-filter-badge" />}
            </button>
          </div>
        </div>
        <StoreFilterPanel
          open={filterOpen}
          genres={genres}
          genreId={genreId}
          sort={sort}
          onGenreChange={(id) => {
            setGenreId(id);
            setPage(1);
          }}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          onReset={() => {
            setGenreId('');
            setSort('');
            setPage(1);
          }}
        />
        <div id="gamesList">
          {loading ? (
            Array.from({ length: 8 }, (_, i) => (
              <div key={`sk-${i}`} className="games-list-cell">
                <GameCardSkeleton />
              </div>
            ))
          ) : displayGames.length === 0 ? (
            <p>Нет игр.</p>
          ) : (
            displayGames.map((game) => (
              <div key={game.id} className="games-list-cell">
                <GameCard
                  key={`${game.id}-${gameStateVersion}`}
                  game={game}
                  genres={game.genres}
                  onChanged={loadCatalog}
                  onEdit={(g) => setEditing(g)}
                />
                {editing?.id === game.id && (
                  <EditGameForm
                    game={editing}
                    genres={genres}
                    onDone={() => {
                      setEditing(null);
                      loadCatalog();
                      loadHero();
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
        {!loading && catalogMeta.pages > 1 && (
          <nav className="store-pagination" aria-label="Страницы каталога">
            <button
              type="button"
              className="btn-steam-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Назад
            </button>
            <span>
              Страница {catalogMeta.page} из {catalogMeta.pages} ({catalogMeta.total} игр)
            </span>
            <button
              type="button"
              className="btn-steam-ghost"
              disabled={page >= catalogMeta.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд →
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
