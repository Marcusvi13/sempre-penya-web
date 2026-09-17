const SUPABASE_URL = 'https://busuaaaamcojjtavhrne.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OTXxn8gyKvPzbhTPudOj9g_Ab79QJl8';
const META_URL = `${SUPABASE_URL}/storage/v1/object/public/app-downloads/latest.json`;
const APK_URL = `${SUPABASE_URL}/storage/v1/object/public/app-downloads/sempre-penya-latest.apk`;
const RETENTION_DAYS = 90;

const state = {
  items: [],
  section: 'Tots',
  source: null,
  favorites: loadFavorites(),
  loading: false
};

const adminSession = {
  token: sessionStorage.getItem('semprePenyaAdminToken') || '',
  email: sessionStorage.getItem('semprePenyaAdminEmail') || ''
};

const adminEditor = {
  itemId: null
};

const $ = (id) => document.getElementById(id);

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem('semprePenyaFavorites') || '[]'));
  } catch (_) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('semprePenyaFavorites', JSON.stringify([...state.favorites]));
  } catch (_) {}
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch (_) {
    return null;
  }
}

function sourceInitials(item) {
  const name = (item.source || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function cardAccent(item) {
  switch (item.section) {
    case 'Partits': return '#16a34a';
    case 'Media': return '#0891b2';
    case 'Mercat': return '#f97316';
    case 'Lesions': return '#dc2626';
    default: return '#64748b';
  }
}

function typeIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'resultat': return '🏀';
    case 'video': return '▶';
    case 'podcast': return '🎙';
    case 'audio': return '🎙';
    case 'tweet': return '𝕏';
    case 'lesio': return '✚';
    case 'foto': return '▣';
    default: return '↗';
  }
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  }).format(date);
}

function normalizedMedia(item) {
  return Boolean(item.is_media) || item.section === 'Media' || ['video', 'podcast', 'audio', 'foto'].includes((item.type || '').toLowerCase());
}

function visibleItems() {
  return state.items.filter((item) => {
    let sectionOk = true;
    if (state.section === 'Favorits') sectionOk = state.favorites.has(item.id);
    else if (state.section === 'Media') sectionOk = normalizedMedia(item);
    else if (state.section !== 'Tots') sectionOk = item.section === state.section;
    const sourceOk = !state.source || item.source_id === state.source;
    return sectionOk && sourceOk;
  });
}

function setMessage(text, kind = 'info') {
  const node = $('feed-message');
  if (!text) {
    node.hidden = true;
    node.textContent = '';
    node.dataset.kind = '';
    return;
  }
  node.hidden = false;
  node.textContent = text;
  node.dataset.kind = kind;
}

function updateHeaderCount() {
  const node = $('feed-count');
  if (!node) return;
  node.textContent = state.loading
    ? 'ACTUALITZANT…'
    : `${state.items.length} ENLLAÇOS · ${RETENTION_DAYS} DIES`;
}

function renderSourceFilters() {
  const host = $('source-filters');
  const sources = new Map();
  state.items.forEach((item) => {
    if (item.source_id) sources.set(item.source_id, item.source || item.source_id);
  });

  if (sources.size < 2) {
    host.hidden = true;
    host.replaceChildren();
    return;
  }

  const all = document.createElement('button');
  all.type = 'button';
  all.className = `source-chip${state.source === null ? ' selected' : ''}`;
  all.textContent = 'Totes les fonts';
  all.addEventListener('click', () => {
    state.source = null;
    renderSourceFilters();
    renderFeed();
  });

  const nodes = [all];
  [...sources.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'ca'))
    .forEach(([id, name]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `source-chip${state.source === id ? ' selected' : ''}`;
      button.textContent = name;
      button.addEventListener('click', () => {
        state.source = state.source === id ? null : id;
        renderSourceFilters();
        renderFeed();
      });
      nodes.push(button);
    });

  host.replaceChildren(...nodes);
  host.hidden = false;
}

