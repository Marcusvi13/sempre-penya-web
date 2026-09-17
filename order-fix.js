// Replica l'ordre visible de RetentionPolicy d'Android v53.
// Primer: published_at; si falta, detected_at. Desempat: detected_at.
function androidFeedTime(item) {
  const published = Date.parse(item.published_at || '');
  if (Number.isFinite(published)) return published;
  const detected = Date.parse(item.detected_at || '');
  return Number.isFinite(detected) ? detected : Number.NEGATIVE_INFINITY;
}

function androidDetectedTime(item) {
  const detected = Date.parse(item.detected_at || '');
  return Number.isFinite(detected) ? detected : Number.NEGATIVE_INFINITY;
}

function applyAndroidFeedOrder() {
  state.items.sort((a, b) => {
    const primary = androidFeedTime(b) - androidFeedTime(a);
    if (primary !== 0) return primary;
    return androidDetectedTime(b) - androidDetectedTime(a);
  });
}

const renderFeedWithoutAndroidOrder = renderFeed;
renderFeed = function renderFeedWithAndroidOrder() {
  applyAndroidFeedOrder();
  return renderFeedWithoutAndroidOrder();
};

// app.js fa una primera càrrega abans que aquest fitxer s'executi.
// Reordena també el contingut que ja hagi arribat.
applyAndroidFeedOrder();
renderFeed();
