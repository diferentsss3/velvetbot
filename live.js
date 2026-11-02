/* ============================================================
   VELVET — LIVE GAME LOBBY (отдельный модуль)
   На главной в блоке «Игры» — ОДНА карточка «Live game».
   По нажатию открывается вкладка с сеткой live-игр.
   Показывает онлайн игроков в реальном времени.
   Зависит от app.js: $, api, ic, toast, tab
   Подключать ПОСЛЕ slots.js, ДО live-crash.js
   ============================================================ */
(function () {
  'use strict';

  // ---------- СПИСОК LIVE-ИГР ----------
  //  id, title, sub, icon, color, rtp (число|null), tag, ready
  //  onlineKey — ключ из ответа /live/online (например 'crash')
  //  tab — id вкладки ИЛИ open: () => {...}
  // Рабочие игры добавляют себя сами через LiveLobby.add(...) (см. live-crash.js)
  const GAMES = [
    { id: 'soon1', title: 'Скоро', sub: 'Новая live-игра', icon: 'wheel', color: '#c19bff', rtp: null, tag: '', ready: false },
  ];

  const ONL = {}; // последние значения онлайна

  // ---------- СТИЛИ ----------
  const CSS = `
.m8{background:radial-gradient(120% 90% at 50% 130%,#ff9aa8,transparent 62%),linear-gradient(145deg,#5a0f2a,#d9304a)}
.m8 .ic{width:1.45em;height:1.45em}
.bd.live{background:linear-gradient(135deg,#ff3c64,#ff7a3c);color:#fff;display:inline-flex;align-items:center;gap:5px}
.bd.live .pulse-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 6px #fff}
.lv-on{display:inline-flex;align-items:center;gap:5px;color:var(--ok);font-weight:700}
.lv-on .pulse-dot{width:6px;height:6px}
.sc-live{position:absolute;top:9px;right:9px;z-index:2;display:inline-flex;align-items:center;gap:5px;font:800 10px/1 Manrope,system-ui,sans-serif;color:#fff;padding:4px 8px;border-radius:8px;background:linear-gradient(135deg,#ff3c64,#ff7a3c);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.sc-live .pulse-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 6px #fff}
.sc-on{display:flex;align-items:center;justify-content:center;gap:5px;font:700 11px Manrope,system-ui,sans-serif;color:var(--ok);margin-top:2px}
.sc-on .pulse-dot{width:6px;height:6px}
.sc.soon{filter:saturate(.7)}
.sc.soon .sc-go{background:rgba(255,255,255,.1);color:var(--m);border-color:var(--ln);box-shadow:none}
.lv-head{display:flex;align-items:center;gap:10px;margin:0 0 12px}
.lv-head .opt{width:auto;margin:0;padding:0 18px;min-height:40px;flex:none}
.lv-ttl{font:800 17px Manrope,system-ui,sans-serif;color:#fff;display:flex;align-items:center}
`;
  const st = document.createElement('style');
  st.id = 'live-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  // ---------- ИКОНКА ----------
  function injectIcon() {
    if (document.getElementById('i-livetv')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0');
    s.setAttribute('style', 'position:absolute'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML =
      '<defs>' +
      '<linearGradient id="lvG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset="1" stop-color="#e09a10"/></linearGradient>' +
      '<linearGradient id="lvB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5cff"/><stop offset="1" stop-color="#2a0d6e"/></linearGradient>' +
      '</defs>' +
      '<symbol id="i-livetv" viewBox="0 0 100 100">' +
      '<ellipse cx="50" cy="94" rx="32" ry="4" fill="#000" opacity=".28"/>' +
      '<path d="M34 12L50 28L66 12" stroke="url(#lvG)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="8" y="26" width="84" height="58" rx="12" fill="url(#lvB)" stroke="url(#lvG)" stroke-width="4"/>' +
      '<rect x="15" y="33" width="70" height="44" rx="7" fill="#140a2a"/>' +
      '<path d="M44 44L64 55L44 66Z" fill="#fff"/>' +
      '<circle cx="24" cy="42" r="5" fill="#ff3c64"/><circle cx="24" cy="42" r="8" fill="none" stroke="#ff3c64" stroke-opacity=".5" stroke-width="2"/>' +
      '<ellipse cx="32" cy="38" rx="16" ry="5" fill="#fff" opacity=".12"/>' +
      '</symbol>';
    document.body.insertBefore(s, document.body.firstChild);
  }

  // ---------- КАРТОЧКА НА ГЛАВНОЙ ----------
  function mountHomeCard() {
    if (document.getElementById('live-entry')) return;
    const modes = document.querySelector('#t-h .modes');
    if (!modes) return;
    const card = document.createElement('div');
    card.className = 'mc wide';
    card.id = 'live-entry';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.innerHTML =
      '<em class="bd live"><i class="pulse-dot"></i>LIVE</em>' +
      '<div class="pn m8"><span><svg class="ic"><use href="#i-livetv"/></svg></span></div>' +
      '<div><b>Live game</b><small>Игры в реальном времени · ' +
      '<span class="lv-on"><i class="pulse-dot"></i><b id="live-entry-online">0</b> онлайн</span></small></div>';
    const go = () => openLobby();
    card.onclick = go;
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    modes.appendChild(card);
  }

  // ---------- ВКЛАДКА С СЕТКОЙ ----------
  function mountLobbyTab() {
    if (document.getElementById('t-lv')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const sec = document.createElement('section');
    sec.className = 'tab';
    sec.id = 't-lv';
    sec.innerHTML =
      '<div class="lv-head">' +
        '<button class="opt" id="lv-back">← Назад</button>' +
        '<div class="lv-ttl">Live game<i class="live"></i></div>' +
      '</div>' +
      '<div class="sc-grid" id="live-lobby"></div>';
    main.appendChild(sec);
    document.getElementById('lv-back').onclick = () => { goTab('h'); };
  }

  const CORE_TABS = ['h', 's', 'b', 'p', 'e', 'a'];
  function goTab(t) {
    if (typeof tab === 'function') tab(t);
    // для вкладок лобби/игр подсвечиваем «Главная»
    if (CORE_TABS.indexOf(t) < 0) {
      document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === 'h'));
    }
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  function openLobby() {
    try { if (typeof h === 'function') h('light'); } catch (e) { }
    render();
    goTab('lv');
    pollOnline();
  }

  // ---------- ОНЛАЙН В РЕАЛЬНОМ ВРЕМЕНИ ----------
  function applyOnline() {
    document.querySelectorAll('[data-on]').forEach(el => { el.textContent = ONL[el.dataset.on] != null ? ONL[el.dataset.on] : 0; });
    const t = document.getElementById('live-entry-online');
    if (t) t.textContent = ONL.total != null ? ONL.total : 0;
  }

  async function pollOnline() {
    const home = document.getElementById('t-h'), lob = document.getElementById('t-lv');
    const visible = (home && home.classList.contains('on')) || (lob && lob.classList.contains('on'));
    if (!visible || typeof api !== 'function') return;
    try {
      const r = await api('/live/online');
      if (!r || !r.ok) return;
      Object.keys(r).forEach(k => { if (k !== 'ok') ONL[k] = r[k]; });
      applyOnline();
    } catch (e) { }
  }
  setInterval(pollOnline, 5000);

  // ---------- РЕНДЕР СЕТКИ ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render() {
    const el = document.getElementById('live-lobby');
    if (!el) return;
    const iconFn = typeof ic === 'function' ? ic : (n => `<svg class="ic"><use href="#i-${n}"/></svg>`);

    if (!GAMES.length) {
      el.innerHTML = '<p class="note" style="grid-column:1/-1">Live-игр пока нет</p>';
      return;
    }

    // рабочие игры — первыми
    const list = GAMES.slice().sort((a, b) => (b.ready ? 1 : 0) - (a.ready ? 1 : 0));

    el.innerHTML = list.map(g => `
      <div class="sc ${g.ready ? '' : 'soon'}" data-live="${esc(g.id)}" tabindex="0" role="button"
           style="--ac:${esc(g.color || '#c19bff')};--ag:${esc(g.color || '#c19bff')}55">
        <div class="sc-in">
          <div class="sc-art">
            ${g.tag ? `<em class="sc-tag">${esc(g.tag)}</em>` : ''}
            <span class="sc-live"><i class="pulse-dot"></i>LIVE</span>
            <div class="sc-ico">${iconFn(g.icon || 'wheel')}</div>
          </div>
          <div class="sc-info">
            <div class="sc-t">${esc(g.title)}</div>
            <div class="sc-s">${esc(g.sub)}</div>
            ${g.onlineKey ? `<div class="sc-on"><i class="pulse-dot"></i><b data-on="${esc(g.onlineKey)}">0</b> онлайн</div>` : ''}
            <div class="sc-row">
              ${g.rtp != null ? `<span class="sc-rtp">RTP ${esc(g.rtp)}%</span>` : ''}
              <span class="sc-go">${g.ready ? 'Играть' : 'Скоро'}</span>
            </div>
          </div>
        </div>
      </div>`).join('');

    el.querySelectorAll('.sc').forEach(card => {
      const go = () => openGame(card.dataset.live);
      card.onclick = go;
      card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
    applyOnline();
  }

  // ---------- ОТКРЫТИЕ ИГРЫ ----------
  function openGame(id) {
    const g = GAMES.find(x => x.id === id);
    const say = (m, k) => { try { toast(m, k); } catch (e) { } };
    if (!g || !g.ready) { say('Эта live-игра скоро появится', 'e'); return; }
    try { if (typeof h === 'function') h('light'); } catch (e) { }
    if (typeof g.open === 'function') return g.open(g);
    if (g.tab) return goTab(g.tab);
  }

  // ---------- ПУБЛИЧНЫЙ API ----------
  window.LiveLobby = {
    games: GAMES,
    add(game) {
      if (!game || !game.id) return;
      const i = GAMES.findIndex(x => x.id === game.id);
      if (i >= 0) GAMES[i] = { ...GAMES[i], ...game }; else GAMES.push(game);
      render();
    },
    remove(id) {
      const i = GAMES.findIndex(x => x.id === id);
      if (i >= 0) { GAMES.splice(i, 1); render(); }
    },
    update(id, patch) { this.add({ id, ...patch }); },
    open: openLobby,
    go: goTab,
    render
  };

  // ---------- СТАРТ ----------
  function init() {
    injectIcon();
    mountHomeCard();
    mountLobbyTab();
    render();
    pollOnline();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();