function createNewsCard(item) {
  const accent = cardAccent(item);
  const card = document.createElement('article');
  card.className = 'news-card';
  card.style.setProperty('--accent', accent);

  const rail = document.createElement('div');
  rail.className = 'news-rail';

  const body = document.createElement('div');
  body.className = 'news-body';

  const top = document.createElement('div');
  top.className = 'news-top';

  const sourceBadge = document.createElement('span');
  sourceBadge.className = 'source-badge';
  sourceBadge.textContent = sourceInitials(item);
  sourceBadge.title = item.source || 'Font';

  const topRight = document.createElement('div');
  topRight.className = 'news-top-right';

  if (item.is_rumor) {
    const rumor = document.createElement('span');
    rumor.className = 'rumor-pill';
    rumor.textContent = 'RUMOR';
    topRight.append(rumor);
  }

  const icon = document.createElement('span');
  icon.className = 'type-icon';
  icon.textContent = typeIcon(item.type);
  topRight.append(icon);

  top.append(sourceBadge, topRight);

  const href = safeUrl(item.url);
  const title = href ? document.createElement('a') : document.createElement('div');
  title.className = 'news-title';
  title.textContent = item.title || 'Sense titular';
  if (href) {
    title.href = href;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
  }

  const source = document.createElement('div');
  source.className = 'news-source';
  source.textContent = item.source || 'Font desconeguda';

  body.append(top, title, source);

  if (item.context) {
    const context = document.createElement('p');
    context.className = 'news-context';
    context.textContent = item.context;
    body.append(context);
  }

  const bottom = document.createElement('div');
  bottom.className = 'news-bottom';

  const meta = document.createElement('div');
  meta.className = 'news-meta';
  if (item.tag) {
    const tag = document.createElement('span');
    tag.className = 'news-tag';
    tag.textContent = item.tag;
    meta.append(tag);
  }
  const date = formatDate(item.published_at || item.detected_at);
  if (date) {
    const dateNode = document.createElement('span');
    dateNode.className = 'news-date';
    dateNode.textContent = date;
    meta.append(dateNode);
  }

  const actions = document.createElement('div');
  actions.className = 'news-actions';

  if (adminSession.token) {
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'admin-edit-button';
    edit.textContent = 'Edita';
    edit.setAttribute('aria-label', `Edita ${item.title || 'aquesta notícia'}`);
    edit.addEventListener('click', () => openAdminModal(item.id));
    actions.append(edit);
  }

  const favorite = document.createElement('button');
  favorite.type = 'button';
  favorite.className = `favorite-button${state.favorites.has(item.id) ? ' active' : ''}`;
  favorite.setAttribute('aria-label', state.favorites.has(item.id) ? 'Treu dels favorits' : 'Afegeix als favorits');
  favorite.textContent = state.favorites.has(item.id) ? '★' : '☆';
  favorite.addEventListener('click', () => {
    if (state.favorites.has(item.id)) state.favorites.delete(item.id);
    else state.favorites.add(item.id);
    saveFavorites();
    renderFeed();
  });
  actions.append(favorite);

  if (href) {
    const read = document.createElement('a');
    read.className = 'read-button';
    read.href = href;
    read.target = '_blank';
    read.rel = 'noopener noreferrer';
    read.textContent = 'Llegir →';
    actions.append(read);
  }

  bottom.append(meta, actions);
  body.append(bottom);
  card.append(rail, body);
  return card;
}

function renderFeed() {
  const list = $('news-list');
  const empty = $('empty-state');
  const items = visibleItems();
  list.replaceChildren(...items.map(createNewsCard));
  list.setAttribute('aria-busy', state.loading ? 'true' : 'false');
  empty.hidden = state.loading || items.length > 0;
}

