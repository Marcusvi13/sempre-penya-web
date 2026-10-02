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

function normalizedMedia(item) {
  return Boolean(item.is_media) || item.section === 'Media' || ['video','podcast','audio','foto'].includes(normalizeText(item.type));
}

function visibleItems() {
  return state.items.filter((item) => {
    const sectionOk = state.activeSections.size === 0 || [...state.activeSections].some((selected) => selected === 'Media' ? normalizedMedia(item) : item.section === selected);
    const favoriteOk = !state.favoritesOnly || state.favorites.has(item.id);
    const itemSourceKey = String(item.source_id || '').trim() || ('name:' + normalizeText(item.source));
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
    const key = String(item.source_id || '').trim() || ('name:' + normalizeText(item.source));
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
  button.addEventListener('click', () => {
    const section = button.dataset.section;
    if (state.activeSections.has(section)) state.activeSections.delete(section);
    else state.activeSections.add(section);
    renderFeed();
    const menu = $('source-search-menu'); if (menu) menu.hidden = true;
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
document.addEventListener('click', () => { const menu=$('source-search-menu'); const toggle=$('source-search-toggle'); if(menu&&toggle){ menu.hidden=true; toggle.setAttribute('aria-expanded','false'); } });

document.querySelectorAll('input[name="admin-section"]').forEach((input) => {
  input.addEventListener('change', () => renderAdminSubcategories(''));
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
  if (event.key !== 'Escape') return;
  const menu = $('source-search-menu');
  const toggle = $('source-search-toggle');
  if (menu && toggle) { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); }
  if (!$('admin-modal').hidden) closeAdminModal();
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