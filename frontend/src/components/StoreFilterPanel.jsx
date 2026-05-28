export default function StoreFilterPanel({
  open,
  genres,
  genreId,
  sort,
  onGenreChange,
  onSortChange,
  onReset,
}) {
  const hasActive = Boolean(genreId || sort);

  return (
    <div
      id="store-filter-panel"
      className={`store-filter-panel ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <div className="store-filter-panel-inner">
        <div className="store-filter-fields">
          <label className="store-filter-field">
            <span className="store-filter-label">Жанр</span>
            <select value={genreId} onChange={(e) => onGenreChange(e.target.value)}>
              <option value="">Любой</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="store-filter-field">
            <span className="store-filter-label">Сортировка по году</span>
            <select value={sort} onChange={(e) => onSortChange(e.target.value)}>
              <option value="">Без сортировки</option>
              <option value="asc">Сначала старые</option>
              <option value="desc">Сначала новые</option>
            </select>
          </label>
          {hasActive && (
            <button type="button" className="store-filter-reset btn-steam-ghost" onClick={onReset}>
              Сбросить фильтр
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
