const SUPABASE_URL = 'https://busuaaaamcojjtavhrne.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OTXxn8gyKvPzbhTPudOj9g_Ab79QJl8';
const META_URL = `${SUPABASE_URL}/storage/v1/object/public/app-downloads/latest.json`;
const APK_URL = `${SUPABASE_URL}/functions/v1/app-download?source=web`;
const RETENTION_DAYS = 90;
const FEED_TAXONOMY = window.SEMPRE_PENYA_FEED_TAXONOMY;
if (!FEED_TAXONOMY) throw new Error('No s’ha carregat la taxonomia canònica del feed');

const state = {
  items: [],
  activeSections: new Set(),
  favoritesOnly: false,
  sourceKey: null,
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

const rejectEditor = {
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
    case 'Partits': return '#005441';
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

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase().replace(/\s+/g, ' ');
}

function sourceKey(item) {
  const sourceId = String(item.source_id || '').trim();
  if (sourceId && sourceId !== 'manual') return sourceId;
  return 'name:' + normalizeText(item.source);
}

function normalizedMedia(item) {
  return Boolean(item.is_media) || item.section === 'Media' || ['video','podcast','audio','foto'].includes(normalizeText(item.type));
}

function visibleItems() {
  return state.items.filter((item) => {
    const sectionOk = state.activeSections.size === 0 || [...state.activeSections].some((selected) => selected === 'Media' ? normalizedMedia(item) : item.section === selected);
    const favoriteOk = !state.favoritesOnly || state.favorites.has(item.id);
    const itemSourceKey = sourceKey(item);
    const sourceOk = !state.sourceKey || itemSourceKey === state.sourceKey;
    return sectionOk && favoriteOk && sourceOk;
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
  const menu = $('source-search-menu');
  const toggle = $('source-search-toggle');
  if (!menu || !toggle) return;
  const grouped = new Map();
  state.items.forEach((item) => {
    const key = sourceKey(item);
    const current = grouped.get(key) || { key, name: String(item.source || '').trim() || 'Font desconeguda', count: 0 };
    current.count += 1;
    grouped.set(key, current);
  });
  const options = [...grouped.values()].sort((a,b) => b.count - a.count || a.name.localeCompare(b.name,'ca'));
  if (state.sourceKey && !options.some((entry) => entry.key === state.sourceKey)) state.sourceKey = null;
  const nodes = [];
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'source-menu-reset' + (state.sourceKey ? '' : ' selected');
  reset.textContent = 'Totes les fonts';
  reset.addEventListener('click', () => { state.sourceKey = null; renderSourceFilters(); renderFeed(); menu.hidden = true; toggle.setAttribute('aria-expanded','false'); });
  nodes.push(reset);
  const top = options.slice(0,10);
  const rest = options.slice(10).sort((a,b) => a.name.localeCompare(b.name,'ca'));
  if (top.length) { const label=document.createElement('div'); label.className='source-menu-label'; label.textContent='10 fonts amb més notícies'; nodes.push(label); }
  const add = (entry) => {
    const button=document.createElement('button'); button.type='button'; button.className='source-menu-item' + (state.sourceKey===entry.key ? ' selected' : '');
    const name=document.createElement('span'); name.className='source-menu-name'; name.textContent=entry.name;
    const count=document.createElement('span'); count.className='source-menu-count'; count.textContent=entry.count;
    button.append(name,count);
    button.addEventListener('click', () => { state.sourceKey = state.sourceKey===entry.key ? null : entry.key; renderSourceFilters(); renderFeed(); menu.hidden=true; toggle.setAttribute('aria-expanded','false'); });
    nodes.push(button);
  };
  top.forEach(add);
  if(rest.length){ const sep=document.createElement('div'); sep.className='source-menu-separator'; nodes.push(sep); rest.forEach(add); }
  menu.replaceChildren(...nodes);
  toggle.classList.toggle('selected', Boolean(state.sourceKey));
  toggle.classList.toggle('active', Boolean(state.sourceKey));
}

function displaySection(section) {
  return FEED_TAXONOMY.displaySections[section] || section || 'Altres';
}

function canonicalSubcategory(section, value) {
  const clean=String(value || '').trim();
  if(!clean) return '';
  return (FEED_TAXONOMY.subcategories[section] || []).find((option) => normalizeText(option) === normalizeText(clean)) || '';
}

function standardSubcategory(item) {
  const explicit=canonicalSubcategory(item.section,item.tag);
  if(explicit) return explicit;
  const haystack=normalizeText([item.tag,item.title,item.type].join(' '));
  const has=(...needles)=>needles.some((needle)=>haystack.includes(normalizeText(needle)));
  if(item.section==='Partits'){
    if(has('estadistic','stats','boxscore','box score')) return 'Estadístiques';
    if(has('post partit','postpartit','roda de premsa','despres del partit')) return 'Post-partit';
    if(has('previa','pre partit','prepartit')) return 'Prèvia';
    if(has('cronica','resultat') || normalizeText(item.type)==='resultat') return 'Crònica';
  }
  if(item.section==='Media'){
    if(has('entrevista','interview')) return 'Entrevista';
    if(['podcast','audio'].includes(normalizeText(item.type)) || has('podcast','audio','ivoox')) return 'Podcast';
    if(has('resum del partit','resum partit') || (has('resum') && has('partit','joventut'))) return 'Resum del partit';
    if(has('highlights','highlight','top 5','top5','millors jugades')) return 'Highlights general';
    if(has('post partit','postpartit','roda de premsa','despres del partit')) return 'Post-partit';
    if(normalizeText(item.type)==='video' || has('video','youtube')) return 'Vídeo';
  }
  if(item.section==='Mercat'){
    if(item.is_rumor || has('rumor')) return 'Rumor';
    if(has('no segueix','no continu','comiat','adeu','deixa el club','baixa')) return 'No segueix';
    if(has('fitxatge','fitxa','reforc','incorporacio','arriba')) return 'Fitxatge';
  }
  return '';
}

function taxonomyLabel(item) {
  const category=displaySection(item.section);
  const sub=standardSubcategory(item);
  return sub ? category + ' - ' + sub : category;
}

function mediaLinks(item) {
  const links=[];
  const normalizeKind=(value)=>{ const kind=normalizeText(value); if(['audio','podcast','escoltar'].includes(kind)) return 'audio'; if(['video','youtube'].includes(kind)) return 'video'; if(['read','article','web','llegir'].includes(kind)) return 'read'; return null; };
  (Array.isArray(item.media_links) ? item.media_links : []).forEach((entry)=>{
    const kind=normalizeKind(entry && entry.kind);
    const url=safeUrl((entry && entry.url) || '');
    if(kind && url) links.push({kind,url});
  });
  const primary=safeUrl(item.url || '');
  if(primary && !links.some((entry)=>entry.url.replace(/\/+$/,'').toLowerCase()===primary.replace(/\/+$/,'').toLowerCase())){
    const type=normalizeText(item.type);
    links.push({kind:['podcast','audio'].includes(type)?'audio':(type==='video'?'video':'read'),url:primary});
  }
  const order={read:0,audio:1,video:2};
  const seen=new Set();
  return links.filter((entry)=>{ const key=entry.url.replace(/\/+$/,'').toLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; }).sort((x,y)=>(order[x.kind]??9)-(order[y.kind]??9));
}

function mediaActionLabel(link) {
  if(link.kind==='audio') return '🎧 Escoltar →';
  if(link.kind==='video') return '▶ Veure vídeo →';
  return 'Llegir →';
}

function groupingKey(item) {
  const explicit = normalizeText(item.content_group);
  if (explicit) return 'group:' + explicit;
  const title = normalizeText(item.title);
  const day = String(item.published_at || '').slice(0, 10) || String(item.detected_at || '').slice(0, 10);
  if (title.length >= 18 && day.length === 10) return 'title:' + day + ':' + title;
  const links = mediaLinks(item);
  if (links.length) return 'url:' + links[0].url.replace(/\/+$/, '').toLowerCase();
  return 'id:' + item.id;
}

function mergeMultimedia(items) {
  const sorted = [...items].sort((a, b) =>
    String(b.detected_at || b.published_at || '').localeCompare(String(a.detected_at || a.published_at || ''))
  );
  const merged = new Map();

  sorted.forEach((item) => {
    const key = groupingKey(item);
    const normalized = { ...item, media_links: mediaLinks(item) };
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, normalized);
      return;
    }

    const links = mediaLinks({
      ...previous,
      url: '',
      media_links: [...mediaLinks(previous), ...mediaLinks(normalized)]
    });
    merged.set(key, {
      ...previous,
      url: links[0]?.url || previous.url,
      media_links: links,
      context: String(previous.context || '').length >= String(normalized.context || '').length
        ? previous.context
        : normalized.context,
      importance: previous.importance === 'Important' || normalized.importance === 'Important'
        ? 'Important'
        : previous.importance,
      is_rumor: Boolean(previous.is_rumor || normalized.is_rumor),
      is_media: Boolean(previous.is_media || normalized.is_media),
      content_group: previous.content_group || normalized.content_group || ''
    });
  });

  return [...merged.values()].sort((a, b) =>
    String(b.detected_at || b.published_at || '').localeCompare(String(a.detected_at || a.published_at || ''))
  );
}

function createNewsCard(item) {
  const accent=cardAccent(item);
  const card=document.createElement('article'); card.className='news-card'; card.style.setProperty('--accent',accent);
  const rail=document.createElement('div'); rail.className='news-rail';
  const body=document.createElement('div'); body.className='news-body';
  const top=document.createElement('div'); top.className='news-top';
  const sourceBadge=document.createElement('span'); sourceBadge.className='source-badge'; sourceBadge.textContent=sourceInitials(item); sourceBadge.title=item.source || 'Font';
  const topRight=document.createElement('div'); topRight.className='news-top-right';
  if(item.is_rumor){ const rumor=document.createElement('span'); rumor.className='rumor-pill'; rumor.textContent='RUMOR'; topRight.append(rumor); }
  const icon=document.createElement('span'); icon.className='type-icon'; icon.textContent=typeIcon(item.type); topRight.append(icon);
  top.append(sourceBadge,topRight);
  const links=mediaLinks(item);
  const href=links.length ? links[0].url : null;
  const title=href ? document.createElement('a') : document.createElement('div');
  title.className='news-title'; title.textContent=item.title || 'Sense titular';
  if(href){ title.href=href; title.target='_blank'; title.rel='noopener noreferrer'; }
  const source=document.createElement('div'); source.className='news-source'; source.textContent=item.source || 'Font desconeguda';
  body.append(top,title,source);
  if(item.context){ const context=document.createElement('p'); context.className='news-context'; context.textContent=item.context; body.append(context); }
  const bottom=document.createElement('div'); bottom.className='news-bottom';
  const meta=document.createElement('div'); meta.className='news-meta';
  const tag=document.createElement('span'); tag.className='news-tag'; tag.textContent=taxonomyLabel(item); meta.append(tag);
  const date=formatDate(item.published_at || item.detected_at);
  if(date){ const dateNode=document.createElement('span'); dateNode.className='news-date'; dateNode.textContent=date; meta.append(dateNode); }
  const actions=document.createElement('div'); actions.className='news-actions';
  if(adminSession.token){ const edit=document.createElement('button'); edit.type='button'; edit.className='admin-edit-button'; edit.textContent='Edita'; edit.addEventListener('click',()=>openAdminModal(item.id)); actions.append(edit); }
  const favorite=document.createElement('button'); favorite.type='button'; favorite.className='favorite-button' + (state.favorites.has(item.id)?' active':''); favorite.textContent=state.favorites.has(item.id)?'★':'☆';
  favorite.addEventListener('click',()=>{ if(state.favorites.has(item.id)) state.favorites.delete(item.id); else state.favorites.add(item.id); saveFavorites(); renderFeed(); });
  actions.append(favorite);
  bottom.append(meta,actions); body.append(bottom);
  if(links.length){ const mediaActions=document.createElement('div'); mediaActions.className='news-media-actions'; links.forEach((link)=>{ const action=document.createElement('a'); action.className='read-button'; action.href=link.url; action.target='_blank'; action.rel='noopener noreferrer'; action.textContent=mediaActionLabel(link); mediaActions.append(action); }); body.append(mediaActions); }
  card.append(rail,body); return card;
}

function renderFeed() {
  const list = $('news-list');
  const empty = $('empty-state');
  const items = visibleItems();
  list.replaceChildren(...items.map(createNewsCard));
  list.setAttribute('aria-busy', state.loading ? 'true' : 'false');
  empty.hidden = state.loading || items.length > 0;

  document.querySelectorAll('[data-section]').forEach((button) => {
    button.classList.toggle('selected', state.activeSections.has(button.dataset.section));
  });
  $('favorites-filter')?.classList.toggle('selected', state.favoritesOnly);
  renderSourceFilters();
}

async function loadLatest() {
  try {
    const response = await fetch(`${META_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return;
    const latest = await response.json();
    if (latest.displayVersion && $('version')) $('version').textContent = latest.displayVersion.replace(' - ', ' · ');
    const rawUrl = safeUrl(latest.apkUrl) || APK_URL;
    let url = rawUrl;
    try {
      const tracked = new URL(rawUrl);
      tracked.searchParams.set('source', 'web');
      url = tracked.toString();
    } catch (_) {}
    if ($('download')) $('download').href = url;
    if ($('download-side')) $('download-side').href = url;
    document.querySelectorAll('.toolbar-download-button').forEach(link => { link.href = url; });
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
    select: 'id,title,source,source_id,context,url,published_at,detected_at,section,tag,type,importance,is_rumor,is_media,media_links,content_group',
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
    state.items = mergeMultimedia(Array.isArray(data) ? data : []);
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

function selectedAdminSection() {
  const selected = selectedRadio('admin-section', 'General');
  return selected === 'General' ? 'Altres' : selected;
}

function renderAdminSubcategories(selected = '') {
  const fieldset = $('admin-subcategory-fieldset');
  const host = $('admin-subcategory-options');
  if (!fieldset || !host) return;
  const section = selectedAdminSection();
  const options = FEED_TAXONOMY.subcategories[section] || [];
  const canonical = canonicalSubcategory(section, selected);
  fieldset.hidden = options.length === 0;
  host.replaceChildren();
  if (!options.length) return;
  const noneLabel = document.createElement('label');
  const none = document.createElement('input');
  none.type = 'radio'; none.name = 'admin-subcategory'; none.value = ''; none.checked = !canonical;
  noneLabel.append(none, document.createTextNode(' Sense subcategoria'));
  host.append(noneLabel);
  options.forEach((option) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'admin-subcategory'; input.value = option; input.checked = option === canonical;
    label.append(input, document.createTextNode(' ' + option));
    host.append(label);
  });
}

function resetAdminPublishForm() {
  adminEditor.itemId = null;
  $('admin-url').value = '';
  $('admin-title-input').value = '';
  $('admin-source').value = '';
  $('admin-context').value = '';
  setRadio('admin-section', 'General', 'General');
  setRadio('admin-importance', 'Normal', 'Normal');
  renderAdminSubcategories('');
  $('admin-title').textContent = 'Mode administrador';
  $('admin-form-mode').textContent = 'Publica una notícia manual al mateix feed que consulta Android.';
  $('admin-publish').textContent = 'Publicar';
  $('admin-retire').hidden = true;
  $('admin-cancel-edit').hidden = true;
}

function fillAdminEditForm(item) {
  if (!item) { resetAdminPublishForm(); return; }
  adminEditor.itemId = item.id;
  $('admin-url').value = item.url || '';
  $('admin-title-input').value = item.title || '';
  $('admin-source').value = item.source || '';
  $('admin-context').value = item.context || '';
  setRadio('admin-section', item.section === 'Altres' ? 'General' : item.section, 'General');
  setRadio('admin-importance', item.importance || 'Normal', 'Normal');
  renderAdminSubcategories(standardSubcategory(item));
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

function canonicalManualSourceId(source, url) {
  const key = String(source || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .trim()
    .toLowerCase();
  const href = String(url || '').toLowerCase();
  const isYouTube = href.includes('youtube.com/') || href.includes('youtu.be/');

  if (['acb', 'acb.com', 'liga endesa', 'acb / liga endesa'].includes(key)) return 'acb';
  if (key.includes("l'esportiu") || key.includes('lesportiu')) return 'lesportiu';
  if (key.includes('mundo deportivo') || key.includes('mundodeportivo')) return 'mundodeportivo';
  if (key.includes('gigantes')) return 'gigantes';
  if (key.includes('sobre la bocina')) return 'sobre-la-bocina';
  if (key === 'sport' || key.includes('diari sport') || key.includes('diario sport')) return 'sport';
  if (key.includes('basketball champions league') || key === 'bcl') return 'bcl';
  if (key.includes('esports bdn')) return 'bdncom-esports';
  if (key.includes('badalona comunicacio') || key.includes('bdn comunicacio') || key === 'bdncom') {
    return isYouTube ? 'bdncom-youtube' : 'bdncom';
  }
  if (key.includes('club joventut badalona') || key === 'penya' || key.includes('joventut badalona')) {
    return isYouTube ? 'youtube_penya' : 'penya-oficial';
  }
  return null;
}

function buildAdminPayload() {
  const url = $('admin-url').value.trim();
  const title = $('admin-title-input').value.trim();
  const source = $('admin-source').value.trim() || 'Afegit manualment';
  const context = $('admin-context').value.trim();
  const selectedSection = selectedRadio('admin-section', 'General');
  const section = selectedSection === 'General' ? 'Altres' : selectedSection;
  const rawSubcategory = selectedRadio('admin-subcategory', '');
  const tag = canonicalSubcategory(section, rawSubcategory);
  const importance = selectedRadio('admin-importance', 'Normal');
  if ((url && !safeUrl(url)) || !title) throw new Error('Cal indicar un titular i, si hi ha enllaç, ha de ser http/https vàlid.');
  return {
    url, title, source, context, tag, section, importance,
    is_rumor: section === 'Mercat' && tag === 'Rumor',
    is_media: section === 'Media'
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
    const canonicalSourceId = canonicalManualSourceId(payload.source, payload.url);
    if (canonicalSourceId) payload.source_id = canonicalSourceId;
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
        source_id: payload.source_id || 'manual',
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

function openRejectModal(item) {
  if (!item) return;
  rejectEditor.itemId = item.id;
  $('reject-item-title').textContent = item.title || 'Sense titular';
  $('reject-reason').value = '';
  $('reject-comment').value = '';
  $('reject-comment-label').textContent = 'Comentari opcional';
  $('reject-comment').placeholder = 'Pots afegir context perquè el radar aprengui millor.';
  setFormMessage('reject-error', '');
  $('reject-modal').hidden = false;
}

function closeRejectModal() {
  $('reject-modal').hidden = true;
  rejectEditor.itemId = null;
}

function updateRejectCommentRequirement() {
  const custom = $('reject-reason').value === 'other';
  $('reject-comment-label').textContent = custom ? 'Explica breument el motiu *' : 'Comentari opcional';
  $('reject-comment').placeholder = custom
    ? 'Escriu el motiu que no encaixa amb les opcions.'
    : 'Pots afegir context perquè el radar aprengui millor.';
}

async function saveRejectReason() {
  const item = state.items.find((row) => row.id === rejectEditor.itemId);
  if (!item || !adminSession.token) return;

  const reason = $('reject-reason').value;
  const comment = $('reject-comment').value.trim();
  setFormMessage('reject-error', '');
  if (!reason) {
    setFormMessage('reject-error', 'Tria un motiu abans de descartar.');
    return;
  }
  if (reason === 'other' && !comment) {
    setFormMessage('reject-error', 'Escriu breument el motiu.');
    return;
  }

  const button = $('reject-save');
  button.disabled = true;
  button.textContent = 'Descartant…';

  try {
    const reviewResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/news_reviews?on_conflict=news_id,user_id`,
      {
        method: 'POST',
        headers: {
          ...adminHeaders(adminSession.token),
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          news_id: item.id,
          verdict: 'rejected',
          reason,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (reviewResponse.status === 401 || reviewResponse.status === 403) {
      clearAdminSession();
      setAdminView(false);
      throw new Error('La sessió ha caducat o ja no té permisos d’administrador.');
    }
    if (!reviewResponse.ok) {
      const data = await reviewResponse.json().catch(() => ({}));
      throw new Error(data.message || data.details || `No s’ha pogut desar el motiu (HTTP ${reviewResponse.status})`);
    }

    const newsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/news?id=eq.${encodeURIComponent(item.id)}`,
      {
        method: 'PATCH',
        headers: {
          ...adminHeaders(adminSession.token),
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ published: false })
      }
    );

    if (!newsResponse.ok) {
      const data = await newsResponse.json().catch(() => ({}));
      throw new Error(data.message || data.details || `No s’ha pogut retirar (HTTP ${newsResponse.status})`);
    }

    closeRejectModal();
    resetAdminPublishForm();
    setFormMessage('admin-publish-ok', 'Descartada del feed amb el motiu desat com a feedback editorial.');
    await loadFeed();
  } catch (error) {
    setFormMessage('reject-error', error.message || 'No s’ha pogut descartar.');
  } finally {
    button.disabled = false;
    button.textContent = 'Descarta';
  }
}

async function adminRetire() {
  const item = pendingAdminItem();
  if (!item || !adminSession.token) return;
  openRejectModal(item);
}

document.querySelectorAll('[data-section]').forEach((button) => {
  button.addEventListener('click', () => {
    const section = button.dataset.section;
    if (state.activeSections.has(section)) state.activeSections.delete(section);
    else state.activeSections.add(section);
    renderFeed();
    const menu = $('source-search-menu');
    const toggle = $('source-search-toggle');
    if (menu && toggle) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  });
});

$('favorites-filter')?.addEventListener('click', () => {
  state.favoritesOnly = !state.favoritesOnly;
  renderFeed();
});

$('source-search-toggle')?.addEventListener('click', (event) => {
  event.stopPropagation();
  const menu = $('source-search-menu');
  const toggle = $('source-search-toggle');
  if (!menu || !toggle) return;
  const opening = menu.hidden;
  menu.hidden = !opening;
  toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
  if (opening) renderSourceFilters();
});
$('source-search-menu')?.addEventListener('click', (event) => event.stopPropagation());
document.addEventListener('click', () => {
  const menu = $('source-search-menu');
  const toggle = $('source-search-toggle');
  if (menu && toggle) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
});

document.querySelectorAll('input[name="admin-section"]').forEach((input) => {
  input.addEventListener('change', () => renderAdminSubcategories(''));
});

$('refresh').addEventListener('click', loadFeed);
$('admin-close').addEventListener('click', closeAdminModal);
$('admin-login').addEventListener('click', adminLogin);
$('admin-publish').addEventListener('click', adminPublishOrSave);
$('admin-retire').addEventListener('click', adminRetire);
$('reject-reason').addEventListener('change', updateRejectCommentRequirement);
$('reject-save').addEventListener('click', saveRejectReason);
$('reject-cancel').addEventListener('click', closeRejectModal);
$('reject-close').addEventListener('click', closeRejectModal);
$('reject-modal').addEventListener('click', (event) => {
  if (event.target === $('reject-modal')) closeRejectModal();
});
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
  if (event.key !== 'Escape') return;
  const menu = $('source-search-menu');
  const toggle = $('source-search-toggle');
  if (menu && toggle) { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  if (!$('admin-modal').hidden) closeAdminModal();
  if (!$('reject-modal').hidden) closeRejectModal();
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