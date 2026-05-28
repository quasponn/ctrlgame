function filterAndSortCatalog(games, { q = '', genreId = '', sort = '' }) {
  let list = [...games];
  const query = String(q).trim().toLowerCase();

  if (genreId) {
    list = list.filter((g) => g.genres?.some((x) => String(x.id) === String(genreId)));
  }
  if (query) {
    list = list.filter((g) => (g.title || '').toLowerCase().includes(query));
  }
  if (sort === 'asc') {
    list.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
  }
  if (sort === 'desc') {
    list.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
  }
  return list;
}

function paginateCatalog(list, page = 1, limit = 12) {
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 48);
  const safePage = Math.max(Number(page) || 1, 1);
  const total = list.length;
  const pages = Math.max(Math.ceil(total / safeLimit), 1);
  const currentPage = Math.min(safePage, pages);
  const start = (currentPage - 1) * safeLimit;

  return {
    items: list.slice(start, start + safeLimit),
    total,
    page: currentPage,
    pages,
    limit: safeLimit,
  };
}

module.exports = { filterAndSortCatalog, paginateCatalog };
