/* ============================================================
   VELVET — LIVE JACKPOT (клиент)
   Подключать ПОСЛЕ live.js:  <script src="live-jackpot.js"></script>
   Зависит от app.js: $, api, toast, fmt, getBet, S, syncMe
   ============================================================ */
(function () {
  'use strict';

  const PAL = ['#ff5470', '#ffb020', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#c084fc', '#facc15'];
  const IW = 60;       // ширина элемента ленты
  const N_ITEMS = 72;  // длина ленты
  const W_IDX = 56;    // индекс элемента, на котором остановится лента

  const CSS = `
.lj-top{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px}
.lj-pool small{display:block;color:var(--m);font-size:11px;font-weight:700;letter-spacing:.08em}
#lj-pool{font:700 clamp(28px,9vw,38px) var(--hd);background:var(--gold);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(240,200,101,.35))}
#lj-fee{font-size:11px;color:var(--m);font-weight:600;text-align:right}
#lj-status{text-align:center;font:800 14px Manrope,system-ui,sans-serif;margin:10px 0;min-height:20px}
.lj-roll{position:relative;height:92px;border-radius:16px;overflow:hidden;background:rgba(0,0,0,.35);border:1px solid rgba(168,120,255,.25);box-shadow:inset 0 4px 16px rgba(0,0,0,.5)}
#lj-bar{display:flex;height:100%}
.lj-seg{display:grid;place-items:center;font:800 18px var(--hd);color:#fff;overflow:hidden;min-width:0;transition:width .4s}
.lj-wait{display:grid;place-items:center;height:100%;color:var(--m);font-size:13px;font-weight:700;text-align:center;padding:0 12px}
#lj-stripw{display:none;position:absolute;inset:0}
#lj-strip{display:flex;height:100%;will-change:transform}
.lj-it{flex:none;width:${IW}px;height:100%;display:grid;place-items:center;font:800 22px var(--hd);color:#fff;border-right:2px solid rgba(0,0,0,.35);text-shadow:0 2px 4px rgba(0,0,0,.4)}
#lj-ptr{position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;background:linear-gradient(#fff0b8,#f0c865);box-shadow:0 0 14px rgba(240,200,101,.9);z-index:2}
#lj-ptr::before{content:"";position:absolute;top:-1px;left:-7px;border:8px solid transparent;border-top:10px solid #f0c865;border-bottom:0}
.lj-roll.spin #lj-bar,.lj-roll.result #lj-bar{display:none}
.lj-roll.spin #lj-stripw,.lj-roll.result #lj-stripw{display:block}
.lj-row{display:grid;grid-template-columns:14px 1.4fr 1fr .8fr;gap:8px;padding:8px 6px;border-top:1px solid var(--ln);font-size:13px;align-items:center}
.lj-row:first-child{border-top:0}
.lj-row i{width:12px;height:12px;border-radius:50%;display:block}
.lj-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lj-row span:last-child{text-align:right;color:var(--m);font-weight:700}
.lj-row.me{background:rgba(181,123,255,.16);border-radius:10px;border-top-color:transparent}
.lj-row.win{background:rgba(240,200,101,.18);border-radius:10px;border-top-color:transparent}
.lj-empty{color:var(--m);font-size:12px;text-align:center;padding:14px 0}
.lj-myinfo{font-size:12px;color:var(--m);text-align:center;margin:0 0 12px;min-height:16px}
.lj-myinfo b{color:#fff}
`;
  const stl = document.createElement('style');
  stl.id = 'lj-css';
  stl.textContent = CSS;
  document.head.appendChild(stl);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r2 = n => Math.round(n * 100) / 100;
  const initial = n => (String(n || '?').trim()[0] || '?').toUpperCase();

  // детерминированный ГПСЧ: у всех игроков одинаковая лента
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- Разметка ----------
  function mountTab() {
    if (document.getElementById('t-lj')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const sec = document.createElement('section');
    sec.className = 'tab';
    sec.id = 't-lj';
    sec.innerHTML = `
      <div class="lv-head">
        <button class="opt" id="lj-back">← Назад</button>
        <div class="lv-ttl">Jackpot</div>
        <span class="lc-online"><i class="pulse-dot"></i><b id="lj-online">0</b> онлайн</span>
      </div>
      <div class="stage">
        <div class="lj-top">
          <div class="lj-pool"><small>БАНК</small><div id="lj-pool">0</div></div>
          <div id="lj-fee"></div>
        </div>
        <div class="lj-roll" id="lj-roll">
          <div id="lj-bar"><div class="lj-wait">Ждём игроков…</div></div>
          <div id="lj-stripw"><div id="lj-ptr"></div><div id="lj-strip"></div></div>
        </div>
        <div id="lj-status">Подключение…</div>
      </div>
      <div class="card">
        <label>Ставка</label>
        <div class="bet" id="lj-betbox">
          <input id="lj-bet" type="number" inputmode="decimal" value="10">
          <button data-k="h">½</button><button data-k="d">×2</button><button data-k="m">Макс</button>
        </div>
        <div class="lj-myinfo" id="lj-my"></div>
        <button class="btn" id="lj-btn" disabled>Подключение…</button>
        <button class="opt" id="lj-cancel" style="display:none;width:100%;margin-top:10px">Вернуть ставку</button>
      </div>
      <div class="card">
        <div class="shead"><b>Игроки раунда</b><i class="rtp" id="lj-cnt">0</i></div>
        <div id="lj-list"><div class="lj-empty">Пока никто не поставил</div></div>
      </div>
      <div class="card">
        <div class="shead"><b>Последние победители</b></div>
        <div id="lj-hist"><div class="lj-empty">Пока пусто</div></div>
      </div>`;
    main.appendChild(sec);

    document.getElementById('lj-back').onclick = () => { if (window.LiveLobby) LiveLobby.open(); };
    document.querySelectorAll('#lj-betbox button').forEach(b => b.onclick = () => {
      const e = document.getElementById('lj-bet'), v = +e.value || 0, k = b.dataset.k;
      e.value = k === 'h' ? Math.max(1, Math.floor(v / 2)) : k === 'd' ? Math.min(Math.floor(S.bal), v * 2) : Math.floor(S.bal);
    });
    document.getElementById('lj-btn').onclick = onBet;
    document.getElementById('lj-cancel').onclick = onCancel;
  }

  // ---------- Состояние ----------
  let st = null, off = 0;
  let running = false, polling = false, timer = null, raf = 0, busy = false;
  let lastRound = 0, notified = 0, stripRound = 0, landFrac = 0.5;
  let lastListKey = '', lastHistKey = '', lastBarKey = '';
  const srv = () => Date.now() + off;
  const tabOn = () => { const t = document.getElementById('t-lj'); return !!(t && t.classList.contains('on')); };
  const setBal = () => ['#bal', '#pbal', '#scr'].forEach(s => { const e = $(s); if (e) e.textContent = fmt(S.bal); });

  // ---------- Опрос ----------
  async function poll() {
    if (polling || !running) return;
    if (!tabOn()) { stop(); return; }
    polling = true;
    try {
      const t0 = Date.now();
      const r = await api('/live/jp/state');
      if (r && r.ok) { off = r.now - (t0 + Date.now()) / 2; apply(r); }
      else if (!st) { const s = $('#lj-status'); if (s) s.textContent = 'Нет ответа от сервера — перезапустите server.js'; }
    } catch (e) { }
    polling = false;
    if (!running) return;
    let delay = 1000;
    if (st && st.round.status === 'count' && st.round.countEnd - srv() < 3000) delay = 500;
    timer = setTimeout(poll, delay);
  }
  function refreshNow() { clearTimeout(timer); poll(); }

  function apply(r) {
    st = r;
    const rd = r.round;
    if (rd.id !== lastRound) { lastRound = rd.id; lastListKey = ''; lastBarKey = ''; }

    $('#lj-online').textContent = r.online;
    S.bal = r.balance; setBal();
    $('#lj-pool').textContent = fmt(r.pool);
    $('#lj-fee').innerHTML = `Комиссия ${rd.feePct}%<br>Минимум ${rd.minPlayers} игрока`;

    // лента при розыгрыше
    if ((rd.status === 'spin' || rd.status === 'result') && stripRound !== rd.id) buildStrip(r);

    // результат для игрока
    if (rd.status === 'result' && notified !== rd.id) {
      notified = rd.id;
      const w = r.players[rd.winnerIdx];
      if (r.me && w) {
        if (w.me) toast(`🏆 Вы выиграли ${fmt(rd.payout)}!`, 'w');
        else toast(`Победил ${w.n}. Ставка проиграна`, 'e');
      }
    }

    renderBar(r);
    renderList(r);

    const hk = JSON.stringify(r.history);
    if (hk !== lastHistKey) {
      lastHistKey = hk;
      $('#lj-hist').innerHTML = r.history.length ? r.history.map(h =>
        `<div class="lj-row" style="grid-template-columns:1.4fr 1fr 1fr"><span>🏆 ${esc(h.n)}</span><span style="color:var(--ok);font-weight:800">+${fmt(h.p)}</span><span>банк ${fmt(h.pool)}</span></div>`
      ).join('') : '<div class="lj-empty">Пока пусто</div>';
    }
  }

  function renderBar(r) {
    const key = JSON.stringify(r.players.map(p => [p.n, p.b, p.c]));
    if (key === lastBarKey) return;
    lastBarKey = key;
    const el = $('#lj-bar');
    if (!r.players.length) { el.innerHTML = '<div class="lj-wait">Ждём игроков…</div>'; return; }
    el.innerHTML = r.players.map(p =>
      `<div class="lj-seg" style="width:${(p.b / r.pool * 100).toFixed(2)}%;background:${PAL[p.c % PAL.length]}">${esc(initial(p.n))}</div>`
    ).join('');
  }

  function renderList(r) {
    const key = JSON.stringify(r.players) + r.round.status + r.round.winnerIdx;
    if (key === lastListKey) return;
    lastListKey = key;
    $('#lj-cnt').textContent = r.players.length;
    if (!r.players.length) { $('#lj-list').innerHTML = '<div class="lj-empty">Пока никто не поставил</div>'; return; }
    const winIdx = r.round.status === 'result' ? r.round.winnerIdx : -1;
    $('#lj-list').innerHTML = r.players
      .map((p, i) => ({ ...p, i }))
      .sort((a, b) => b.b - a.b)
      .map(p => `<div class="lj-row${p.i === winIdx ? ' win' : p.me ? ' me' : ''}">
        <i style="background:${PAL[p.c % PAL.length]}"></i>
        <span>${p.i === winIdx ? '🏆 ' : ''}${esc(p.n)}</span>
        <span style="font-weight:800">${fmt(p.b)}</span>
        <span>${(p.b / r.pool * 100).toFixed(1)}%</span>
      </div>`).join('');
  }

  // ---------- Лента розыгрыша ----------
  function buildStrip(r) {
    stripRound = r.round.id;
    const rand = rng(r.round.id * 7919 + 13);
    const pool = r.pool, items = [];
    for (let i = 0; i < N_ITEMS; i++) {
      let idx;
      if (i === W_IDX) idx = r.round.winnerIdx;
      else {
        let x = rand() * pool; idx = r.players.length - 1;
        for (let k = 0; k < r.players.length; k++) { x -= r.players[k].b; if (x < 0) { idx = k; break; } }
      }
      items.push(idx);
    }
    landFrac = 0.12 + 0.76 * rand();
    $('#lj-strip').innerHTML = items.map(i => {
      const p = r.players[i];
      return `<div class="lj-it" style="background:${PAL[p.c % PAL.length]}">${esc(initial(p.n))}</div>`;
    }).join('');
    $('#lj-strip').style.transform = 'translateX(0)';
  }

  function moveStrip() {
    if (!st) return;
    const rd = st.round;
    if (rd.status !== 'spin' && rd.status !== 'result') return;
    if (stripRound !== rd.id) return;
    const wrap = $('#lj-stripw'); if (!wrap) return;
    const p = rd.status === 'result' ? 1 : Math.min(1, Math.max(0, (srv() - rd.spinStart) / rd.spinDur));
    const ease = 1 - Math.pow(1 - p, 4);
    const target = W_IDX * IW + IW * landFrac - wrap.clientWidth / 2;
    $('#lj-strip').style.transform = `translateX(${-(ease * target).toFixed(1)}px)`;
  }

  // ---------- Интерфейс по кадрам ----------
  function updateUI() {
    if (!st) return;
    const rd = st.round, me = st.me;
    const roll = $('#lj-roll'), status = $('#lj-status'), btn = $('#lj-btn'), cancel = $('#lj-cancel'), my = $('#lj-my');
    roll.className = 'lj-roll ' + rd.status;

    let s = '', col = 'var(--m)';
    if (rd.status === 'wait') {
      s = st.players.length === 0 ? `Ждём игроков · нужно минимум ${rd.minPlayers}` : `Ждём ещё игроков · нужно минимум ${rd.minPlayers}`;
    } else if (rd.status === 'count') {
      const sec = Math.max(0, Math.ceil((rd.countEnd - srv()) / 1000));
      s = `Старт через ${sec} с`; col = '#f0c865';
    } else if (rd.status === 'spin') {
      s = 'Определяем победителя…'; col = '#fff';
    } else {
      const w = st.players[rd.winnerIdx];
      s = w ? `🏆 ${w.n} забирает ${fmt(rd.payout)}` : 'Раунд завершён'; col = '#4ade80';
    }
    if (status.textContent !== s) status.textContent = s;
    status.style.color = col;

    const canBet = rd.status === 'wait' || (rd.status === 'count' && rd.countEnd - srv() > 1000);
    btn.textContent = canBet ? (me ? 'Добавить к ставке' : 'Поставить') : (rd.status === 'count' ? 'Приём ставок закрыт' : 'Идёт розыгрыш');
    btn.disabled = !canBet || busy;
    cancel.style.display = (rd.status === 'wait' && me) ? 'block' : 'none';

    if (me) {
      const chance = st.pool > 0 ? (me.stake / st.pool * 100) : 0;
      my.innerHTML = `Ваша ставка: <b>${fmt(me.stake)}</b> · шанс <b>${chance.toFixed(1)}%</b> · возможный выигрыш <b>${fmt(r2(st.pool * (1 - rd.feePct / 100)))}</b>`;
    } else {
      my.textContent = 'Чем больше ставка — тем выше шанс забрать весь банк';
    }
  }

  function frame() {
    if (!running) return;
    if (tabOn()) { updateUI(); moveStrip(); }
    raf = requestAnimationFrame(frame);
  }

  // ---------- Действия ----------
  const ERR = {
    closed: 'Приём ставок закрыт', balance: 'Недостаточно средств', bet: 'Мин. ставка — 1',
    maxbet: 'Превышена макс. ставка', maxtotal: 'Лимит ставки на раунд', nobet: 'Нет ставки'
  };

  async function onBet() {
    if (busy || !st) return;
    const bet = getBet('#lj-bet'); if (!bet) return;
    busy = true;
    const r = await api('/live/jp/bet', { bet });
    busy = false;
    if (r.ok) { S.bal = r.balance; setBal(); toast('Ставка принята', 'w'); }
    else toast(ERR[r.error] || 'Ошибка ставки', 'e');
    refreshNow();
  }

  async function onCancel() {
    if (busy) return;
    busy = true;
    const r = await api('/live/jp/cancel');
    busy = false;
    if (r.ok) { S.bal = r.balance; setBal(); toast('Ставка возвращена', 'w'); }
    else toast(ERR[r.error] || 'Нельзя вернуть ставку', 'e');
    refreshNow();
  }

  // ---------- Старт / стоп ----------
  function start() {
    mountTab();
    if (running) return;
    running = true; st = null; lastRound = 0; stripRound = 0; lastListKey = ''; lastHistKey = ''; lastBarKey = '';
    poll();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    try { syncMe(); } catch (e) { }
  }

  // Переход на вкладку игры (работает и со старой версией live.js)
  function openTab() {
    try {
      if (window.LiveLobby && typeof LiveLobby.go === 'function') { LiveLobby.go('lj'); return; }
    } catch (e) { console.error(e); }
    if (typeof tab === 'function') tab('lj');
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === 'h'));
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  // ---------- Регистрация в лобби ----------
  function register() {
    if (!window.LiveLobby) { console.error('[jackpot] LiveLobby не найден: подключите live.js ДО live-jackpot.js'); return; }
    mountTab();
    LiveLobby.add({
      id: 'ljackpot', title: 'Jackpot', sub: 'Один забирает весь банк',
      icon: 'gem', color: '#f0c865', rtp: 90, tag: 'Новинка', ready: true,
      onlineKey: 'jackpot',
      open: () => {
        try { openTab(); start(); }
        catch (e) { console.error('[jackpot]', e); try { toast('Ошибка: ' + e.message, 'e'); } catch (_) { } }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register);
  else register();
})();