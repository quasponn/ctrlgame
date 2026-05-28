export function formatPatchDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function GamePatchesSection({ patches, loading, className = '' }) {
  return (
    <section className={`steam-section game-patches-section ${className}`.trim()}>
      <h2>Обновления</h2>
      {loading ? (
        <p className="game-patches-empty">Загрузка...</p>
      ) : !patches?.length ? (
        <p className="game-patches-empty">Пока нет записей об обновлениях.</p>
      ) : (
        <ul className="game-patches-list">
          {patches.map((patch) => (
            <li key={patch.id} className="game-patch-card steam-panel">
              <div className="game-patch-head">
                {patch.version && <span className="game-patch-version">v{patch.version}</span>}
                <time className="game-patch-date" dateTime={patch.patch_date}>
                  {formatPatchDate(patch.patch_date)}
                </time>
              </div>
              <h3 className="game-patch-title">{patch.title}</h3>
              {patch.description && <p className="game-patch-desc">{patch.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
