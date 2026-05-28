import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_COVER } from '../api/client';

export default function GameMediaGallery({ images, title }) {
  const list = images?.length ? images : [DEFAULT_COVER];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const go = useCallback(
    (delta) => {
      setIndex((i) => (i + delta + list.length) % list.length);
    },
    [list.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onImgError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_COVER;
  };

  return (
    <section className="game-media" aria-label="Скриншоты игры">
      <div className="game-media-main">
        <button
          type="button"
          className="game-media-nav game-media-nav-prev"
          onClick={() => go(-1)}
          aria-label="Предыдущее изображение"
        >
          ‹
        </button>
        <img
          key={index}
          src={list[index]}
          alt={`${title} — изображение ${index + 1}`}
          className="game-media-image"
          onError={onImgError}
        />
        <button
          type="button"
          className="game-media-nav game-media-nav-next"
          onClick={() => go(1)}
          aria-label="Следующее изображение"
        >
          ›
        </button>
        <span className="game-media-counter">
          {index + 1} / {list.length}
        </span>
      </div>
      <div className="game-media-thumbs" role="tablist">
        {list.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`game-media-thumb${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
          >
            <img src={url} alt="" onError={onImgError} />
          </button>
        ))}
      </div>
    </section>
  );
}
