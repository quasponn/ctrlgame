import { formatGamePrice, getEffectivePrice, isGameOnSale } from '../api/client';

export default function GamePriceDisplay({ game, className = '', compact = false }) {
  const onSale = isGameOnSale(game);
  const current = getEffectivePrice(game);

  return (
    <div className={`game-price-display ${onSale ? 'is-sale' : ''} ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      {onSale && (
        <span className="game-price-badge" aria-label={`Скидка ${game.discount_percent} процентов`}>
          -{game.discount_percent}%
        </span>
      )}
      <span className="game-price-current">{formatGamePrice(current)}</span>
      {onSale && <span className="game-price-original">{formatGamePrice(game.price)}</span>}
    </div>
  );
}
