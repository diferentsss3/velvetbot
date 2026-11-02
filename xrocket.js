// xrocket.js — пополнение и ручной вывод через xRocket.
// Подключать ПОСЛЕ app.js: <script src="xrocket.js"></script>
// Использует глобальные функции основного клиента: api, toast, render, S, $, $$
(() => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const rate = () => (typeof S !== 'undefined' && S.cfg && +S.cfg.rate) || 87;
  const say = (t, k) => { try { toast(t, k); } catch (e) { alert(t); } };
  const PEND_KEY = 'xr_pending';

  // xRocket скрыт, если на сервере нет ключа (cfg.xrocket_enabled приходит из /me)
  const enabled = () => typeof S === 'undefined' || !S.cfg || S.cfg.xrocket_enabled !== false;

  const st = { dep: false, wd: false };

  // ---------- Вставка кнопок и полей ----------
  function mkBtn(label) {
    const b = document.createElement('button');
    b.dataset.m = 'xr';
    b.textContent = label;
    return b;
  }

  const dm = q('#dmethod'), wm = q('#wmethod');
  let dBtn = null, wBtn = null;

  if (dm) {
    dBtn = mkBtn('🚀 xRocket ($)');
    dm.appendChild(dBtn);
    dm.style.gridTemplateColumns = 'repeat(3,1fr)';
  }
  if (wm) {
    wBtn = mkBtn('🚀 xRocket');
    wm.appendChild(wBtn);
    wm.style.gridTemplateColumns = 'repeat(3,1fr)';
  }

  // поле «Telegram ID / @username xRocket» для вывода
  let wBox = null;
  const wdb = q('#wdb');
  if (wdb) {
    wBox = document.createElement('div');
    wBox.id = 'wxr-box';
    wBox.style.cssText = 'display:none;margin-bottom:14px';
    wBox.innerHTML = '<label>Telegram ID или @username вашего xRocket</label>' +
      '<input id="wxr-id" type="text" placeholder="@username или 123456789" autocomplete="off" style="height:46px">';
    wdb.parentNode.insertBefore(wBox, wdb);
  }

  // ---------- Вспомогательное ----------
  function markSel(container, btn) {
    qa(container + ' button').forEach((z) => z.classList.toggle('sel', z === btn));
  }

  function updDepCoins() {
    if (!st.dep) return;
    const usd = parseFloat(String((q('#dam') || {}).value || '').replace(',', '.')) || 0;
    const el = q('#dcoins');
    if (el) el.textContent = Math.floor(usd * rate()).toLocaleString('ru-RU');
  }

  function updWdUsd() {
    if (!st.wd) return;
    const coins = Math.floor(+String((q('#wam') || {}).value || '').replace(/\s/g, '')) || 0;
    const el = q('#wusd');
    if (el) el.textContent = (coins / rate()).toFixed(2);
  }

  // ---------- Выбор способа: ПОПОЛНЕНИЕ ----------
  function pickDep() {
    if (!enabled()) return say('xRocket временно недоступен', 'e');
    st.dep = true;
    markSel('#dmethod', dBtn);
    const set = (id, t) => { const e = q(id); if (e) e.textContent = t; };
    set('#dbadge', 'xRocket');
    set('#dlabel', 'Сумма пополнения, $ (USDT)');
    set('#dnote', 'Оплата в USDT через xRocket. После оплаты монеты зачислятся автоматически.');
    set('#dmin', 'Минимум 1 $, максимум 1000 $');
    updDepCoins();
  }

  // ---------- Выбор способа: ВЫВОД ----------
  function pickWd() {
    if (!enabled()) return say('xRocket временно недоступен', 'e');
    st.wd = true;
    markSel('#wmethod', wBtn);
    const set = (id, t) => { const e = q(id); if (e) e.textContent = t; };
    set('#wbadge', 'xRocket');
    set('#wnote', 'Ручной вывод на ваш аккаунт xRocket. Укажите Telegram ID или @username. Выплата производится вручную, обычно до 24 часов.');
    set('#wusd-label', '$ к получению (USDT)');
    const ph = q('#wphone-box'); if (ph) ph.style.display = 'none';
    if (wBox) wBox.style.display = 'block';
    updWdUsd();
  }

  function leaveDep() { st.dep = false; }
  function leaveWd() { st.wd = false; if (wBox) wBox.style.display = 'none'; }

  // capture на контейнере: клик по xRocket-кнопке не доходит до обработчиков app.js
  if (dm) {
    dm.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b === dBtn) { e.stopPropagation(); e.preventDefault(); pickDep(); }
      else { leaveDep(); if (dBtn) dBtn.classList.remove('sel'); }
    }, true);
  }
  if (wm) {
    wm.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b === wBtn) { e.stopPropagation(); e.preventDefault(); pickWd(); }
      else { leaveWd(); if (wBtn) wBtn.classList.remove('sel'); }
    }, true);
  }

  // пересчёт сумм при вводе (наши обработчики идут после app.js и перекрывают его значения)
  const dam = q('#dam'); if (dam) dam.addEventListener('input', updDepCoins);
  const wam = q('#wam'); if (wam) wam.addEventListener('input', updWdUsd);
  const wmax = q('#wmax'); if (wmax) wmax.addEventListener('click', () => setTimeout(updWdUsd, 0));

  // ---------- ПОПОЛНЕНИЕ: создание счёта ----------
  const dbtn = q('#dbtn');
  if (dbtn) {
    dbtn.addEventListener('click', async (e) => {
      if (!st.dep) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (dbtn.dataset.busy) return;

      const usd = parseFloat(String(dam.value || '').replace(',', '.'));
      if (!Number.isFinite(usd) || usd < 1 || usd > 1000) return say('Сумма от 1 до 1000 $', 'e');

      dbtn.dataset.busy = '1'; dbtn.disabled = true;
      try {
        const r = await api('/xrocket/create', { usd });
        if (!r || !r.ok) {
          const m = { amount: 'Сумма от 1 до 1000 $', disabled: 'xRocket временно недоступен', provider: 'Ошибка платёжной системы, попробуйте позже' };
          return say(m[r && r.error] || 'Не удалось создать счёт', 'e');
        }
        try { localStorage.setItem(PEND_KEY, r.id); } catch (_) {}
        openLink(r.url);
        say('Откройте xRocket и оплатите счёт', 'w');
        watch(r.id);
      } finally { delete dbtn.dataset.busy; dbtn.disabled = false; }
    }, true);
  }

  function openLink(url) {
    try {
      const tg = window.Telegram && Telegram.WebApp;
      if (tg && /^https:\/\/t\.me\//.test(url) && tg.openTelegramLink) return tg.openTelegramLink(url);
      if (tg && tg.openLink) return tg.openLink(url);
    } catch (_) {}
    window.open(url, '_blank');
  }

  // ---------- ПОПОЛНЕНИЕ: ожидание оплаты ----------
  let watching = null;
  async function checkOnce(id) {
    const r = await api('/xrocket/claim', { id });
    if (!r) return 'pending';
    if (r.status === 'paid') {
      try { localStorage.removeItem(PEND_KEY); } catch (_) {}
      try { S.bal = (+S.bal || 0) + (+r.coins || 0); render(); } catch (_) {}
      say('Зачислено +' + (r.coins || 0) + ' монет' + (r.msg || ''), 'w');
      return 'paid';
    }
    if (r.status === 'expired' || r.status === 'none') {
      try { localStorage.removeItem(PEND_KEY); } catch (_) {}
      if (r.status === 'expired') say('Счёт истёк', 'e');
      return 'done';
    }
    return 'pending';
  }

  function watch(id) {
    if (watching === id) return;
    watching = id;
    let tries = 0;
    const tick = async () => {
      if (watching !== id) return;
      tries++;
      let s = 'pending';
      try { s = await checkOnce(id); } catch (_) {}
      if (s !== 'pending' || tries > 225) { watching = null; return; } // ~15 минут
      setTimeout(tick, 4000);
    };
    setTimeout(tick, 4000);
  }

  // продолжить проверку после перезахода в приложение
  try {
    const p = localStorage.getItem(PEND_KEY);
    if (p) setTimeout(() => watch(p), 1500);
  } catch (_) {}

  // ---------- ВЫВОД: заявка (ручная выплата админом) ----------
  if (wdb) {
    wdb.addEventListener('click', async (e) => {
      if (!st.wd) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (wdb.dataset.busy) return;

      const coins = Math.floor(+String(wam.value || '').replace(/\s/g, ''));
      const details = String((q('#wxr-id') || {}).value || '').trim();
      if (!Number.isFinite(coins) || coins < 1) return say('Укажите количество монет', 'e');
      if (!/^(@?[A-Za-z0-9_]{4,32}|\d{5,15})$/.test(details)) return say('Укажите Telegram ID или @username xRocket', 'e');

      wdb.dataset.busy = '1'; wdb.disabled = true;
      try {
        const r = await api('/withdraw', { method: 'xrocket', coins, details });
        if (r && r.ok) {
          try { S.bal = Math.max(0, (+S.bal || 0) - coins); render(); } catch (_) {}
          say('Заявка создана: ' + r.usd + ' $ (вручную, до 24 ч)', 'w');
          wam.value = ''; updWdUsd();
          return;
        }
        const err = r && r.error;
        const m = {
          min: 'Сумма меньше минимальной', max: 'Превышен максимум вывода',
          balance: 'Недостаточно монет', pending: 'У вас уже есть активная заявка',
          no_details: 'Неверный Telegram ID / @username',
          wager_required: 'Сначала отыграйте ' + (r && r.wager ? Math.ceil(r.wager) : '') + ' монет',
          need_deposit: 'Для вывода нужен депозит за последние 7 дней (от ' + (r && r.min) + ' ₽)'
        };
        say(m[err] || 'Не удалось создать заявку', 'e');
      } finally { delete wdb.dataset.busy; wdb.disabled = false; }
    }, true);
  }
})();