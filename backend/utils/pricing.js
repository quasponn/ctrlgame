function enrichGamePricing(game) {
  const discount = Math.max(0, Math.min(100, Number(game.discount_percent) || 0));
  const price = Number(game.price) || 0;
  const onSale = discount > 0 && price > 0;
  const sale_price = onSale ? Math.round(price * (1 - discount / 100)) : price;

  return {
    ...game,
    discount_percent: discount,
    sale_price,
    original_price: onSale ? price : null,
  };
}

function salePriceSql(alias = 'games') {
  return `CASE
    WHEN ${alias}.discount_percent > 0 AND ${alias}.price > 0
    THEN ROUND(${alias}.price * (1.0 - ${alias}.discount_percent / 100.0))
    ELSE ${alias}.price
  END`;
}

module.exports = { enrichGamePricing, salePriceSql };
