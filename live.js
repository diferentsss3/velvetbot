/* ============================================================
   VELVET — LIVE GAME LOBBY (отдельный модуль)
   На главной в блоке «Игры» появляется ОДНА карточка «Live game».
   По нажатию открывается отдельная вкладка с сеткой live-игр.
   Зависит от app.js: $, ic, toast, tab
   Подключать ПОСЛЕ slots.js:  <script src="live.js"></script>
   ============================================================ */
(function () {
  'use strict';

  // ---------- СПИСОК LIVE-ИГР ----------
  //  id     — уникальный id
  //  title  — название на карточке
  //  sub    — подпись
  //  icon   — символ из index.html (#i-wheel → 'wheel'): wheel, rocket, bomb, gem, coin, eagle, ladder, gift, paw, yarn...
  //  color  — цвет рамки/свечения
  //  rtp    — число для бейджа RTP (или null)
  //  tag    — плашка слева сверху ('Хит', 'Новинка' или '')
  //  ready  — true когда игра готова
  //  tab    — id вкладки (section#t-<id>) ИЛИ open: () => {...}
  const GAMES = [
    { id: 'live1', title: 'Скоро', sub: 'Live-игра в реальном времени', icon: 'wheel',  color: '#c19bff', rtp: null, tag: '', ready: false },
    { id: 'live2', title: 'Скоро', sub: 'Live-игра в реальном времени', icon: 'rocket', color: '#4cc9f0', rtp: null, tag: '', ready: false },
  ];

  // ---------- СТИЛИ ----------
  const CSS = `
.m8{background:radial-gradient(120% 90% at 50% 130%,#ff9aa8,transparent 62%),linear-gradient(145deg,#5a0f2a,#d9304a)}
.m8 .ic{width:1.45em;height:1.45em}
.bd.live{background:linear-gradient(135deg,#ff3c64,#ff7a3c);color:#fff;display:inline-flex;align-items:center;gap:5px}
.bd.live .pulse-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 6px #fff}
.sc-live{position:absolute;top:9px;right:9px;z-index:2;display:inline-flex;align-items:center;gap:5px;font:800 10px/1 Manrope,system-ui,sans-serif;color:#fff;padding:4px 8px;border-radius:8px;background:linear-gradient(135deg,#ff3c64,#ff7a3c);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.sc-live .pulse-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 6px #fff}
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

  // ---------- ИКОНКА (символ добавляем сами) ----------
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

  // ---------- КАРТОЧКА «LIVE GAME» В БЛОКЕ ИГР НА ГЛАВНОЙ ----------
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
      '<div><b>Live game</b><small>Игры в реальном времени · вместе с другими</small></div>';
    const go = () => openLobby();
    card.onclick = go;
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    modes.appendChild(card);
  }

  // ---------- ВКЛАДКА С СЕТКОЙ ИГР ----------
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

  function goTab(t) {
    if (typeof tab === 'function') tab(t);
    // подсветка нижнего меню: для вкладки лобби активной остаётся «Главная»
    const navT = (t === 'lv' || (typeof t === 'string' && t.indexOf('lv') === 0)) ? 'h' : null;
    if (navT) document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === navT));
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function openLobby() {
    try { if (typeof h === 'function') h('light'); } catch (e) {}
    render();
    goTab('lv');
  }

  // ---------- РЕНДЕР СЕТКИ КАРТОЧЕК ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render() {
    const el = document.getElementById('live-lobby');
    if (!el) return;
    const iconFn = typeof ic === 'function' ? ic : (n => `<svg class="ic"><use href="#i-${n}"/></svg>`);

    if (!GAMES.length) {
      el.innerHTML = '<p class="note" style="grid-column:1/-1">Live-игр пока нет</p>';
      return;
    }

    el.innerHTML = GAMES.map(g => `
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
  }

  // ---------- ОТКРЫТИЕ КОНКРЕТНОЙ ИГРЫ ----------
  function openGame(id) {
    const g = GAMES.find(x => x.id === id);
    const say = (m, k) => { try { toast(m, k); } catch (e) {} };
    if (!g || !g.ready) { say('Эта live-игра скоро появится', 'e'); return; }
    try { if (typeof h === 'function') h('light'); } catch (e) {}
    if (typeof g.open === 'function') return g.open(g);
    if (g.tab) return goTab(g.tab);
  }

  // ---------- ПУБЛИЧНЫЙ API ----------
  // Из другого файла (например live-crash.js):
  //   LiveLobby.add({ id:'lcrash', title:'Live Crash', sub:'Общий раунд', icon:'rocket',
  //                   color:'#4cc9f0', rtp:97, tag:'Новинка', ready:true, tab:'lc' });
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
    render
  };

  // ---------- СТАРТ ----------
  function init() {
    injectIcon();
    mountHomeCard();
    mountLobbyTab();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();