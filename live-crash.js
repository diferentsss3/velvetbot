/* ============================================================
   VELVET — LIVE CRASH (клиент)
   Подключать ПОСЛЕ live.js:  <script src="live-crash.js"></script>
   Зависит от app.js: $, api, toast, fmt, getBet, S, syncMe
   ============================================================ */
(function () {
  'use strict';

  const CSS = `
.lc-online{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--ok);background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);border-radius:12px;padding:4px 10px;white-space:nowrap}
.lc-online .pulse-dot{width:7px;height:7px}
.lc-hist{display:flex;gap:4px;overflow:hidden;margin-bottom:10px;min-height:26px;flex-wrap:nowrap}
.lc-h{flex:none;padding:3px 9px;border-radius:10px;font-weight:800;font-size:12px}
.lc-cw{position:relative;height:clamp(200px,56vw,260px);border-radius:18px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);box-shadow:inset 0 4px 16px rgba(0,0,0,.5);overflow:hidden}
#lc-cv{width:100%;height:100%;display:block}
#lc-mult{position:absolute;inset:0;display:grid;place-items:center;font:700 clamp(40px,13vw,58px) var(--hd);color:#fff;text-shadow:0 0 30px rgba(181,123,255,.6);pointer-events:none;padding-bottom:18px}
#lc-sub{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:12px;font-weight:700;color:var(--m);pointer-events:none}
.lc-cw.crash #lc-mult{color:#ff5470;text-shadow:0 0 30px rgba(255,84,112,.6)}
.lc-cw.wait #lc-mult{font-size:clamp(26px,8vw,36px);color:var(--m);text-shadow:none}
.lc-row{display:grid;grid-template-columns:1.3fr 1fr 1.3fr;gap:6px;padding:8px 6px;border-top:1px solid var(--ln);font-size:13px;align-items:center}
.lc-row:first-child{border-top:0}
.lc-row span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lc-row span:last-child{text-align:right;font-weight:800}
.lc-row.me{background:rgba(181,123,255,.16);border-radius:10px;border-top-color:transparent}
.lc-empty{color:var(--m);font-size:12px;text-align:center;padding:14px 0}
`;
  const stl = document.createElement('style');
  stl.id = 'lc-css';
  stl.textContent = CSS;
  document.head.appendChild(stl);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const r2 = n => Math.round(n * 100) / 100;

  // ---------- Разметка вкладки ----------
  function mountTab() {
    if (document.getElementById('t-lc')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const sec = document.createElement('section');
    sec.className = 'tab';
    sec.id = 't-lc';
    sec.innerHTML = `
      <div class="lv-head">
        <button class="opt" id="lc-back">← Назад</button>
        <div class="lv-ttl">Live Crash</div>
        <span class="lc-online"><i class="pulse-dot"></i><b id="lc-online">0</b> онлайн</span>
      </div>
      <div class="stage">
        <div class="lc-hist" id="lc-hist"></div>
        <div class="lc-cw wait" id="lc-cw">
          <canvas id="lc-cv"></canvas>
          <div id="lc-mult">…</div>
          <div id="lc-sub">Подключение…</div>
        </div>
      </div>
      <div class="card">
        <label>Ставка</label>
        <div class="bet" id="lc-betbox">
          <input id="lc-bet" type="number" inputmode="decimal" value="10">
          <button data-k="h">½</button><button data-k="d">×2</button><button data-k="m">Макс</button>
        </div>
        <label>Авто-вывод на x (необязательно)</label>
        <input id="lc-auto" type="number" inputmode="decimal" placeholder="например 2.00" style="margin-bottom:12px">
        <button class="btn" id="lc-btn" disabled>Подключение…</button>
      </div>
      <div class="card">
        <div class="shead"><b>Ставки игроков</b><i class="rtp" id="lc-tot">0 · 0</i></div>
        <div id="lc-list"><div class="lc-empty">Пока нет ставок</div></div>
      </div>`;
    main.appendChild(sec);

    document.getElementById('lc-back').onclick = () => { if (window.LiveLobby) LiveLobby.open(); };
    document.querySelectorAll('#lc-betbox button').forEach(b => b.onclick = () => {
      const e = document.getElementById('lc-bet'), v = +e.value || 0, k = b.dataset.k;
      e.value = k === 'h' ? Math.max(1, Math.floor(v / 2)) : k === 'd' ? Math.min(Math.floor(S.bal), v * 2) : Math.floor(S.bal);
    });
    document.getElementById('lc-btn').onclick = onMainBtn;
  }

  // ---------- Состояние ----------
  let st = null, off = 0;
  let running = false, polling = false, timer = null, raf = 0, busy = false;
  let lastRound = 0, lastMe = null, lastListKey = '', lastHistKey = '';
  const srv = () => Date.now() + off;
  const tabOn = () => { const t = document.getElementById('t-lc'); return !!(t && t.classList.contains('on')); };
  const setBal = () => ['#bal', '#pbal', '#scr'].forEach(s => { const e = $(s); if (e) e.textContent = fmt(S.bal); });

  function curMult() {
    if (!st) return 1;
    const rd = st.round;
    if (rd.status === 'run') {
      const t = (srv() - rd.runStart) / 1000;
      return Math.max(1, Math.floor(Math.exp(st.growth * t) * 100) / 100);
    }
    if (rd.status === 'crash') return rd.crashPoint;
    return 1;
  }

  // ---------- Опрос сервера ----------
  async function poll() {
    if (polling) return;
    if (!running) return;
    if (!tabOn()) { stop(); return; }
    polling = true;
    try {
      const t0 = Date.now();
      const r = await api('/live/crash/state');
      if (r && r.ok) { off = r.now - (t0 + Date.now()) / 2; apply(r); }
      else if (!st) { const s = $('#lc-sub'); if (s) s.textContent = 'Нет ответа от сервера — перезапустите server.js'; }
    } catch (e) { }
    polling = false;
    if (!running) return;
    let delay = 1000;
    if (st) {
      const rd = st.round;
      if (rd.status === 'run') delay = 400;
      else if (rd.status === 'wait' && rd.betsEnd - srv() < 2000) delay = 500;
    }
    timer = setTimeout(poll, delay);
  }

  function refreshNow() { clearTimeout(timer); poll(); }

  function apply(r) {
    st = r;
    const rd = r.round;
    if (rd.id !== lastRound) { lastRound = rd.id; lastMe = null; }

    $('#lc-online').textContent = r.online;
    S.bal = r.balance; setBal();

    // события со ставкой игрока
    const meS = r.me ? r.me.status : null;
    if (lastMe === 'active' && meS === 'won') toast(`x${r.me.mult.toFixed(2)} · +${fmt(r2(r.me.win - r.me.bet))}`, 'w');
    if (lastMe === 'active' && meS === 'lost') toast('Краш на x' + (rd.crashPoint || 0).toFixed(2), 'e');
    lastMe = meS;

    // история
    const hk = r.history.join(',');
    if (hk !== lastHistKey) {
      lastHistKey = hk;
      $('#lc-hist').innerHTML = r.history.slice(0, 12).map(v => {
        const c = v < 2 ? ['rgba(255,84,112,.18)', '#ff7a90'] : v < 10 ? ['rgba(240,200,101,.18)', '#f0c865'] : ['rgba(181,123,255,.22)', '#d9b3ff'];
        return `<span class="lc-h" style="background:${c[0]};color:${c[1]}">x${v.toFixed(2)}</span>`;
      }).join('');
    }

    // ставки игроков
    const lk = JSON.stringify(r.bets) + rd.status;
    if (lk !== lastListKey) {
      lastListKey = lk;
      $('#lc-tot').textContent = `${r.totals.count} игр. · ${fmt(r.totals.sum)}`;
      $('#lc-list').innerHTML = r.bets.length ? r.bets.map(b => {
        let res;
        if (b.s === 'won') res = `<span style="color:var(--ok)">x${b.m.toFixed(2)} · +${fmt(r2(b.w - b.b))}</span>`;
        else if (b.s === 'lost') res = `<span style="color:var(--bad)">−${fmt(b.b)}</span>`;
        else res = `<span style="color:var(--m)">играет</span>`;
        return `<div class="lc-row${b.me ? ' me' : ''}"><span>${esc(b.n)}</span><span>${fmt(b.b)}</span>${res}</div>`;
      }).join('') : '<div class="lc-empty">Пока нет ставок. Будьте первым!</div>';
    }
  }

  // ---------- Действия ----------
  const ERR = {
    closed: 'Приём ставок закрыт', already: 'Вы уже сделали ставку', balance: 'Недостаточно средств',
    bet: 'Мин. ставка — 1', maxbet: 'Превышена макс. ставка', early: 'Подождите немного',
    crashed: 'Слишком поздно — краш', nobet: 'Нет активной ставки'
  };

  async function onMainBtn() {
    if (busy || !st) return;
    const rd = st.round;
    if (rd.status === 'wait' && !st.me) {
      const bet = getBet('#lc-bet'); if (!bet) return;
      const auto = +document.getElementById('lc-auto').value || 0;
      busy = true;
      const r = await api('/live/crash/bet', { bet, auto });
      busy = false;
      if (r.ok) { S.bal = r.balance; setBal(); toast('Ставка принята', 'w'); refreshNow(); }
      else { toast(ERR[r.error] || 'Ошибка ставки', 'e'); refreshNow(); }
    } else if (rd.status === 'run' && st.me && st.me.status === 'active') {
      busy = true;
      const r = await api('/live/crash/cashout');
      busy = false;
      if (r.ok) { S.bal = r.balance; setBal(); toast(`x${r.mult.toFixed(2)} · +${fmt(r2(r.win - st.me.bet))}`, 'w'); }
      else toast(ERR[r.error] || 'Ошибка', 'e');
      refreshNow();
    }
  }

  // ---------- Отрисовка ----------
  function draw() {
    const cv = document.getElementById('lc-cv');
    if (!cv) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const pad = 16;
    c.strokeStyle = 'rgba(168,120,255,.12)'; c.lineWidth = 1;
    for (let i = 1; i <= 3; i++) { const y = pad + (h - pad * 2) * i / 4; c.beginPath(); c.moveTo(pad, y); c.lineTo(w - pad, y); c.stroke(); }
    if (!st || st.round.status === 'wait') return;

    const rd = st.round, g = st.growth, crashed = rd.status === 'crash';
    const T = crashed ? Math.log(Math.max(1, rd.crashPoint)) / g : Math.max(0, (srv() - rd.runStart) / 1000);
    const xmax = Math.max(8, T * 1.08), ymax = Math.max(2, Math.exp(g * T) * 1.12);
    const px = t => pad + (t / xmax) * (w - pad * 2);
    const py = v => h - pad - ((v - 1) / (ymax - 1)) * (h - pad * 2);
    const col = crashed ? '#ff5470' : '#f0c865';

    c.beginPath();
    const n = 60;
    for (let i = 0; i <= n; i++) { const t = T * i / n; const x = px(t), y = py(Math.exp(g * t)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.stroke();
    c.lineTo(px(T), h - pad); c.lineTo(px(0), h - pad); c.closePath();
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, crashed ? 'rgba(255,84,112,.30)' : 'rgba(240,200,101,.28)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fill();
    c.beginPath(); c.arc(px(T), py(Math.exp(g * T)), 6, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
  }

  function updateUI() {
    if (!st) return;
    const rd = st.round, me = st.me, m = curMult();
    const cw = document.getElementById('lc-cw'), mult = document.getElementById('lc-mult'),
      sub = document.getElementById('lc-sub'), btn = document.getElementById('lc-btn');
    cw.className = 'lc-cw ' + rd.status;

    if (rd.status === 'wait') {
      const sec = Math.max(0, (rd.betsEnd - srv()) / 1000);
      mult.textContent = sec > 0 ? sec.toFixed(1) + ' с' : 'Старт…';
      sub.textContent = 'Приём ставок';
    } else if (rd.status === 'run') {
      mult.textContent = 'x' + m.toFixed(2);
      sub.textContent = 'Полёт…';
    } else {
      mult.textContent = 'x' + rd.crashPoint.toFixed(2);
      sub.textContent = 'Краш!';
    }

    let txt = '', dis = true, cash = false;
    if (rd.status === 'wait') {
      if (me) { txt = 'Ставка принята · ' + fmt(me.bet) + (me.auto ? ' · авто x' + me.auto.toFixed(2) : ''); }
      else { txt = 'Поставить'; dis = false; }
    } else if (rd.status === 'run') {
      if (me && me.status === 'active') { txt = `Забрать x${m.toFixed(2)} · +${fmt(r2(me.bet * m - me.bet))}`; dis = false; cash = true; }
      else if (me && me.status === 'won') txt = `Выигрыш +${fmt(r2(me.win - me.bet))} (x${me.mult.toFixed(2)})`;
      else if (me) txt = 'Ставка проиграна';
      else txt = 'Ждите следующий раунд';
    } else {
      if (me && me.status === 'won') txt = `Выигрыш +${fmt(r2(me.win - me.bet))} (x${me.mult.toFixed(2)})`;
      else if (me) txt = 'Проигрыш −' + fmt(me.bet);
      else txt = 'Раунд завершён';
    }
    if (btn.textContent !== txt) btn.textContent = txt;
    btn.disabled = dis || busy;
    btn.classList.toggle('cash', cash);
  }

  function frame() {
    if (!running) return;
    if (tabOn()) { updateUI(); draw(); }
    raf = requestAnimationFrame(frame);
  }

  // ---------- Старт / стоп ----------
  function start() {
    mountTab();
    if (running) return;
    running = true; st = null; lastListKey = ''; lastHistKey = '';
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
      if (window.LiveLobby && typeof LiveLobby.go === 'function') { LiveLobby.go('lc'); return; }
    } catch (e) { console.error(e); }
    if (typeof tab === 'function') tab('lc');
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === 'h'));
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  // ---------- Регистрация в лобби ----------
  function register() {
    if (!window.LiveLobby) { console.error('[live-crash] LiveLobby не найден: подключите live.js ДО live-crash.js'); return; }
    mountTab();
    LiveLobby.add({
      id: 'lcrash', title: 'Live Crash', sub: 'Общий раунд · ставки видны всем',
      icon: 'rocket', color: '#4cc9f0', rtp: null, tag: 'Новинка', ready: true,
      onlineKey: 'crash',
      open: () => {
        try { openTab(); start(); }
        catch (e) { console.error('[live-crash]', e); try { toast('Ошибка: ' + e.message, 'e'); } catch (_) { } }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register);
  else register();
})();