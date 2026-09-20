/* SEMPRE PENYA — calendari compartit amb Supabase + subscripció real al resum diari. */
(() => {
  const SUPABASE_URL = 'https://busuaaaamcojjtavhrne.supabase.co';
  const PUBLIC_KEY = 'sb_publishable_OTXxn8gyKvPzbhTPudOj9g_Ab79QJl8';
  const SUBSCRIBE_URL = `${SUPABASE_URL}/functions/v1/daily-summary-subscription`;
  const CALENDAR_URL = `${SUPABASE_URL}/rest/v1/calendar_results?select=game_key,game_date,date_text,competition,matchup,score,played,stats_url,sort_order,visible&order=sort_order.asc`;
  const EMAIL_KEY = 'sempre_penya_daily_email';
  const ACTIVE_KEY = 'sempre_penya_daily_active';

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

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()) && String(value || '').trim().length <= 254;
  }

  function injectUi() {
    const actions = document.querySelector('.header-actions');
    if (actions && !document.getElementById('calendar-open')) {
      const calendar = document.createElement('button');
      calendar.id = 'calendar-open';
      calendar.type = 'button';
      calendar.className = 'header-button feature-header-button';
      calendar.textContent = 'Calendari';

      const mail = document.createElement('button');
      mail.id = 'mail-open';
      mail.type = 'button';
      mail.className = 'header-button feature-header-button';
      mail.textContent = '✉ Resum per correu';

      actions.prepend(mail);
      actions.prepend(calendar);
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

        <div id="mail-modal" class="feature-modal-backdrop" hidden>
          <section class="feature-modal mail-modal-card" role="dialog" aria-modal="true" aria-labelledby="mail-title">
            <div class="feature-modal-heading">
              <div><p class="feature-kicker">SEMPRE PENYA</p><h2 id="mail-title">Resum diari per correu</h2></div>
              <button class="feature-close" id="mail-close" type="button" aria-label="Tanca">×</button>
            </div>
            <p class="mail-intro">Rep cada matí el resum diari de l’actualitat de la Penya. La subscripció es pot cancel·lar en qualsevol moment.</p>
            <form id="mail-form" novalidate>
              <label class="feature-label" for="mail-email">Correu electrònic</label>
              <input id="mail-email" class="feature-input" type="email" autocomplete="email" placeholder="nom@exemple.com">
              <label class="mail-consent"><input id="mail-consent" type="checkbox"> <span>Accepto que aquest correu s’utilitzi només per enviar-me el resum diari de Sempre Penya.</span></label>
              <p id="mail-feedback" class="feature-inline-message" hidden></p>
              <div class="mail-actions">
                <button id="mail-unsubscribe" class="mail-unsubscribe" type="button">Donar-me de baixa</button>
                <button id="mail-submit" class="mail-submit" type="submit">Vull rebre’l</button>
              </div>
            </form>
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
      if (!Array.isArray(rows) || !rows.length) throw new Error('Calendari remot buit');
      remoteRows = rows;
    } catch (error) {
      console.warn('Calendar remote unavailable', error);
      if (message) {
        message.textContent = 'No s’ha pogut carregar el calendari remot. Mostro la còpia de seguretat de l’app.';
        message.dataset.kind = 'warning';
        message.hidden = false;
      }
    }

    const games = remoteRows
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
          .sort((a, b) => (a.sortOrder - b.sortOrder) || a.key.localeCompare(b.key))
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

  function setMailFeedback(text, kind = 'ok') {
    const feedback = document.getElementById('mail-feedback');
    if (!feedback) return;
    feedback.textContent = text;
    feedback.dataset.kind = kind;
    feedback.hidden = false;
  }

  function updateMailButtons() {
    const email = document.getElementById('mail-email');
    const consent = document.getElementById('mail-consent');
    const submit = document.getElementById('mail-submit');
    const unsubscribe = document.getElementById('mail-unsubscribe');
    if (!email || !consent || !submit || !unsubscribe) return;
    const valid = validEmail(email.value);
    submit.disabled = !(valid && consent.checked);
    unsubscribe.disabled = !valid;
  }

  async function subscriptionRequest(action) {
    const emailInput = document.getElementById('mail-email');
    const submit = document.getElementById('mail-submit');
    const unsubscribe = document.getElementById('mail-unsubscribe');
    if (!emailInput) return;
    const email = emailInput.value.trim().toLowerCase();
    if (!validEmail(email)) {
      setMailFeedback('Escriu una adreça de correu vàlida.', 'error');
      return;
    }

    if (submit) submit.disabled = true;
    if (unsubscribe) unsubscribe.disabled = true;
    setMailFeedback(action === 'subscribe' ? 'Activant la subscripció…' : 'Tramitant la baixa…', 'working');

    try {
      const response = await fetch(SUBSCRIBE_URL, {
        method: 'POST',
        headers: {
          apikey: PUBLIC_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ email, action, source: 'web', daily_summary: true })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

      if (action === 'subscribe') {
        localStorage.setItem(EMAIL_KEY, email);
        localStorage.setItem(ACTIVE_KEY, '1');
        setMailFeedback(`Subscripció activada per a ${email}. Rebràs el resum diari de Sempre Penya.`, 'ok');
      } else {
        localStorage.setItem(EMAIL_KEY, email);
        localStorage.setItem(ACTIVE_KEY, '0');
        setMailFeedback(`Baixa tramitada per a ${email}. No rebràs els pròxims resums.`, 'ok');
      }
    } catch (error) {
      console.error('Mail subscription error', error);
      setMailFeedback('No s’ha pogut completar l’operació. Torna-ho a provar.', 'error');
    } finally {
      updateMailButtons();
    }
  }

  function bindUi() {
    const calendarOpen = document.getElementById('calendar-open');
    const mailOpen = document.getElementById('mail-open');
    const calendarClose = document.getElementById('calendar-close');
    const mailClose = document.getElementById('mail-close');
    const calendarModal = document.getElementById('calendar-modal');
    const mailModal = document.getElementById('mail-modal');
    const mailForm = document.getElementById('mail-form');
    const email = document.getElementById('mail-email');
    const consent = document.getElementById('mail-consent');
    const unsubscribe = document.getElementById('mail-unsubscribe');

    calendarOpen?.addEventListener('click', () => { openModal('calendar-modal'); loadCalendar(); });
    mailOpen?.addEventListener('click', () => {
      const saved = localStorage.getItem(EMAIL_KEY) || '';
      if (email && !email.value) email.value = saved;
      if (consent && localStorage.getItem(ACTIVE_KEY) === '1') consent.checked = true;
      const feedback = document.getElementById('mail-feedback');
      if (feedback) feedback.hidden = true;
      updateMailButtons();
      openModal('mail-modal');
      setTimeout(() => email?.focus(), 0);
    });
    calendarClose?.addEventListener('click', () => closeModal('calendar-modal'));
    mailClose?.addEventListener('click', () => closeModal('mail-modal'));
    calendarModal?.addEventListener('click', (event) => { if (event.target === calendarModal) closeModal('calendar-modal'); });
    mailModal?.addEventListener('click', (event) => { if (event.target === mailModal) closeModal('mail-modal'); });
    email?.addEventListener('input', updateMailButtons);
    consent?.addEventListener('change', updateMailButtons);
    mailForm?.addEventListener('submit', (event) => { event.preventDefault(); subscriptionRequest('subscribe'); });
    unsubscribe?.addEventListener('click', () => subscriptionRequest('unsubscribe'));
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (calendarModal && !calendarModal.hidden) closeModal('calendar-modal');
      if (mailModal && !mailModal.hidden) closeModal('mail-modal');
    });
  }

  function start() {
    injectUi();
    bindUi();
    updateMailButtons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();