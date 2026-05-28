export default function GameCardSkeleton() {
  return (
    <div className="game-card-wrap">
      <article className="game-card steam-tile game-card-skeleton" aria-hidden>
        <div className="skeleton-block skeleton-cover" />
        <div className="steam-tile-body">
          <div className="skeleton-block skeleton-line skeleton-line-title" />
          <div className="skeleton-block skeleton-line skeleton-line-short" />
          <div className="skeleton-block skeleton-line skeleton-line-short" />
          <div className="skeleton-block skeleton-btn" />
          <div className="skeleton-block skeleton-btn" />
        </div>
      </article>
    </div>
  );
}
