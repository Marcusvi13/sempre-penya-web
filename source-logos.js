/*
 * SEMPRE PENYA — logos de fonts de la baseline Android v0.6.24 · v53.
 * Recursos locals a assets/source-logos/. No substituir per favicons externs.
 */
(() => {
  const BASE = 'assets/source-logos/';

  const LOGOS = [
    {
      file: 'cjb_logo.png',
      names: ['penya', 'penya.com', 'penya 1930', 'club joventut badalona', 'joventut badalona', 'cb joventut', 'joventut']
    },
    {
      file: 'source_acbcom.png',
      names: ['acb', 'acb.com', 'liga endesa', 'acb / liga endesa']
    },
    {
      file: 'source_basketballcl.png',
      names: ['basketball champions league', 'bcl', 'champions league basketball']
    },
    {
      file: 'source_esports_bdncom.png',
      names: ['esports bdn', 'esports bdn comunicacio', 'esports badalona comunicacio']
    },
    {
      file: 'source_bdncom.png',
      names: ['badalona comunicacio', 'bdn comunicacio', 'bdncom']
    },
    {
      file: 'source_gigantesbasket.png',
      names: ['gigantes', 'gigantes del basket', 'gigantes del basket', 'gigantes basket']
    },
    {
      file: 'source_lesportiucat.png',
      names: ["l'esportiu", 'l esportiu', 'lesportiu', "l'esportiu de catalunya", 'lesportiu de catalunya']
    },
    {
      file: 'source_mundodeportivo.png',
      names: ['mundo deportivo', 'mundodeportivo']
    },
    {
      file: 'source_sobrelabocina.png',
      names: ['sobre la bocina', 'sobre la bocina x']
    },
    {
      file: 'source_sport.png',
      names: ['sport', 'diari sport', 'diario sport']
    }
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘`´]/g, "'")
      .replace(/[^a-zA-Z0-9'.]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function logoFor(sourceName) {
    const source = normalize(sourceName);
    if (!source) return null;

    // Ordre important: Esports BDN ha d'anar abans que Badalona Comunicació.
    for (const entry of LOGOS) {
      for (const rawName of entry.names) {
        const name = normalize(rawName);
        if (source === name || source.includes(name)) return `${BASE}${entry.file}`;
      }
    }
    return null;
  }

  function applyBadge(badge) {
    if (!badge || badge.dataset.sourceLogoChecked === '1') return;
    badge.dataset.sourceLogoChecked = '1';

    const sourceName = badge.title || badge.closest('.news-card')?.querySelector('.news-source')?.textContent || '';
    const logo = logoFor(sourceName);
    if (!logo) return;

    const fallback = badge.textContent;
    const image = document.createElement('img');
    image.className = 'source-logo-image';
    image.src = logo;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.decoding = 'async';
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      badge.classList.remove('has-source-logo');
      badge.replaceChildren(document.createTextNode(fallback));
    }, { once: true });

    badge.classList.add('has-source-logo');
    badge.replaceChildren(image);
  }

  function refreshLogos(root = document) {
    root.querySelectorAll?.('.source-badge').forEach(applyBadge);
  }

  function start() {
    const list = document.getElementById('news-list');
    if (!list) return;

    refreshLogos(list);
    const observer = new MutationObserver(() => refreshLogos(list));
    observer.observe(list, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
