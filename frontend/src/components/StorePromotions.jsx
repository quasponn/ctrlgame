import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DEFAULT_COVER } from '../api/client';
import GamePriceDisplay from './GamePriceDisplay';
import { GAMES_UPDATED_EVENT } from './Layout';

const SCROLL_EDGE = 8;

export default function StorePromotions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const promos = await api.getPromotions(10);
      setItems(Array.isArray(promos) ? promos : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > SCROLL_EDGE);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - SCROLL_EDGE);
  }, []);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.store-promo-card');
    const gap = 16;
    const step = card ? card.offsetWidth + gap : 236;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener(GAMES_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(GAMES_UPDATED_EVENT, onUpdate);
  }, [load]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || loading) return undefined;

    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', updateArrows);
      ro.disconnect();
    };
  }, [items, loading, updateArrows]);

  if (!loading && items.length === 0) return null;

  const showArrows = !loading && items.length > 0;

  return (
    <section className="steam-section store-promotions" aria-labelledby="store-promotions-title">
      <div className="steam-section-head">
        <h2 id="store-promotions-title">Акции и скидки</h2>
        <p className="store-promotions-sub">Специальные предложения ControlGame</p>
      </div>
      <div className="store-promotions-track-wrap">
        {showArrows && (
          <>
            <button
              type="button"
              className="store-promotions-nav store-promotions-nav-prev"
              onClick={() => scroll(-1)}
              disabled={!canPrev}
              aria-label="Предыдущие акции"
            >
              ‹
            </button>
            <button
              type="button"
              className="store-promotions-nav store-promotions-nav-next"
              onClick={() => scroll(1)}
              disabled={!canNext}
              aria-label="Следующие акции"
            >
              ›
            </button>
          </>
        )}
        {loading ? (
          <div className="store-promotions-track store-promotions-track--loading">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="store-promo-card store-promo-card--skeleton" aria-hidden />
            ))}
          </div>
        ) : (
          <div ref={trackRef} className="store-promotions-track">
            {items.map((game) => {
              const cover = game.cover_url || DEFAULT_COVER;
              return (
                <Link key={game.id} to={`/game/${game.id}`} className="store-promo-card">
                  <div className="store-promo-card-cover">
                    <img
                      src={cover}
                      alt=""
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_COVER;
                      }}
                    />
                    <span className="store-promo-card-badge">-{game.discount_percent}%</span>
                  </div>
                  <div className="store-promo-card-body">
                    <h3>{game.title}</h3>
                    <GamePriceDisplay game={game} compact />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
