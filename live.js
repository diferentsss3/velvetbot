/* ============================================================
   VELVET — LIVE GAME LOBBY (отдельный модуль)
   Сам вставляет раздел на главную и подключает свои стили.
   Зависит от app.js: $, ic, toast, tab
   Подключать ПОСЛЕ slots.js:  <script src="live.js"></script>
   ============================================================ */
(function () {
  'use strict';

  // ---------- СПИСОК LIVE-ИГР ----------
  // Чтобы добавить игру — добавьте объект сюда (или вызовите LiveLobby.add(...) из другого файла).
  //  id     — уникальный id
  //  title  — название на карточке
  //  sub    — подпись
  //  icon   — имя символа из index.html (#i-wheel → 'wheel'): wheel, rocket, bomb, gem, coin, eagle, ladder, gift
  //  color  — цвет рамки/свечения
  //  rtp    — число для бейджа RTP (или null, чтобы скрыть)
  //  tag    — плашка слева сверху ('Хит', 'Новинка' или '')
  //  ready  — true когда игра готова
  //  tab    — id вкладки (например 'lv1' → section#t-lv1) ИЛИ open: () => {...}
  const GAMES = [
    { id: 'live1', title: 'Скоро',  sub: 'Live-игра в реальном времени', icon: 'wheel',  color: '#c19bff', rtp: null, tag: '', ready: false },
    { id: 'live2', title: 'Скоро',  sub: 'Live-игра в реальном времени', icon: 'rocket', color: '#4cc9f0', rtp: null, tag: '', ready: false },
  ];

  // ---------- СТИЛИ (инжектятся сами, index.html не трогаем) ----------
  const CSS = `
.sc-live{position:absolute;top:9px;right:9px;z-index:2;display:inline-flex;align-items:center;gap:5px;font:800 10px/1 Manrope,system-ui,sans-serif;color:#fff;padding:4px 8px;border-radius:8px;background:linear-gradient(135deg,#ff3c64,#ff7a3c);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.sc-live .pulse-dot{width:6px;height:6px;background:#fff;box-shadow:0 0 6px #fff}
.sc.soon{filter:saturate(.7)}
.sc.soon .sc-go{background:rgba(255,255,255,.1);color:var(--m);border-color:var(--ln);box-shadow:none}
#live-section .sh{display:flex;align-items:center}
.lg-cnt{margin-left:auto;font-size:12px;font-weight:600;color:var(--m)}
.lg-cnt b{color:#fff}
`;
  const st = document.createElement('style');
  st.id = 'live-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  // ---------- ВСТАВКА РАЗДЕЛА НА ГЛАВНУЮ ----------
  function mountSection() {
    if (document.getElementById('live-section')) return document.getElementById('live-section');
    const home = document.getElementById('t-h');
    if (!home) return null;

    const sec = document.createElement('div');
    sec.id = 'live-section';
    sec.innerHTML =
      '<h3 class="sh">Live game<i class="live"></i></h3>' +
      '<div class="sc-grid" id="live-lobby"></div>';

    // ставим перед «Последние ставки»; если не нашли — в конец главной
    const heads = home.querySelectorAll('.sh');
    let anchor = null;
    heads.forEach(h => { if (!anchor && /Последние ставки/i.test(h.textContent)) anchor = h; });
    if (anchor) home.insertBefore(sec, anchor); else home.appendChild(sec);
    return sec;
  }

  // ---------- РЕНДЕР КАРТОЧЕК ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render() {
    const el = document.getElementById('live-lobby');
    if (!el) return;
    const iconFn = typeof ic === 'function' ? ic : (n => `<svg class="ic"><use href="#i-${n}"/></svg>`);

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

    // если игр нет — прячем раздел целиком
    const sec = document.getElementById('live-section');
    if (sec) sec.style.display = GAMES.length ? '' : 'none';
  }

  // ---------- ОТКРЫТИЕ ИГРЫ ----------
  function openGame(id) {
    const g = GAMES.find(x => x.id === id);
    const say = (m, k) => { try { toast(m, k); } catch (e) {} };
    if (!g || !g.ready) { say('Эта live-игра скоро появится', 'e'); return; }
    try { if (window.h) window.h('light'); } catch (e) {}
    if (typeof g.open === 'function') return g.open(g);
    if (g.tab && typeof tab === 'function') return tab(g.tab);
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
    render
  };

  // ---------- СТАРТ ----------
  function init() { if (mountSection()) render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();