async function loadLatest() {
  try {
    const response = await fetch(`${META_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return;
    const latest = await response.json();
    if (latest.displayVersion && $('version')) $('version').textContent = latest.displayVersion.replace(' - ', ' · ');
    const url = safeUrl(latest.apkUrl) || APK_URL;
    if ($('download')) $('download').href = url;
    if ($('download-side')) $('download-side').href = url;
  } catch (_) {}
}

async function loadFeed() {
  if (state.loading) return;
  state.loading = true;
  updateHeaderCount();
  $('refresh').disabled = true;
  $('news-list').setAttribute('aria-busy', 'true');
  setMessage('Actualitzant les notícies…');

  const since = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'id,title,source,source_id,context,url,published_at,detected_at,section,tag,type,importance,is_rumor,is_media',
    published: 'eq.true',
    detected_at: `gte.${since}`,
    order: 'detected_at.desc',
    limit: '1000'
  });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/news?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const seen = new Set();
    state.items = data.filter((item) => {
      const key = item.url || item.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setMessage('');
    $('updated-at').textContent = `Actualitzat ${new Intl.DateTimeFormat('ca-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
    renderSourceFilters();
  } catch (_) {
    setMessage("No s'ha pogut carregar el feed ara mateix. Torna-ho a provar amb «Actualitza».", 'error');
  } finally {
    state.loading = false;
    $('refresh').disabled = false;
    updateHeaderCount();
    renderFeed();
  }
}

function adminHeaders(token = '') {
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function clearAdminSession() {
  adminSession.token = '';
  adminSession.email = '';
  sessionStorage.removeItem('semprePenyaAdminToken');
  sessionStorage.removeItem('semprePenyaAdminEmail');
  renderFeed();
}

function persistAdminSession(token, email) {
  adminSession.token = token;
  adminSession.email = email;
  sessionStorage.setItem('semprePenyaAdminToken', token);
  sessionStorage.setItem('semprePenyaAdminEmail', email);
}

function setFormMessage(id, text) {
  const node = $(id);
  node.textContent = text || '';
  node.hidden = !text;
}

function setAdminView(loggedIn) {
  $('admin-login-view').hidden = loggedIn;
  $('admin-publish-view').hidden = !loggedIn;
  if (loggedIn) $('admin-session-email').textContent = `Administrador: ${adminSession.email}`;
}

async function verifyAdmin(token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?select=user_id&limit=1`, {
    headers: adminHeaders(token),
    cache: 'no-store'
  });
  if (!response.ok) return false;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

function selectedRadio(name, fallback) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

function setRadio(name, value, fallback) {
  const target = document.querySelector(`input[name="${name}"][value="${value}"]`)
    || document.querySelector(`input[name="${name}"][value="${fallback}"]`);
  if (target) target.checked = true;
}

function resetAdminPublishForm() {
  adminEditor.itemId = null;
  $('admin-url').value = '';
  $('admin-title-input').value = '';
  $('admin-source').value = '';
  $('admin-context').value = '';
  $('admin-tag').value = '';
  $('admin-rumor').checked = false;
  setRadio('admin-section', 'General', 'General');
  setRadio('admin-importance', 'Normal', 'Normal');
  $('admin-title').textContent = 'Mode administrador';
  $('admin-form-mode').textContent = 'Publica una notícia manual al mateix feed que consulta Android.';
  $('admin-publish').textContent = 'Publicar';
  $('admin-retire').hidden = true;
  $('admin-cancel-edit').hidden = true;
}

function fillAdminEditForm(item) {
  if (!item) {
    resetAdminPublishForm();
    return;
  }
  adminEditor.itemId = item.id;
  $('admin-url').value = item.url || '';
  $('admin-title-input').value = item.title || '';
  $('admin-source').value = item.source || '';
  $('admin-context').value = item.context || '';
  $('admin-tag').value = item.tag || '';
  $('admin-rumor').checked = Boolean(item.is_rumor);
  setRadio('admin-section', item.section === 'Altres' ? 'General' : item.section, 'General');
  setRadio('admin-importance', item.importance || 'Normal', 'Normal');
  $('admin-title').textContent = 'Edita la notícia';
  $('admin-form-mode').textContent = 'Els canvis s’apliquen a la mateixa fila de Supabase i es reflectiran també a l’app Android.';
  $('admin-publish').textContent = 'Desa els canvis';
  $('admin-retire').hidden = false;
  $('admin-cancel-edit').hidden = false;
}

function pendingAdminItem() {
  if (!adminEditor.itemId) return null;
  return state.items.find((item) => item.id === adminEditor.itemId) || null;
}

async function openAdminModal(itemId = null) {
  adminEditor.itemId = itemId || null;
  $('admin-modal').hidden = false;
  document.body.classList.add('modal-open');
  setFormMessage('admin-login-error', '');
  setFormMessage('admin-publish-error', '');
  setFormMessage('admin-publish-ok', '');

  if (adminSession.token) {
    const valid = await verifyAdmin(adminSession.token).catch(() => false);
    if (valid) {
      setAdminView(true);
      const item = pendingAdminItem();
      if (item) fillAdminEditForm(item);
      else resetAdminPublishForm();
      renderFeed();
      return;
    }
    clearAdminSession();
  }

  setAdminView(false);
  if (adminSession.email) $('admin-email').value = adminSession.email;
}

function closeAdminModal() {
  $('admin-modal').hidden = true;
  document.body.classList.remove('modal-open');
  adminEditor.itemId = null;
}

async function adminLogin() {
  const email = $('admin-email').value.trim();
  const password = $('admin-password').value;
  const button = $('admin-login');
  setFormMessage('admin-login-error', '');
  if (!email || !password) return;

  button.disabled = true;
  button.textContent = 'Entrant…';
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description || data.msg || data.message || 'No s’ha pogut iniciar sessió');
    const isAdmin = await verifyAdmin(data.access_token);
    if (!isAdmin) throw new Error('Aquest compte no té permisos d’administrador.');
    persistAdminSession(data.access_token, email);
    $('admin-password').value = '';
    setAdminView(true);
    const item = pendingAdminItem();
    if (item) fillAdminEditForm(item);
    else resetAdminPublishForm();
    renderFeed();
  } catch (error) {
    clearAdminSession();
    setAdminView(false);
    setFormMessage('admin-login-error', error.message || 'No s’ha pogut iniciar sessió');
  } finally {
    button.disabled = false;
    button.textContent = 'Entrar';
  }
}

function buildAdminPayload() {
  const url = $('admin-url').value.trim();
  const title = $('admin-title-input').value.trim();
  const source = $('admin-source').value.trim() || 'Afegit manualment';
  const context = $('admin-context').value.trim();
  const tag = $('admin-tag').value.trim();
  const selectedSection = selectedRadio('admin-section', 'General');
  const section = selectedSection === 'General' ? 'Altres' : selectedSection;
  const importance = selectedRadio('admin-importance', 'Normal');
  const isRumor = $('admin-rumor').checked;

  if (!safeUrl(url) || !title) {
    throw new Error('Cal indicar un enllaç http/https vàlid i un titular.');
  }

  return {
    url,
    title,
    source,
    context,
    tag,
    section,
    importance,
    is_rumor: isRumor,
    is_media: selectedSection === 'Media'
  };
}

async function adminPublishOrSave() {
  const button = $('admin-publish');
  setFormMessage('admin-publish-error', '');
  setFormMessage('admin-publish-ok', '');

  if (!adminSession.token) {
    setFormMessage('admin-publish-error', 'La sessió d’administrador ha caducat. Torna a entrar.');
    setAdminView(false);
    return;
  }

  let payload;
  try {
    payload = buildAdminPayload();
  } catch (error) {
    setFormMessage('admin-publish-error', error.message);
    return;
  }

  const editing = Boolean(adminEditor.itemId);
  button.disabled = true;
  button.textContent = editing ? 'Desant…' : 'Publicant…';

  try {
    let endpoint = `${SUPABASE_URL}/rest/v1/news`;
    let method = 'POST';
    let body = payload;

    if (editing) {
      endpoint += `?id=eq.${encodeURIComponent(adminEditor.itemId)}`;
      method = 'PATCH';
    } else {
      const now = new Date().toISOString();
      body = {
        id: `manual-${Date.now()}`,
        ...payload,
        source_id: 'manual',
        published_at: now,
        detected_at: now,
        type: 'noticia',
        published: true
      };
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        ...adminHeaders(adminSession.token),
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      setAdminView(false);
      throw new Error('La sessió ha caducat o ja no té permisos d’administrador.');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.details || `No s’ha pogut desar (HTTP ${response.status})`);
    }

    const message = editing
      ? 'Canvis desats. Android i web llegiran aquesta mateixa versió.'
      : 'Publicada. Ja forma part del mateix feed que consulta Android.';
    resetAdminPublishForm();
    setFormMessage('admin-publish-ok', message);
    await loadFeed();
  } catch (error) {
    setFormMessage('admin-publish-error', error.message || 'No s’ha pogut desar.');
  } finally {
    button.disabled = false;
    button.textContent = adminEditor.itemId ? 'Desa els canvis' : 'Publicar';
  }
}

async function adminRetire() {
  const item = pendingAdminItem();
  if (!item || !adminSession.token) return;
  if (!window.confirm(`Vols retirar del feed «${item.title}»? La notícia quedarà a Supabase, però Android i web deixaran de mostrar-la.`)) return;

  const button = $('admin-retire');
  setFormMessage('admin-publish-error', '');
  setFormMessage('admin-publish-ok', '');
  button.disabled = true;
  button.textContent = 'Retirant…';

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(item.id)}`, {
      method: 'PATCH',
      headers: {
        ...adminHeaders(adminSession.token),
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ published: false })
    });

    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      setAdminView(false);
      throw new Error('La sessió ha caducat o ja no té permisos d’administrador.');
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.details || `No s’ha pogut retirar (HTTP ${response.status})`);
    }

    resetAdminPublishForm();
    setFormMessage('admin-publish-ok', 'Retirada del feed. Deixarà d’aparèixer tant a la web com a Android en actualitzar.');
    await loadFeed();
  } catch (error) {
    setFormMessage('admin-publish-error', error.message || 'No s’ha pogut retirar.');
  } finally {
    button.disabled = false;
    button.textContent = 'Retira del feed';
  }
}

