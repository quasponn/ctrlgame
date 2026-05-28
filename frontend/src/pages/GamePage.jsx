import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import GamePriceDisplay from '../components/GamePriceDisplay';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GameMediaGallery from '../components/GameMediaGallery';
import GamePatchesSection from '../components/GamePatchesSection';

export default function GamePage() {
  const { id } = useParams();
  const { token, isAuth, isOwned, isInCart, isInWishlist, refreshGameState } = useAuth();
  const { toast } = useToast();
  const [game, setGame] = useState(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [genres, setGenres] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [patches, setPatches] = useState([]);
  const [patchesLoading, setPatchesLoading] = useState(true);
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  const loadReviews = () => api.getGameReviews(id).then(setReviews);

  useEffect(() => {
    api.getGame(id).then(setGame);
    api.getGameGenres(id).then(setGenres);
    loadReviews();
    setPatchesLoading(true);
    api
      .getGamePatches(id)
      .then(setPatches)
      .catch(() => setPatches([]))
      .finally(() => setPatchesLoading(false));
  }, [id]);

  const gameId = game ? Number(game.id) : null;
  const owned = gameId != null && isOwned(gameId);
  const inCart = gameId != null && isInCart(gameId);
  const inWishlist = gameId != null && isInWishlist(gameId);

  const addToCart = async () => {
    setCartBusy(true);
    try {
      await api.addToCart(gameId, token);
      await refreshGameState();
      toast.success('Добавлено в корзину');
    } catch (err) {
      toast.error(err.message);
      await refreshGameState();
    } finally {
      setCartBusy(false);
    }
  };

  const toggleWishlist = async () => {
    setWishlistBusy(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(gameId, token);
        toast.success('Убрано из желаемого');
      } else {
        await api.addToWishlist(gameId, token);
        toast.success('Добавлено в желаемое');
      }
      await refreshGameState();
    } catch (err) {
      toast.error(err.message);
      await refreshGameState();
    } finally {
      setWishlistBusy(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.addReview(id, { rating: Number(rating), comment }, token);
      setMsg('Отзыв добавлен!');
      setComment('');
      loadReviews();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (!game) {
    return (
      <main className="steam-main">
        <p>Загрузка...</p>
      </main>
    );
  }

  const screenshots = game.screenshots?.length
    ? game.screenshots
    : game.cover_url
      ? [game.cover_url]
      : [];

  return (
    <main className="steam-main game-detail-page">
      <div className="game-detail-header">
        <h1 className="game-detail-title">{game.title}</h1>
        {genres.length > 0 && (
          <p className="game-detail-genres">{genres.map((g) => g.name).join(' · ')}</p>
        )}
      </div>

      <GameMediaGallery images={screenshots} title={game.title} />

      <div className="steam-panel game-detail-info">
        <p style={{ lineHeight: 1.6, marginTop: 0 }}>{game.description || 'Описание отсутствует.'}</p>
        <div className="steam-detail-meta">
          <span>
            <b>Год выпуска:</b> {game.release_year || '—'}
          </span>
          <span>
            <b>Цена:</b> <GamePriceDisplay game={game} className="steam-price-tag" />
          </span>
        </div>
        {isAuth && (
          <div className="game-detail-actions">
            {!owned && (
              <>
                <button
                  type="button"
                  className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`}
                  disabled={wishlistBusy}
                  onClick={toggleWishlist}
                >
                  {wishlistBusy ? '...' : inWishlist ? '★ В желаемом' : '☆ В желаемое'}
                </button>
                {inCart ? (
                  <button type="button" className="add-to-cart-btn in-cart" disabled>
                    В корзине
                  </button>
                ) : (
                  <button
                    type="button"
                    className="add-to-cart-btn"
                    disabled={cartBusy}
                    onClick={addToCart}
                  >
                    {cartBusy ? '...' : 'В корзину'}
                  </button>
                )}
              </>
            )}
            {owned && (
              <button type="button" className="add-to-cart-btn owned" disabled>
                Приобретено
              </button>
            )}
          </div>
        )}
      </div>

      <GamePatchesSection patches={patches} loading={patchesLoading} />

      <section className="steam-section">
        <h2>Отзывы сообщества</h2>
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--steam-muted)' }}>Пока нет отзывов.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="review-card">
              <b>{r.username}</b> — оценка {r.rating}/10
              <br />
              <span>{r.comment || ''}</span>
              <br />
              <small style={{ color: 'var(--steam-muted)' }}>
                {new Date(r.created_at).toLocaleString()}
              </small>
            </div>
          ))
        )}

        {isAuth && (
          <div className="steam-panel" style={{ marginTop: '1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Написать отзыв</h2>
            <form onSubmit={submitReview}>
              <label>
                Оценка (1–10)
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                />
              </label>
              <label>
                Комментарий
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              </label>
              <button type="submit" className="btn-steam-blue">
                Отправить
              </button>
            </form>
            {msg && <p className="topup-msg">{msg}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
