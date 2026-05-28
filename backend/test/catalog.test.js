const { test } = require('node:test');
const assert = require('node:assert/strict');
const { filterAndSortCatalog, paginateCatalog } = require('../utils/catalogHelpers');

const sample = [
  { id: 1, title: 'Alpha', release_year: 2020, genres: [{ id: 1, name: 'RPG' }] },
  { id: 2, title: 'Beta', release_year: 2015, genres: [{ id: 2, name: 'Action' }] },
  { id: 3, title: 'Gamma', release_year: 2018, genres: [{ id: 1, name: 'RPG' }] },
];

test('filters by search query', () => {
  const r = filterAndSortCatalog(sample, { q: 'alp' });
  assert.equal(r.length, 1);
  assert.equal(r[0].title, 'Alpha');
});

test('paginates results', () => {
  const r = paginateCatalog(sample, 1, 2);
  assert.equal(r.items.length, 2);
  assert.equal(r.total, 3);
  assert.equal(r.pages, 2);
});