document.querySelectorAll('[data-section]').forEach((button) => {
  button.addEventListener('click', () => {
    state.section = button.dataset.section;
    document.querySelectorAll('[data-section]').forEach((node) => node.classList.toggle('selected', node === button));
    renderFeed();
  });
});

$('refresh').addEventListener('click', loadFeed);
$('admin-close').addEventListener('click', closeAdminModal);
$('admin-login').addEventListener('click', adminLogin);
$('admin-publish').addEventListener('click', adminPublishOrSave);
$('admin-retire').addEventListener('click', adminRetire);
$('admin-cancel-edit').addEventListener('click', () => {
  resetAdminPublishForm();
  setFormMessage('admin-publish-error', '');
  setFormMessage('admin-publish-ok', '');
});
$('admin-logout').addEventListener('click', () => {
  clearAdminSession();
  resetAdminPublishForm();
  setAdminView(false);
});
$('admin-modal').addEventListener('click', (event) => {
  if (event.target === $('admin-modal')) closeAdminModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('admin-modal').hidden) closeAdminModal();
});

let adminPressTimer = null;
const adminTrigger = $('admin-trigger');
const cancelAdminPress = () => {
  if (adminPressTimer) clearTimeout(adminPressTimer);
  adminPressTimer = null;
};
adminTrigger.addEventListener('pointerdown', () => {
  cancelAdminPress();
  adminPressTimer = setTimeout(() => {
    adminPressTimer = null;
    openAdminModal();
  }, 700);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => adminTrigger.addEventListener(eventName, cancelAdminPress));

loadLatest();
loadFeed();