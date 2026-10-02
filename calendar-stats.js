/* SEMPRE PENYA — calendari compartit amb Supabase + estadístiques de temporada. */
(() => {
  const SUPABASE_URL = 'https://busuaaaamcojjtavhrne.supabase.co';
  const PUBLIC_KEY = 'sb_publishable_OTXxn8gyKvPzbhTPudOj9g_Ab79QJl8';
  const CALENDAR_URL = `${SUPABASE_URL}/rest/v1/calendar_results?select=game_key,game_date,date_text,competition,matchup,score,played,stats_url,sort_order,visible&order=sort_order.asc`;
  const STATS_URL = `${SUPABASE_URL}/rest/v1/season_player_game_stats?select=*&order=game_date.desc`;
  const STATS_CONFIG_URL = `${SUPABASE_URL}/rest/v1/season_stats_ui_config?id=eq.default&select=config&limit=1`;

  const seasonGames = [
    ['2026-08-29','29/08/2026 · 21:00','Pretemporada','Asisa Joventut – Monbus Obradoiro','77–96',true,'https://acb.com/docs/descarga/Pretemporada2627/statsobra.jpg'],
    ['2026-09-03','03/09/2026 · 20:30','Pretemporada','Asisa Joventut – Kids&Us Manresa','78–84',true,'https://acb.com/docs/descarga/Pretemporada2627/statsmanresapenya.jpg'],
    ['2026-09-06','06/09/2026 · 13:00','Pretemporada','Asisa Joventut – ratiopharm Ulm','72–66',true,'https://acb.com/docs/descarga/Pretemporada2627/statspenyaratiopham.jpg'],
    ['2026-09-09','09/09/2026 · 18:30','Lliga Catalana ACB · Grup 2','Asisa Joventut – iLERNA Lleida','84–89',true,'https://msstats.optimalwayconsulting.com/v1/fcbq/matches/b2eda818-efcf-4c19-9532-fd3878933fb0/stats/pdf?period=4'],
    ['2026-09-11','11/09/2026 · 18:30','Lliga Catalana ACB · Grup 2','Asisa Joventut – FIATC Girona','95–84',true,'https://msstats.optimalwayconsulting.com/v1/fcbq/matches/85572674-2cf8-466b-94e9-d7274f9e5c05/stats/pdf?period=4'],
    ['2026-09-19','19/09/2026 · 18:00','Supercopa Endesa · Semifinal','Asisa Joventut – Kosner Baskonia','',false,''],
    ['2026-09-20','20/09/2026 · 19:00','Supercopa Endesa · Final','Asisa Joventut – Barça','',false,''],
    ['2026-09-27','27/09/2026 · 12:00','Liga Endesa · J1','Río Breogán – Asisa Joventut','',false,''],
    ['2026-10-03','03/10/2026 · 18:00','Liga Endesa · J2','Asisa Joventut – MoraBanc Andorra','',false,''],
    ['2026-10-06','06/10/2026','BCL · Grup H · J1','Asisa Joventut – Bnei Penlink Herzliya','',false,''],
    ['2026-10-11','11/10/2026 · 17:00','Liga Endesa · J3','Kosner Baskonia – Asisa Joventut','',false,''],
    ['2026-10-18','18/10/2026 · 19:00','Liga Endesa · J4','Asisa Joventut – Barça','',false,''],
    ['2026-10-20','20/21-10-2026','BCL · Grup H · J2','Rival del grup H · pendent detall oficial','',false,''],
    ['2026-10-24','24/10/2026 · 19:30','Liga Endesa · J5','FIATC Girona – Asisa Joventut','',false,''],
    ['2026-11-01','01/11/2026 · 12:00','Liga Endesa · J6','Asisa Joventut – Surne Bilbao','',false,''],
    ['2026-11-03','03/04-11-2026','BCL · Grup H · J3','Rival del grup H · pendent detall oficial','',false,''],
    ['2026-11-08','08/11/2026 · 13:00','Liga Endesa · J7','La Laguna Tenerife – Asisa Joventut','',false,''],
    ['2026-11-14','14/11/2026 · 21:00','Liga Endesa · J8','Asisa Joventut – Casademont Zaragoza','',false,''],
    ['2026-11-17','17/18-11-2026','BCL · Grup H · J4','Rival del grup H · pendent detall oficial','',false,''],
    ['2026-11-22','22/11/2026 · 19:00','Liga Endesa · J9','Real Madrid – Asisa Joventut','',false,''],
    ['2026-12-06','06/12/2026 · 17:00','Liga Endesa · J10','Recoletas Salud San Pablo Burgos – Asisa Joventut','',false,''],
    ['2026-12-08','08/09-12-2026','BCL · Grup H · J5','Rival del grup H · pendent detall oficial','',false,''],
    ['2026-12-08b','08/12/2026 · 19:00','Liga Endesa · J11','Asisa Joventut – Valencia Basket','',false,''],
    ['2026-12-13','13/12/2026 · 12:00','Liga Endesa · J12','Asisa Joventut – Monbus Obradoiro','',false,''],
    ['2026-12-15','15/16-12-2026','BCL · Grup H · J6','Rival del grup H · pendent detall oficial','',false,''],
    ['2026-12-19','19/12/2026 · 19:30','Liga Endesa · J13','Unicaja – Asisa Joventut','',false,''],
    ['2026-12-27','27/12/2026 · 12:00','Liga Endesa · J14','Asisa Joventut – Kids&Us Manresa','',false,''],
    ['2026-12-30','30/12/2026 · 21:00','Liga Endesa · J15','UCAM Murcia – Asisa Joventut','',false,''],
    ['2027-01-03','03/01/2027 · 17:00','Liga Endesa · J16','Asisa Joventut – Leyma Coruña','',false,''],
    ['2027-01-09','09/01/2027 · 19:30','Liga Endesa · J17','Asisa Joventut – iLERNA Lleida','',false,''],
    ['2027-01-17','17/01/2027 · 12:00','Liga Endesa · J18','Surne Bilbao – Asisa Joventut','',false,''],
    ['2027-01-24','24/01/2027 · 19:00','Liga Endesa · J19','Barça – Asisa Joventut','',false,''],
    ['2027-01-31','31/01/2027 · 12:00','Liga Endesa · J20','Asisa Joventut – FIATC Girona','',false,''],
    ['2027-02-07','07/02/2027 · 18:00','Liga Endesa · J21','Valencia Basket – Asisa Joventut','',false,''],
    ['2027-02-14','14/02/2027 · 12:00','Liga Endesa · J22','Asisa Joventut – Río Breogán','',false,''],
    ['2027-03-07','07/03/2027 · 17:00','Liga Endesa · J23','Asisa Joventut – Unicaja','',false,''],
    ['2027-03-14','14/03/2027 · 12:30','Liga Endesa · J24','Casademont Zaragoza – Asisa Joventut','',false,''],
    ['2027-03-20','20/03/2027 · 19:30','Liga Endesa · J25','Monbus Obradoiro – Asisa Joventut','',false,''],
    ['2027-03-27','27/03/2027 · 18:00','Liga Endesa · J26','Asisa Joventut – Recoletas Salud San Pablo Burgos','',false,''],
    ['2027-04-04','04/04/2027 · 17:00','Liga Endesa · J27','Asisa Joventut – Real Madrid','',false,''],
    ['2027-04-11','11/04/2027 · 12:00','Liga Endesa · J28','iLERNA Lleida – Asisa Joventut','',false,''],
    ['2027-04-18','18/04/2027 · 17:00','Liga Endesa · J29','Asisa Joventut – La Laguna Tenerife','',false,''],
    ['2027-04-25','25/04/2027 · 12:00','Liga Endesa · J30','MoraBanc Andorra – Asisa Joventut','',false,''],
    ['2027-05-02','02/05/2027 · 17:00','Liga Endesa · J31','Asisa Joventut – Kosner Baskonia','',false,''],
    ['2027-05-09','09/05/2027 · 12:00','Liga Endesa · J32','Leyma Coruña – Asisa Joventut','',false,''],
    ['2027-05-16','16/05/2027 · 17:00','Liga Endesa · J33','Asisa Joventut – UCAM Murcia','',false,''],
    ['2027-05-21','21/22/23-05-2027 · hora pendent','Liga Endesa · J34','Kids&Us Manresa – Asisa Joventut','',false,'']
  ].map(([key,date,competition,matchup,score,played,statsUrl]) => ({ key,date,competition,matchup,score,played,statsUrl }));

  const DEFAULT_STATS_CONFIG = {
    last_game_options: [1, 3, 5, 7, 9],
    expanded_button_label: 'Estadístiques ampliades',
    compact_columns: [
      { key: 'games', label: 'PJ', kind: 'games', width: 38 },
      { key: 'minutes', label: 'MIN', kind: 'avg_seconds', field: 'minutes_seconds', decimals: 1, width: 46 },
      { key: 'points', label: 'PTS', kind: 'avg', field: 'points', decimals: 1, width: 44 },
      { key: 'rebounds', label: 'REB', kind: 'avg', field: 'rebounds', decimals: 1, width: 44 },
      { key: 'assists', label: 'AST', kind: 'avg', field: 'assists', decimals: 1, width: 44 },
      { key: 'valuation', label: 'VAL', kind: 'avg', field: 'valuation', decimals: 1, width: 44 }
    ],
    expanded_columns: [
      { key: 'number', label: 'Nº', kind: 'latest_text', field: 'jersey_number', decimals: 0, width: 34 },
      { key: 'games', label: 'PJ', kind: 'games', decimals: 0, width: 34 },
      { key: 'minutes', label: 'MIN', kind: 'avg_seconds', field: 'minutes_seconds', decimals: 1, width: 43 },
      { key: 'points', label: 'PTS', kind: 'avg', field: 'points', decimals: 1, width: 40 },
      { key: 't2_ai', label: 'T2', kind: 'pair_avg', made_field: 'two_made', attempted_field: 'two_attempted', decimals: 1, width: 60 },
      { key: 't2_pct', label: 'T2%', kind: 'ratio_pct', made_field: 'two_made', attempted_field: 'two_attempted', decimals: 1, width: 47 },
      { key: 't3_ai', label: 'T3', kind: 'pair_avg', made_field: 'three_made', attempted_field: 'three_attempted', decimals: 1, width: 60 },
      { key: 't3_pct', label: 'T3%', kind: 'ratio_pct', made_field: 'three_made', attempted_field: 'three_attempted', decimals: 1, width: 47 },
      { key: 'tl_ai', label: 'TL', kind: 'pair_avg', made_field: 'free_made', attempted_field: 'free_attempted', decimals: 1, width: 60 },
      { key: 'tl_pct', label: 'TL%', kind: 'ratio_pct', made_field: 'free_made', attempted_field: 'free_attempted', decimals: 1, width: 47 },
      { key: 'def_reb', label: 'RD', kind: 'avg', field: 'defensive_rebounds', decimals: 1, width: 40 },
      { key: 'off_reb', label: 'RO', kind: 'avg', field: 'offensive_rebounds', decimals: 1, width: 40 },
      { key: 'rebounds', label: 'REB', kind: 'avg', field: 'rebounds', decimals: 1, width: 44 },
      { key: 'assists', label: 'AST', kind: 'avg', field: 'assists', decimals: 1, width: 42 },
      { key: 'steals', label: 'REC', kind: 'avg', field: 'steals', decimals: 1, width: 42 },
      { key: 'turnovers', label: 'PÈR', kind: 'avg', field: 'turnovers', decimals: 1, width: 42 },
      { key: 'blocks', label: 'TAP', kind: 'avg', field: 'blocks', decimals: 1, width: 42 },
      { key: 'blocks_received', label: 'TR', kind: 'avg', field: 'blocks_received', decimals: 1, width: 40 },
      { key: 'dunks', label: 'MAT', kind: 'avg', field: 'dunks', decimals: 1, width: 42 },
      { key: 'fouls_committed', label: 'FP', kind: 'avg', field: 'fouls_committed', decimals: 1, width: 40 },
      { key: 'fouls_received', label: 'FR', kind: 'avg', field: 'fouls_received', decimals: 1, width: 40 },
      { key: 'valuation', label: 'VAL', kind: 'avg', field: 'valuation', decimals: 1, width: 44 },
      { key: 'plus_minus', label: '+/-', kind: 'sum', field: 'plus_minus', decimals: 0, signed: true, width: 44 }
    ]
  };

  const statsState = {
    rows: null,
    uiConfig: DEFAULT_STATS_CONFIG,
    competition: 'Totes',
    lastGames: null,
    expanded: false,
    sortKey: 'valuation',
    sortDirection: 'desc'
  };

  function localDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function gameDay(game) {
    return game.key.slice(0, 10);
  }

  function injectUi() {
    const actions = document.querySelector('.header-actions');

    if (actions && !document.getElementById('calendar-open')) {
      const calendar = document.createElement('button');
      calendar.id = 'calendar-open';
      calendar.type = 'button';
      calendar.className = 'header-button feature-header-button';
      calendar.textContent = 'Calendari';
      actions.prepend(calendar);
    }

    if (actions && !document.getElementById('stats-open')) {
      const stats = document.createElement('button');
      stats.id = 'stats-open';
      stats.type = 'button';
      stats.className = 'header-button feature-header-button';
      stats.textContent = 'Estadístiques Temporada';
      actions.append(stats);
    }

    if (!document.getElementById('calendar-modal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="calendar-modal" class="feature-modal-backdrop" hidden>
          <section class="feature-modal calendar-modal-card" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
            <div class="feature-modal-heading">
              <div><p class="feature-kicker">SEMPRE PENYA</p><h2 id="calendar-title">Calendari</h2></div>
              <button class="feature-close" id="calendar-close" type="button" aria-label="Tanca">×</button>
            </div>
            <p id="calendar-message" class="feature-inline-message" hidden></p>
            <div id="calendar-list" class="calendar-list" aria-live="polite"></div>
          </section>
        </div>

        <div id="stats-modal" class="feature-modal-backdrop" hidden>
          <section class="feature-modal stats-modal-card" role="dialog" aria-modal="true" aria-labelledby="stats-title">
            <div class="feature-modal-heading">
              <div><p class="feature-kicker">SEMPRE PENYA</p><h2 id="stats-title">Estadístiques Temporada</h2></div>
              <button class="feature-close" id="stats-close" type="button" aria-label="Tanca">×</button>
            </div>

            <div class="stats-controls">
              <div>
                <p class="stats-control-label">Competició</p>
                <div class="stats-chip-row" id="stats-competition">
                  <button type="button" data-competition="Totes">Totes</button>
                  <button type="button" data-competition="ACB">ACB</button>
                  <button type="button" data-competition="BCL">BCL</button>
                </div>
              </div>
              <div>
                <p class="stats-control-label">Darrers partits</p>
                <div class="stats-scope-row">
                  <button type="button" id="stats-expanded" class="stats-expand-toggle">Estadístiques ampliades</button>
                  <div class="stats-chip-row stats-last-games" id="stats-last-games"></div>
                </div>
              </div>
            </div>

            <p id="stats-summary" class="stats-summary">Carregant estadístiques…</p>
            <p id="stats-message" class="feature-inline-message" hidden></p>
            <div class="stats-table-wrap">
              <table class="stats-table" id="stats-table" aria-label="Mitjanes dels jugadors">
                <thead id="stats-head"></thead>
                <tbody id="stats-body"></tbody>
              </table>
            </div>          </section>
        </div>`);
    }
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('feature-modal-open');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    if (![...document.querySelectorAll('.feature-modal-backdrop')].some((el) => !el.hidden)) {
      document.body.classList.remove('feature-modal-open');
    }
  }

  async function loadCalendar() {
    const message = document.getElementById('calendar-message');
    const list = document.getElementById('calendar-list');
    if (!list) return;
    list.innerHTML = '<p class="calendar-loading">Actualitzant calendari…</p>';
    list.style.maxHeight = 'min(65vh, 560px)';
    list.style.overflowY = 'auto';
    list.style.overscrollBehavior = 'contain';
    list.style.paddingRight = '4px';
    if (message) message.hidden = true;

    let remoteRows = null;
    try {
      const response = await fetch(CALENDAR_URL, {
        cache: 'no-store',
        headers: { apikey: PUBLIC_KEY, Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('Resposta de calendari invàlida');
      remoteRows = rows;
    } catch (error) {
      console.warn('Calendar remote unavailable', error);
      if (message) {
        message.textContent = 'No s’ha pogut carregar el calendari remot. Mostro la còpia de seguretat del web.';
        message.dataset.kind = 'warning';
        message.hidden = false;
      }
    }

    const games = remoteRows !== null
      ? remoteRows
          .filter((row) => row.visible !== false)
          .map((row) => ({
            key: String(row.game_key || ''),
            date: String(row.date_text || row.game_date || ''),
            competition: String(row.competition || ''),
            matchup: String(row.matchup || ''),
            score: String(row.score || '').trim(),
            played: Boolean(row.played),
            statsUrl: String(row.stats_url || '').trim(),
            sortOrder: Number(row.sort_order || 0)
          }))
          .filter((game) => game.key && game.date && game.matchup)
          .sort((x, y) => (x.sortOrder - y.sortOrder) || x.key.localeCompare(y.key))
      : seasonGames.map((game, index) => ({ ...game, sortOrder: index }));

    const today = localDateKey();
    const future = games.filter((game) => !game.played && gameDay(game) >= today);
    const next = future[0] || null;
    const nextDay = next ? gameDay(next) : '9999-12-31';
    const playedBeforeNext = games.filter((game) => game.played && gameDay(game) < nextDay);
    const previous = playedBeforeNext.slice(-2);
    const older = playedBeforeNext.slice(0, -2);
    const later = next ? future.slice(1) : [];

    list.replaceChildren();
    if (older.length) {
      list.append(sectionLabel('Partits anteriors'));
      older.forEach((game) => list.append(gameCard(game, false)));
    }

    let focusAnchor = null;
    if (previous.length) {
      focusAnchor = sectionLabel('Darrers partits');
      focusAnchor.dataset.calendarFocus = 'true';
      list.append(focusAnchor);
      previous.forEach((game) => list.append(gameCard(game, false)));
    }
    if (next) {
      list.append(sectionLabel('Següent partit'));
      list.append(gameCard(next, true));
    }
    if (later.length) {
      list.append(sectionLabel('Pròxims partits'));
      later.forEach((game) => list.append(gameCard(game, false)));
    }
    if (!playedBeforeNext.length && !next && !later.length) {
      list.innerHTML = '<p class="calendar-loading">No hi ha més partits programats.</p>';
      return;
    }

    requestAnimationFrame(() => {
      if (!focusAnchor || !older.length) {
        list.scrollTop = 0;
        return;
      }
      const listRect = list.getBoundingClientRect();
      const anchorRect = focusAnchor.getBoundingClientRect();
      list.scrollTop += anchorRect.top - listRect.top - 2;
    });
  }

  function sectionLabel(text) {
    const el = document.createElement('div');
    el.className = 'calendar-section-label';
    el.textContent = text;
    return el;
  }

  function gameCard(game, isNext) {
    const card = document.createElement(game.played && game.statsUrl ? 'a' : 'article');
    card.className = `calendar-game${isNext ? ' next' : ''}${game.played ? ' played' : ''}`;
    if (card.tagName === 'A') {
      card.href = game.statsUrl;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.title = 'Obre les estadístiques del partit';
    }

    const main = document.createElement('div');
    main.className = 'calendar-game-main';
    const date = document.createElement('div');
    date.className = 'calendar-game-date';
    date.textContent = game.date;
    const matchup = document.createElement('div');
    matchup.className = 'calendar-game-matchup';
    matchup.textContent = game.matchup;
    const competition = document.createElement('div');
    competition.className = 'calendar-game-competition';
    competition.textContent = game.competition;
    main.append(date, matchup, competition);

    const side = document.createElement('div');
    side.className = 'calendar-game-side';
    if (game.played) {
      const score = document.createElement('strong');
      score.className = 'calendar-score';
      score.textContent = game.score || 'Final';
      side.append(score);
      if (game.statsUrl) {
        const stats = document.createElement('span');
        stats.className = 'calendar-stats';
        stats.textContent = 'Estadístiques →';
        side.append(stats);
      }
    } else {
      const pending = document.createElement('span');
      pending.className = 'calendar-pending';
      pending.textContent = isNext ? 'SEGÜENT' : 'Pendent';
      side.append(pending);
    }
    card.append(main, side);
    return card;
  }

  function formatNumber(value, decimals = 1) {
    return new Intl.NumberFormat('ca-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number.isFinite(value) ? value : 0);
  }

  function normalizeColumn(item) {
    if (!item || typeof item !== 'object') return null;
    const key = String(item.key || '').trim();
    const label = String(item.label || '').trim();
    const kind = String(item.kind || '').trim();
    if (!key || !label || !kind) return null;
    return {
      key,
      label,
      kind,
      field: String(item.field || ''),
      made_field: String(item.made_field || ''),
      attempted_field: String(item.attempted_field || ''),
      decimals: Math.min(2, Math.max(0, Number(item.decimals ?? 1) || 0)),
      signed: Boolean(item.signed),
      width: Math.min(90, Math.max(30, Number(item.width || 44) || 44))
    };
  }

  function normalizeStatsConfig(rawConfig) {
    const raw = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
    const options = Array.isArray(raw.last_game_options)
      ? [...new Set(raw.last_game_options.map(Number).filter((n) => Number.isInteger(n) && n > 0))]
      : [];
    const compact = Array.isArray(raw.compact_columns)
      ? raw.compact_columns.map(normalizeColumn).filter(Boolean)
      : [];
    const expanded = Array.isArray(raw.expanded_columns)
      ? raw.expanded_columns.map(normalizeColumn).filter(Boolean)
      : [];

    return {
      last_game_options: options.length ? options : DEFAULT_STATS_CONFIG.last_game_options,
      expanded_button_label: String(raw.expanded_button_label || '').trim() || DEFAULT_STATS_CONFIG.expanded_button_label,
      compact_columns: compact.length ? compact : DEFAULT_STATS_CONFIG.compact_columns,
      expanded_columns: expanded.length ? expanded : DEFAULT_STATS_CONFIG.expanded_columns
    };
  }

  function currentStatsColumns() {
    return statsState.expanded
      ? statsState.uiConfig.expanded_columns
      : statsState.uiConfig.compact_columns;
  }

  function rowNumber(row, field) {
    const value = Number(row?.[field]);
    return Number.isFinite(value) ? value : 0;
  }

  function latestPlayerRow(rows) {
    return rows.reduce((latest, row) => {
      if (!latest) return row;
      return String(row.game_date || '') > String(latest.game_date || '') ? row : latest;
    }, null);
  }

  function aggregateColumn(column, rows, games, latest) {
    const decimals = Number(column.decimals ?? 1);
    if (column.kind === 'games') {
      return { display: String(games), sortValue: games };
    }
    if (column.kind === 'avg_seconds') {
      const value = rows.reduce((sum, row) => sum + rowNumber(row, column.field), 0) / games / 60;
      return { display: formatNumber(value, decimals), sortValue: value };
    }
    if (column.kind === 'avg') {
      const value = rows.reduce((sum, row) => sum + rowNumber(row, column.field), 0) / games;
      return { display: formatNumber(value, decimals), sortValue: value };
    }
    if (column.kind === 'sum') {
      const value = rows.reduce((sum, row) => sum + rowNumber(row, column.field), 0);
      const display = column.signed && value > 0 ? `+${value}` : String(value);
      return { display, sortValue: value };
    }
    if (column.kind === 'count_true') {
      const value = rows.filter((row) => Boolean(row?.[column.field])).length;
      return { display: String(value), sortValue: value };
    }
    if (column.kind === 'latest_text') {
      const display = String(latest?.[column.field] ?? '').trim() || '—';
      const numeric = Number(String(display).replace(',', '.'));
      return { display, sortValue: Number.isFinite(numeric) ? numeric : display };
    }
    if (column.kind === 'pair_avg') {
      const made = rows.reduce((sum, row) => sum + rowNumber(row, column.made_field), 0) / games;
      const attempted = rows.reduce((sum, row) => sum + rowNumber(row, column.attempted_field), 0) / games;
      return {
        display: `${formatNumber(made, decimals)}/${formatNumber(attempted, decimals)}`,
        sortValue: made,
        secondarySortValue: attempted
      };
    }
    if (column.kind === 'ratio_pct') {
      const made = rows.reduce((sum, row) => sum + rowNumber(row, column.made_field), 0);
      const attempted = rows.reduce((sum, row) => sum + rowNumber(row, column.attempted_field), 0);
      const value = attempted > 0 ? made * 100 / attempted : 0;
      return { display: formatNumber(value, decimals), sortValue: value };
    }
    return { display: '—', sortValue: 0 };
  }

  function statsResult() {
    const columns = currentStatsColumns();
    const filtered = (statsState.rows || []).filter((row) =>
      statsState.competition === 'Totes' || row.competition === statsState.competition
    );

    const gameMap = new Map();
    filtered.forEach((row) => {
      const key = `${row.competition}|${row.game_key}`;
      if (!gameMap.has(key)) gameMap.set(key, String(row.game_date || row.game_key || ''));
    });

    const allGames = [...gameMap.entries()].sort((a, b) => b[1].localeCompare(a[1]));
    const selectedGames = (statsState.lastGames == null
      ? allGames
      : allGames.slice(0, Math.max(1, statsState.lastGames))
    ).map(([key]) => key);

    const selectedSet = new Set(selectedGames);
    const byPlayer = new Map();

    filtered.forEach((row) => {
      const gameKey = `${row.competition}|${row.game_key}`;
      const minutesSeconds = rowNumber(row, 'minutes_seconds');
      if (!selectedSet.has(gameKey) || minutesSeconds <= 0) return;

      const key = String(row.player_key || row.player_name || '').trim();
      if (!key) return;
      if (!byPlayer.has(key)) byPlayer.set(key, []);
      byPlayer.get(key).push(row);
    });

    const players = [...byPlayer.entries()].map(([key, playerRows]) => {
      const clean = playerRows.filter((row) => String(row.player_name || '').trim());
      const games = clean.length;
      const latest = latestPlayerRow(clean);
      const values = {};
      const sortValues = {};
      const secondarySortValues = {};
      columns.forEach((column) => {
        const agg = aggregateColumn(column, clean, games, latest);
        values[column.key] = agg.display;
        sortValues[column.key] = agg.sortValue;
        secondarySortValues[column.key] = agg.secondarySortValue ?? null;
      });
      return {
        key,
        name: String(latest?.player_name || ''),
        values,
        sortValues,
        secondarySortValues
      };
    });

    const direction = statsState.sortDirection === 'asc' ? 1 : -1;
    const collator = new Intl.Collator('ca', { sensitivity: 'base', numeric: true });
    players.sort((a, b) => {
      if (statsState.sortKey === '__name__') {
        return collator.compare(a.name, b.name) * direction;
      }
      const av = a.sortValues[statsState.sortKey];
      const bv = b.sortValues[statsState.sortKey];
      if (typeof av === 'number' && typeof bv === 'number' && av !== bv) {
        return (av - bv) * direction;
      }
      if (String(av ?? '') !== String(bv ?? '')) {
        return collator.compare(String(av ?? ''), String(bv ?? '')) * direction;
      }
      const as = a.secondarySortValues[statsState.sortKey];
      const bs = b.secondarySortValues[statsState.sortKey];
      if (typeof as === 'number' && typeof bs === 'number' && as !== bs) {
        return (as - bs) * direction;
      }
      const aval = Number(a.sortValues.valuation ?? 0);
      const bval = Number(b.sortValues.valuation ?? 0);
      if (aval !== bval) return bval - aval;
      return collator.compare(a.name, b.name);
    });

    return { games: selectedGames.length, players, columns };
  }

  function setSort(key) {
    if (!key) return;
    if (statsState.sortKey === key) {
      statsState.sortDirection = statsState.sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      statsState.sortKey = key;
      statsState.sortDirection = key === '__name__' ? 'asc' : 'desc';
    }
    renderStats();
  }

  function renderSortButton(th, label, key) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stats-sort-button';
    button.dataset.statsSortKey = key;
    const active = statsState.sortKey === key;
    button.textContent = active
      ? `${label} ${statsState.sortDirection === 'desc' ? '↓' : '↑'}`
      : label;
    button.setAttribute('aria-label', active
      ? `${label}, ordre ${statsState.sortDirection === 'desc' ? 'descendent' : 'ascendent'}`
      : `Ordena per ${label}`);
    th.append(button);
    if (active) th.setAttribute('aria-sort', statsState.sortDirection === 'desc' ? 'descending' : 'ascending');
  }

  function renderStatsHeader(columns) {
    const head = document.getElementById('stats-head');
    const table = document.getElementById('stats-table');
    if (!head || !table) return;

    const tr = document.createElement('tr');
    const playerTh = document.createElement('th');
    playerTh.style.minWidth = '116px';
    renderSortButton(playerTh, 'Jugador', '__name__');
    tr.append(playerTh);

    let totalWidth = 116;
    columns.forEach((column) => {
      const th = document.createElement('th');
      th.style.minWidth = `${column.width}px`;
      renderSortButton(th, column.label, column.key);
      tr.append(th);
      totalWidth += column.width;
    });

    head.replaceChildren(tr);
    table.style.minWidth = `${Math.max(650, totalWidth + 24)}px`;
  }

  function renderStatsControls() {
    document.querySelectorAll('[data-competition]').forEach((button) => {
      const selected = button.dataset.competition === statsState.competition;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const expanded = document.getElementById('stats-expanded');
    if (expanded) {
      expanded.textContent = statsState.uiConfig.expanded_button_label;
      expanded.classList.toggle('selected', statsState.expanded);
      expanded.setAttribute('aria-pressed', String(statsState.expanded));
    }

    const lastGames = document.getElementById('stats-last-games');
    if (lastGames) {
      lastGames.replaceChildren();
      statsState.uiConfig.last_game_options.forEach((count) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.lastGames = String(count);
        button.textContent = String(count);
        const selected = statsState.lastGames === count;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        lastGames.append(button);
      });
    }
  }

  function renderStats() {
    renderStatsControls();

    const body = document.getElementById('stats-body');
    const summary = document.getElementById('stats-summary');
    const message = document.getElementById('stats-message');
    if (!body || !summary || !message) return;

    const columns = currentStatsColumns();
    if (statsState.sortKey !== '__name__' && !columns.some((column) => column.key === statsState.sortKey)) {
      statsState.sortKey = columns.some((column) => column.key === 'valuation') ? 'valuation' : '__name__';
      statsState.sortDirection = statsState.sortKey === '__name__' ? 'asc' : 'desc';
    }
    renderStatsHeader(columns);

    if (!Array.isArray(statsState.rows)) {
      summary.textContent = 'Carregant estadístiques…';
      body.replaceChildren();
      return;
    }

    const result = statsResult();
    const scope = statsState.lastGames == null
      ? 'Mitjanes temporada'
      : `Mitjanes darrers ${statsState.lastGames} partits`;
    summary.textContent = `${scope} · ${result.games} partit${result.games === 1 ? '' : 's'} disponible${result.games === 1 ? '' : 's'}`;

    body.replaceChildren();
    if (!result.players.length) {
      message.textContent = statsState.competition === 'BCL'
        ? 'Encara no hi ha partits BCL amb estadístiques disponibles.'
        : 'Encara no hi ha estadístiques disponibles per a aquest filtre.';
      message.dataset.kind = 'warning';
      message.hidden = false;
      return;
    }
    message.hidden = true;

    result.players.forEach((player) => {
      const tr = document.createElement('tr');

      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = player.name;
      name.style.minWidth = '116px';
      tr.append(name);

      result.columns.forEach((column) => {
        const td = document.createElement('td');
        td.textContent = player.values[column.key] || '—';
        td.style.minWidth = `${column.width}px`;
        if (column.key === 'valuation') td.classList.add('stats-valuation');
        tr.append(td);
      });
      body.append(tr);
    });
  }

  async function loadStats() {
    if (Array.isArray(statsState.rows)) {
      renderStats();
      return;
    }

    const message = document.getElementById('stats-message');
    if (message) message.hidden = true;
    renderStats();

    const headers = { apikey: PUBLIC_KEY, Accept: 'application/json' };
    const configPromise = fetch(STATS_CONFIG_URL, { cache: 'no-store', headers })
      .then((response) => {
        if (!response.ok) throw new Error(`Config HTTP ${response.status}`);
        return response.json();
      })
      .then((rows) => normalizeStatsConfig(Array.isArray(rows) && rows[0] ? rows[0].config : null))
      .catch((error) => {
        console.warn('Season stats config unavailable; using fallback', error);
        return normalizeStatsConfig(DEFAULT_STATS_CONFIG);
      });

    const rowsPromise = fetch(STATS_URL, { cache: 'no-store', headers })
      .then((response) => {
        if (!response.ok) throw new Error(`Stats HTTP ${response.status}`);
        return response.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows)) throw new Error('Resposta d’estadístiques invàlida');
        return rows;
      });

    try {
      const [uiConfig, rows] = await Promise.all([configPromise, rowsPromise]);
      statsState.uiConfig = uiConfig;
      if (statsState.lastGames != null && !uiConfig.last_game_options.includes(statsState.lastGames)) {
        statsState.lastGames = null;
      }
      statsState.rows = rows;
      renderStats();
    } catch (error) {
      console.error('Season stats unavailable', error);
      statsState.rows = [];
      const summary = document.getElementById('stats-summary');
      if (summary) summary.textContent = 'Estadístiques no disponibles';
      if (message) {
        message.textContent = 'No s’han pogut carregar les estadístiques. Torna-ho a provar més tard.';
        message.dataset.kind = 'error';
        message.hidden = false;
      }
    }
  }
  function bindUi() {
    const calendarOpen = document.getElementById('calendar-open');
    const statsOpen = document.getElementById('stats-open');
    const calendarClose = document.getElementById('calendar-close');
    const statsClose = document.getElementById('stats-close');
    const calendarModal = document.getElementById('calendar-modal');
    const statsModal = document.getElementById('stats-modal');

    calendarOpen?.addEventListener('click', () => {
      openModal('calendar-modal');
      loadCalendar();
    });
    statsOpen?.addEventListener('click', () => {
      openModal('stats-modal');
      loadStats();
    });

    calendarClose?.addEventListener('click', () => closeModal('calendar-modal'));
    statsClose?.addEventListener('click', () => closeModal('stats-modal'));
    calendarModal?.addEventListener('click', (event) => {
      if (event.target === calendarModal) closeModal('calendar-modal');
    });
    statsModal?.addEventListener('click', (event) => {
      if (event.target === statsModal) closeModal('stats-modal');
    });

    document.querySelectorAll('[data-competition]').forEach((button) => {
      button.addEventListener('click', () => {
        statsState.competition = button.dataset.competition || 'Totes';
        renderStats();
      });
    });
    document.getElementById('stats-expanded')?.addEventListener('click', () => {
      statsState.expanded = !statsState.expanded;
      renderStats();
    });

    document.getElementById('stats-last-games')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-last-games]');
      if (!button) return;
      const count = Number(button.dataset.lastGames);
      if (!Number.isInteger(count) || count <= 0) return;
      statsState.lastGames = statsState.lastGames === count ? null : count;
      renderStats();
    });

    document.getElementById('stats-head')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-stats-sort-key]');
      if (!button) return;
      setSort(button.dataset.statsSortKey || '');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (calendarModal && !calendarModal.hidden) closeModal('calendar-modal');
      if (statsModal && !statsModal.hidden) closeModal('stats-modal');
    });
  }

  function start() {
    injectUi();
    bindUi();
    renderStats();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
