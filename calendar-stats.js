/* SEMPRE PENYA — calendari compartit amb Supabase + estadístiques de temporada. */
(() => {
  const SUPABASE_URL = 'https://busuaaaamcojjtavhrne.supabase.co';
  const PUBLIC_KEY = 'sb_publishable_OTXxn8gyKvPzbhTPudOj9g_Ab79QJl8';
  const CALENDAR_URL = `${SUPABASE_URL}/rest/v1/calendar_results?select=game_key,game_date,date_text,competition,matchup,score,played,stats_url,sort_order,visible&order=sort_order.asc`;
  const STATS_URL = `${SUPABASE_URL}/rest/v1/season_player_game_stats?select=game_key,game_date,competition,player_key,player_name,minutes_seconds,points,rebounds,assists,valuation&order=game_date.desc`;

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

  const statsState = {
    rows: null,
    competition: 'Totes',
    lastGames: 10
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
                <div class="stats-chip-row stats-last-games" id="stats-last-games">
                  ${Array.from({ length: 10 }, (_, i) => `<button type="button" data-last-games="${i + 1}">${i + 1}</button>`).join('')}
                </div>
              </div>
            </div>

            <p id="stats-summary" class="stats-summary">Carregant estadístiques…</p>
            <p id="stats-message" class="feature-inline-message" hidden></p>
            <div class="stats-table-wrap">
              <table class="stats-table" aria-label="Mitjanes dels jugadors">
                <thead>
                  <tr><th>Jugador</th><th>PJ</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>VAL</th></tr>
                </thead>
                <tbody id="stats-body"></tbody>
              </table>
            </div>
          </section>
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

  function oneDecimal(value) {
    return new Intl.NumberFormat('ca-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }

  function statsResult() {
    const filtered = (statsState.rows || []).filter((row) =>
      statsState.competition === 'Totes' || row.competition === statsState.competition
    );

    const gameMap = new Map();
    filtered.forEach((row) => {
      const key = `${row.competition}|${row.game_key}`;
      if (!gameMap.has(key)) gameMap.set(key, String(row.game_date || row.game_key || ''));
    });

    const selectedGames = [...gameMap.entries()]
      .sort((x, y) => y[1].localeCompare(x[1]))
      .slice(0, statsState.lastGames)
      .map(([key]) => key);

    const selectedSet = new Set(selectedGames);
    const byPlayer = new Map();

    filtered.forEach((row) => {
      const gameKey = `${row.competition}|${row.game_key}`;
      const minutesSeconds = Number(row.minutes_seconds || 0);
      if (!selectedSet.has(gameKey) || minutesSeconds <= 0) return;

      const key = String(row.player_key || row.player_name || '').trim();
      if (!key) return;
      const current = byPlayer.get(key) || {
        playerName: String(row.player_name || ''),
        games: 0,
        minutesSeconds: 0,
        points: 0,
        rebounds: 0,
        assists: 0,
        valuation: 0
      };
      current.playerName = String(row.player_name || current.playerName);
      current.games += 1;
      current.minutesSeconds += minutesSeconds;
      current.points += Number(row.points || 0);
      current.rebounds += Number(row.rebounds || 0);
      current.assists += Number(row.assists || 0);
      current.valuation += Number(row.valuation || 0);
      byPlayer.set(key, current);
    });

    const players = [...byPlayer.entries()].map(([key, row]) => ({
      key,
      name: row.playerName,
      games: row.games,
      minutes: row.minutesSeconds / row.games / 60,
      points: row.points / row.games,
      rebounds: row.rebounds / row.games,
      assists: row.assists / row.games,
      valuation: row.valuation / row.games
    })).sort((x, y) =>
      (y.valuation - x.valuation) ||
      (y.points - x.points) ||
      x.name.localeCompare(y.name, 'ca')
    );

    return { games: selectedGames.length, players };
  }

  function renderStats() {
    document.querySelectorAll('[data-competition]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.competition === statsState.competition);
    });
    document.querySelectorAll('[data-last-games]').forEach((button) => {
      button.classList.toggle('selected', Number(button.dataset.lastGames) === statsState.lastGames);
    });

    const body = document.getElementById('stats-body');
    const summary = document.getElementById('stats-summary');
    const message = document.getElementById('stats-message');
    if (!body || !summary || !message) return;

    if (!Array.isArray(statsState.rows)) {
      summary.textContent = 'Carregant estadístiques…';
      body.replaceChildren();
      return;
    }

    const result = statsResult();
    summary.textContent = `Mitjanes · ${result.games} partit${result.games === 1 ? '' : 's'} disponible${result.games === 1 ? '' : 's'}`;

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
      const values = [
        player.name,
        String(player.games),
        oneDecimal(player.minutes),
        oneDecimal(player.points),
        oneDecimal(player.rebounds),
        oneDecimal(player.assists),
        oneDecimal(player.valuation)
      ];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        cell.textContent = value;
        if (index === 0) cell.scope = 'row';
        tr.append(cell);
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

    try {
      const response = await fetch(STATS_URL, {
        cache: 'no-store',
        headers: { apikey: PUBLIC_KEY, Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('Resposta d’estadístiques invàlida');
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
    document.querySelectorAll('[data-last-games]').forEach((button) => {
      button.addEventListener('click', () => {
        statsState.lastGames = Math.min(10, Math.max(1, Number(button.dataset.lastGames) || 10));
        renderStats();
      });
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
