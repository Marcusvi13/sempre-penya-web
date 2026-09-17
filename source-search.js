/* SEMPRE PENYA — cercador de fonts per nom, separat dels filtres de categoria. */
(() => {
  const collator = new Intl.Collator('ca', { sensitivity: 'base' });

  function normalizeSourceName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘`´]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function sourceEntries() {
    const byName = new Map();

    state.items.forEach((item) => {
      const displayName = String(item.source || '').trim();
      if (!displayName) return;
      const key = normalizeSourceName(displayName);
      const current = byName.get(key);
      if (current) {
        current.count += 1;
      } else {
        byName.set(key, { key, name: displayName, count: 1 });
      }
    });

    return [...byName.values()];
  }

  function splitSources(entries) {
    const byPopularity = [...entries].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return collator.compare(a.name, b.name);
    });
    const topKeys = new Set(byPopularity.slice(0, 10).map((entry) => entry.key));

    return {
      top: entries.filter((entry) => topKeys.has(entry.key)).sort((a, b) => collator.compare(a.name, b.name)),
      rest: entries.filter((entry) => !topKeys.has(entry.key)).sort((a, b) => collator.compare(a.name, b.name))
    };
  }

  function closeMenu() {
    const menu = document.getElementById('source-search-menu');
    const toggle = document.getElementById('source-search-toggle');
    if (!menu || !toggle) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function setSelectedSource(key) {
    state.source = null;
    state.sourceName = state.sourceName === key ? null : key;
    renderSourceFilters();
    renderFeed();
    closeMenu();
  }

  function sourceButton(entry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `source-menu-item${state.sourceName === entry.key ? ' selected' : ''}`;
    button.dataset.sourceKey = entry.key;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', state.sourceName === entry.key ? 'true' : 'false');

    const name = document.createElement('span');
    name.className = 'source-menu-name';
    name.textContent = entry.name;

    const count = document.createElement('span');
    count.className = 'source-menu-count';
    count.textContent = entry.count;
    count.setAttribute('aria-label', `${entry.count} notícies`);

    button.append(name, count);
    button.addEventListener('click', () => setSelectedSource(entry.key));
    return button;
  }

  function renderSourceSearchMenu() {
    const legacyHost = document.getElementById('source-filters');
    if (legacyHost) {
      legacyHost.hidden = true;
      legacyHost.replaceChildren();
    }

    const menu = document.getElementById('source-search-menu');
    const toggle = document.getElementById('source-search-toggle');
    if (!menu || !toggle) return;

    const entries = sourceEntries();
    const availableKeys = new Set(entries.map((entry) => entry.key));
    if (state.sourceName && !availableKeys.has(state.sourceName)) state.sourceName = null;

    const { top, rest } = splitSources(entries);
    const nodes = [];

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = `source-menu-reset${state.sourceName ? '' : ' selected'}`;
    reset.textContent = 'Totes les fonts';
    reset.addEventListener('click', () => {
      state.source = null;
      state.sourceName = null;
      renderSourceFilters();
      renderFeed();
      closeMenu();
    });
    nodes.push(reset);

    if (top.length) {
      const topLabel = document.createElement('div');
      topLabel.className = 'source-menu-label';
      topLabel.textContent = '10 fonts amb més notícies';
      nodes.push(topLabel, ...top.map(sourceButton));
    }

    if (rest.length) {
      const separator = document.createElement('div');
      separator.className = 'source-menu-separator';
      separator.setAttribute('aria-hidden', 'true');
      nodes.push(separator, ...rest.map(sourceButton));
    }

    menu.replaceChildren(...nodes);
    toggle.classList.toggle('active', Boolean(state.sourceName));
    toggle.title = state.sourceName
      ? `Filtre actiu: ${entries.find((entry) => entry.key === state.sourceName)?.name || 'font seleccionada'}`
      : 'Cercador per Fonts';
    toggle.disabled = entries.length === 0;
  }

  const previousVisibleItems = visibleItems;
  visibleItems = function visibleItemsWithSourceName() {
    if (!state.sourceName) return previousVisibleItems();

    return state.items.filter((item) => {
      let sectionOk = true;
      if (state.section === 'Favorits') sectionOk = state.favorites.has(item.id);
      else if (state.section === 'Media') sectionOk = normalizedMedia(item);
      else if (state.section !== 'Tots') sectionOk = item.section === state.section;

      return sectionOk && normalizeSourceName(item.source) === state.sourceName;
    });
  };

  renderSourceFilters = renderSourceSearchMenu;

  function start() {
    state.sourceName = null;

    const toggle = document.getElementById('source-search-toggle');
    const menu = document.getElementById('source-search-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const opening = menu.hidden;
      menu.hidden = !opening;
      toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) renderSourceSearchMenu();
    });

    menu.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    document.querySelectorAll('.filter-chip').forEach((button) => {
      button.addEventListener('click', closeMenu);
    });

    renderSourceSearchMenu();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
