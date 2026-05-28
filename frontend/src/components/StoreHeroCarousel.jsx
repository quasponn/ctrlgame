import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_COVER } from '../api/client';
import GamePriceDisplay from './GamePriceDisplay';

const FEATURED_COUNT = 4;
const AUTO_MS = 7000;

export default function StoreHeroCarousel({ games }) {
  const featured = useMemo(() => games.slice(0, FEATURED_COUNT), [games]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = featured.length;

  const featuredKey = featured.map((g) => g.id).join(',');

  useEffect(() => {
    setIndex(0);
  }, [featuredKey]);

  const go = useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const id = setInterval(() => go(1), AUTO_MS);
    return () => clearInterval(id);
  }, [count, paused, go]);

  if (!count) return null;

  return (
    <div
      className="store-hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="store-hero-viewport">
        <div
          className="store-hero-track"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {featured.map((game) => (
            <article
              key={game.id}
              className="store-hero-slide store-hero"
              style={{ backgroundImage: `url('${game.cover_url || DEFAULT_COVER}')` }}
            >
              <div className="store-hero-overlay" />
              <div className="store-hero-body">
                <div className="store-hero-label">Рекомендуем</div>
                <h1 className="store-hero-title">{game.title}</h1>
                <GamePriceDisplay game={game} className="store-hero-price" />
                <Link to={`/game/${game.id}`} className="store-hero-link">
                  Подробнее
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="store-hero-nav store-hero-nav-prev"
            onClick={() => go(-1)}
            aria-label="Предыдущая игра"
          >
            ‹
          </button>
          <button
            type="button"
            className="store-hero-nav store-hero-nav-next"
            onClick={() => go(1)}
            aria-label="Следующая игра"
          >
            ›
          </button>
          <div className="store-hero-dots" role="tablist" aria-label="Рекомендуемые игры">
            {featured.map((game, i) => (
              <button
                key={game.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={game.title}
                className={i === index ? 'is-active' : ''}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
