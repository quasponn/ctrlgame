import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DEFAULT_COVER } from '../api/client';
import GamePriceDisplay from './GamePriceDisplay';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function GameCard({ game, genres, onChanged, onEdit }) {
  const {
    token,
    isAuth,
    isAdmin,
    isOwned,
    isInCart,
    isInWishlist,
    refreshGameState,
    markInCart,
  } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  const gameId = Number(game.id);
  const owned = isOwned(gameId);
  const inCart = isInCart(gameId);
  const inWishlist = isInWishlist(gameId);
  const cover = game.cover_url || DEFAULT_COVER;

  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await api.addToCart(gameId, token);
      markInCart(gameId);
      await refreshGameState(token);
      toast.success('Добавлено в корзину');
    } catch (err) {
      if (err.data?.error === 'Game already owned' || err.data?.error === 'Already in cart') {
        markInCart(gameId);
        await refreshGameState(token);
      } else {
        toast.error(err.message);
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistBusy(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(gameId, token);
        toast.success('Убрано из желаемого');
      } else {
        await api.addToWishlist(gameId, token);
        toast.success('Добавлено в желаемое');
      }
      await refreshGameState(token);
    } catch (err) {
      if (err.data?.error === 'Game already owned' || err.data?.error === 'Already in wishlist') {
        await refreshGameState(token);
      } else {
        toast.error(err.message);
      }
    } finally {
      setWishlistBusy(false);
    }
  };

  const remove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Удалить эту игру?')) return;
    await api.deleteGame(game.id, token);
    onChanged?.();
  };

  const renderPurchaseButton = () => {
    if (!isAuth) return null;
    if (owned) {
      return (
        <button type="button" className="add-to-cart-btn owned" disabled>
          Приобретено
        </button>
      );
    }
    if (inCart) {
      return (
        <button type="button" className="add-to-cart-btn in-cart" disabled>
          В корзине
        </button>
      );
    }
    return (
      <button
        type="button"
        className="add-to-cart-btn"
        disabled={adding}
        onClick={addToCart}
      >
        {adding ? '...' : 'В корзину'}
      </button>
    );
  };

  return (
    <div className="game-card-wrap">
      <article className="game-card steam-tile">
        <Link
          to={`/game/${game.id}`}
          className="game-card-hitarea"
          aria-label={`Открыть: ${game.title}`}
        />
        <div className="steam-tile-cover">
          <img
            src={cover}
            alt=""
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_COVER;
            }}
          />
          <div className="steam-tile-hover">
            <span>Подробнее</span>
          </div>
        </div>
        <div className="steam-tile-body">
          <h3 title={game.title}>{game.title}</h3>
          {game.avg_rating != null && game.review_count > 0 && (
            <p className="game-rating-line">
              ★ {game.avg_rating}/10 <span>({game.review_count})</span>
            </p>
          )}
          <p className="game-meta-line">Год: {game.release_year || '—'}</p>
          <div
            className="game-genres"
            title={genres?.length ? genres.map((g) => g.name).join(', ') : undefined}
          >
            {genres?.length ? genres.map((g) => g.name).join(', ') : '\u00A0'}
          </div>
          <GamePriceDisplay game={game} className="steam-price-tag" compact />
          <div className="steam-tile-actions">
            {isAdmin && (
              <>
                <button type="button" className="btn-steam-ghost" onClick={remove}>
                  Удалить
                </button>
                <button type="button" className="btn-steam-ghost" onClick={() => onEdit?.(game)}>
                  Изменить
                </button>
              </>
            )}
            {isAuth && !owned && (
              <button
                type="button"
                className={`wishlist-btn ${inWishlist ? 'in-wishlist' : ''}`}
                disabled={wishlistBusy}
                onClick={toggleWishlist}
              >
                {wishlistBusy ? '...' : inWishlist ? '★ В желаемом' : '☆ В желаемое'}
              </button>
            )}
            {renderPurchaseButton()}
          </div>
        </div>
      </article>
    </div>
  );
}
