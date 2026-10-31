const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.disableVerticalSwipes() } catch (e) { } }

const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fmt = n => {
  const num = Number(n);
  if (isNaN(num) || !isFinite(num)) return '0';
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
};
const h = (t = 'light') => { try { tg.HapticFeedback.impactOccurred(t) } catch (e) { } };
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;

// ▼▼▼ ВСТАВЬТЕ ВАШУ АКТУАЛЬНУЮ ССЫЛКУ ▼▼▼
const API_URL = 'https://personals-tournaments-featuring-towers.trycloudflare.com';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const CFG0 = {
  rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000,
  refDef: 50, refCap: 500,
  blogger_max_bonus: 10000, blogger_max_uses: 1000, blogger_dep_share: 10,
  manager_max_bonus: 50000, manager_max_uses: 5000, manager_dep_share: 15,
  botLink: 'https://t.me/velvetcasBot/app',
  yoo_rate: 1, yoo_min: 100, yoo_max: 50000, sbp_min: 500, yookassa_enabled: false
};

let S = { 
  user: {}, bal: 0, bets: 0, wins: 0, best: 0, hist: [], role: 'player', isAdmin: false, 
  refCount: 0, refDep: 0, refEarned: 0, cfg: CFG0, ban: 0, wager_req: 0,
  secret: { active: false, end: 0, keyReady: false, opened: false }
};
let selU = null;
let dMethod = 'usd';
let wMethod = 'crypto';
let evInterval = null;

async function api(path, data = {}) {
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ ...data, initData: (tg && tg.initData) || '', startParam: (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '' })
    });
    return await r.json();
  } catch (e) { toast('Нет связи с сервером', 'e'); return { ok: false }; }
}

async function loadFeed() {
  const r = await api('/feed');
  if (!r.ok || !$('#feed')) return;
  const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка', slot: 'Слоты', blackjack: 'Блэкджек' };
  if (!r.items || r.items.length === 0) { $('#feed').innerHTML = '<small style="color:var(--m); padding:10px; display:block; text-align:center;">Пока нет ставок</small>'; return; }
  $('#feed').innerHTML = r.items.map(x => {
    const pr = Math.round((x.win - x.bet) * 100) / 100; const mult = (x.win / x.bet).toFixed(2);
    return `<div class="fr"><span>${gn[x.game] || x.game}</span><span>${x.name || 'Игрок'}</span><span>${fmt(x.bet)}</span><span>x${mult}</span><b style="color:var(${pr > 0 ? '--ok' : '--bad'})">${pr > 0 ? '+' : ''}${fmt(pr)}</b></div>`;
  }).join('');
}
setInterval(loadFeed, 10000);

async function syncMe() {
  const r = await api('/me');
  if (!r.ok) return;
  S.user = r.user || {};
  S.bal = Number(r.user.balance) || 0;
  S.bets = r.user.bets; S.wins = r.user.wins || 0; S.best = r.user.best_win || 0;
  S.role = r.user.role; S.ban = r.user.banned;
  S.refCount = r.user.ref_count || 0; S.refDep = r.user.ref_dep || 0; S.refEarned = r.user.ref_earned || 0;
  S.wager_req = r.user.wager_req || 0;
  S.isAdmin = !!r.admin;
  if (r.cfg) S.cfg = { ...CFG0, ...r.cfg };
  
  if (r.event && r.event.secret) {
    S.secret = r.event.secret;
    renderSecretEvent();
    updateSecretTimer();
    loadSecretFeed();
  }
  
  render(); dUI(); wUI(); loadFeed();
  
  if (S.isAdmin) { const adm = $('#adm'); if (adm) { adm.style.display = 'block'; adm.innerHTML = 'Админ-панель'; adm.onclick = () => openAdmin(); } }
  
  updatePanels();
  updateRankUI();
}

// ================== SECRET EVENT ==================
let sevInterval = null;

function renderSecretEvent() {
  const ev = S.secret || { active: false };
  
  // Показать/скрыть nav кнопку
  const navBtn = $('#nav-e');
  if (navBtn) navBtn.style.display = ev.active ? 'flex' : 'none';
  
  // Header таймер
  const hdr = $('#event-timer');
  if (hdr) hdr.classList.toggle('on', !!ev.active);
  
  // Баннер в профиле
  const banner = $('#user-x2-banner');
  if (banner) banner.classList.toggle('on', !!(ev.active && ev.keyReady && !ev.opened));
  
  // Состояние сейфа
  const box = $('#safe-box');
  const openBtn = $('#sev-open');
  const depBtn = $('#sev-dep');
  const status = $('#sev-status');
  if (!box) return;
  
  if (!ev.active) {
    if (status) { status.textContent = 'Ивент закончен'; status.style.color = 'var(--m)'; }
    if (openBtn) openBtn.style.display = 'none';
    if (depBtn) depBtn.style.display = 'none';
    box.classList.remove('ready', 'opening');
    return;
  }
  
  if (ev.opened) {
    if (status) { status.textContent = '✅ Вы уже открыли свой сейф'; status.style.color = 'var(--ok)'; }
    if (openBtn) openBtn.style.display = 'none';
    if (depBtn) depBtn.style.display = 'none';
    box.classList.remove('ready');
    box.textContent = '✅';
  } else if (ev.keyReady) {
    if (status) { status.textContent = '🗝 У вас есть ключ! Нажмите на сейф'; status.style.color = '#ffd24a'; }
    if (openBtn) openBtn.style.display = 'block';
    if (depBtn) depBtn.style.display = 'none';
    box.classList.add('ready');
    box.textContent = '🔐';
  } else {
    if (status) { status.textContent = 'Сделайте депозит от 10₽ — получите ключ'; status.style.color = 'var(--m)'; }
    if (openBtn) openBtn.style.display = 'none';
    if (depBtn) depBtn.style.display = 'block';
    box.classList.remove('ready');
    box.textContent = '🔒';
  }
  
  // Таблица наград
  const table = $('#sev-table');
  if (table) {
    const tiers = [
      { emoji:'🥉', title:'Бронза',   sub:'x0.5 + 10' },
      { emoji:'🥈', title:'Серебро',  sub:'x1.0 + 25' },
      { emoji:'🥇', title:'Золото',   sub:'x2.0 + 50' },
      { emoji:'💎', title:'Платина',  sub:'x5.0 + 150' },
      { emoji:'🌟', title:'ЛЕГЕНДА',  sub:'x10 + 500' },
    ];
    table.innerHTML = tiers.map(t => `
      <div class="safe-row">
        <div class="safe-row-emoji">${t.emoji}</div>
        <div class="safe-row-info"><b>${t.title}</b><small>${t.sub} к депозиту</small></div>
      </div>
    `).join('');
  }
}

function updateSecretTimer() {
  clearInterval(sevInterval);
  const ev = S.secret;
  if (!ev || !ev.active) return;
  const tick = () => {
    const left = ev.end - Date.now();
    const el = $('#sev-timer');
    const hdr = $('#ev-time');
    if (left <= 0) {
      clearInterval(sevInterval);
      if (el) el.textContent = 'Закончился';
      if (hdr) hdr.textContent = '00:00:00';
      syncMe();
      return;
    }
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const txt = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    if (el) el.textContent = txt;
    if (hdr) hdr.textContent = txt;
  };
  tick();
  sevInterval = setInterval(tick, 1000);
}

async function loadSecretEvent() {
  const r = await api('/event/status');
  if (!r.ok) return;
  S.secret = {
    active: r.active,
    end: r.end,
    keyReady: !!r.keyReady,
    opened: !!r.opened,
    depCoins: r.depCoins || 0,
    rewardId: r.rewardId || ''
  };
  renderSecretEvent();
  updateSecretTimer();
  loadSecretFeed();
}

async function loadSecretFeed() {
  const el = $('#sev-feed');
  if (!el) return;
  const r = await api('/event/feed');
  if (!r.ok || !r.items) return;
  if (!r.items.length) {
    el.innerHTML = '<small style="color:var(--m)">Пока никто не открыл сейф</small>';
    return;
  }
  el.innerHTML = r.items.map(x => `
    <div class="hr" style="border-color:rgba(255,255,255,.05)">
      <span>${x.emoji} ${x.name}</span>
      <b style="color:#ffd24a">+${fmt(x.amount)}</b>
    </div>
  `).join('');
}

async function openSafe() {
  const box = $('#safe-box');
  const btn = $('#sev-open');
  if (!box || !btn || btn.disabled) return;
  if (!S.secret || !S.secret.keyReady || S.secret.opened) return;
  
  btn.disabled = true;
  btn.textContent = 'Открываем...';
  box.classList.add('opening');
  
  const flash = document.createElement('div');
  flash.className = 'safe-flash';
  document.body.appendChild(flash);
  
  const r = await api('/event/open-safe');
  
  setTimeout(() => {
    flash.classList.add('on');
    setTimeout(() => { flash.classList.remove('on'); setTimeout(() => flash.remove(), 400); }, 200);
  }, 850);
  
  setTimeout(() => {
    box.classList.remove('opening', 'ready');
    
    if (r.ok) {
      const rb = $('#sev-reward-box');
      if (rb) {
        rb.classList.add('on');
        $('#sev-emoji').textContent = r.emoji;
        $('#sev-title').textContent = r.title;
        $('#sev-amount').textContent = '+' + fmt(r.amount);
        $('#sev-mult').textContent = `База: ${fmt(r.basis)} × ${r.mult} + ${r.flat}`;
      }
      box.textContent = r.emoji;
      
      toast(`${r.emoji} ${r.title}! +${fmt(r.amount)} монет`, 'w');
      if (r.amount >= 1000) h('heavy');
      
      S.bal = r.balance;
      S.secret.keyReady = false;
      S.secret.opened = true;
      render();
      renderSecretEvent();
      loadSecretFeed();
      const banner = $('#user-x2-banner');
      if (banner) banner.classList.remove('on');
    } else {
      toast('Ошибка открытия', 'e');
      if (r.error === 'no_key') toast('Уже открыто или нет ключа', 'e');
      if (r.error === 'inactive') toast('Ивент неактивен', 'e');
    }
    
    btn.disabled = false;
    btn.textContent = '🗝 ОТКРЫТЬ СЕЙФ';
  }, 1500);
}

// Кнопки
if ($('#safe-box')) $('#safe-box').onclick = () => { if (S.secret && S.secret.keyReady) openSafe(); };
if ($('#sev-open')) $('#sev-open').onclick = () => openSafe();
if ($('#sev-dep')) $('#sev-dep').onclick = () => {
  dMethod = 'rub';
  tab('p');
  setTimeout(() => {
    $$('#dmethod button').forEach(z => z.classList.toggle('sel', z.dataset.m === 'rub'));
    if ($('#dam')) $('#dam').value = 10;
    dUI();
  }, 100);
};
// ==================================================

let tt;
function toast(m, k) { const e = $('#toast'); if (!e) return; e.textContent = m; e.className = 'on ' + (k || ''); clearTimeout(tt); tt = setTimeout(() => e.className = '', 2200); }

function render() {
  if ($('#bal')) $('#bal').textContent = fmt(S.bal);
  if ($('#pbal')) $('#pbal').textContent = fmt(S.bal);
  if ($('#scr')) $('#scr').textContent = fmt(S.bal);
  if ($('#urole')) { $('#urole').textContent = S.role === 'player' ? 'Игрок' : S.role === 'blogger' ? 'Блогер' : 'Менеджер'; $('#urole').className = 'role ' + S.role; }
  if ($('#rn')) $('#rn').textContent = S.refCount;
  if ($('#rd')) $('#rd').textContent = fmt(S.refDep || 0);
  if ($('#re')) $('#re').textContent = fmt(S.refEarned || 0);
  if ($('#rbv')) $('#rbv').textContent = fmt(S.cfg.refDef || 50);
  if ($('#s1')) $('#s1').textContent = S.bets;
  if ($('#s2')) $('#s2').textContent = S.wins;
  if ($('#s3')) $('#s3').textContent = fmt(S.best);
  if ($('#hist')) $('#hist').innerHTML = S.hist.length ? S.hist.map(r=>`<div class="hr"><span>${r[0]}</span><b style="color:var(${r[1]>0?'--ok':'--bad'})">${r[1]>0?'+':''}${fmt(r[1])}</b></div>`).join('') : '<small style="color:var(--m)">Пока пусто</small>';
  
  const U = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { first_name: 'Гость', id: 0, photo_url: null, username: '' };
  if ($('#un')) $('#un').textContent = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Игрок';
  if ($('#uid')) $('#uid').textContent = (U.username ? '@' + U.username + ' · ' : '') + 'ID ' + U.id;
  if ($('#av')) { if (U.photo_url) $('#av').innerHTML = `<img src="${U.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`; else $('#av').textContent = (U.first_name || '?')[0].toUpperCase(); }
  
  if ($('#ref-link-text')) {
    const link = getMyRefLink();
    $('#ref-link-text').textContent = link || '—';
  }
}

// ================= ЗВАНИЯ И КЭШБЭК =================
function getRankInfo(depRub) {
  if (depRub >= 10000) return { name: 'Легенда', rate: 12, color: '#ffd23f', next: 100000, prev: 10000, perks: true };
  if (depRub >= 5000) return { name: 'Аметист', rate: 10, color: '#c084fc', next: 10000, prev: 5000, perks: true };
  if (depRub >= 1000) return { name: 'Прошка', rate: 7, color: '#4ade80', next: 5000, prev: 1000, perks: false };
  if (depRub >= 100) return { name: 'Новичок', rate: 5, color: '#60a5fa', next: 1000, prev: 100, perks: false };
  return { name: 'Без звания', rate: 0, color: '#9b93cf', next: 100, prev: 0, perks: false };
}

function updateRankUI() {
  const dep = S.user.dep_rub || 0;
  const r = getRankInfo(dep);

  if ($('#rank-name')) {
    $('#rank-name').textContent = r.name;
    $('#rank-name').style.background = r.color;
    $('#rank-name').style.color = '#000';
    $('#rank-cashback').textContent = r.rate + '%';
    
    let pct = 0;
    if (r.next > 0) {
      if (dep >= r.next) pct = 100;
      else pct = Math.min(100, Math.max(0, (dep - r.prev) / (r.next - r.prev) * 100));
    }
    $('#rank-progress').style.width = pct + '%';
    $('#rank-progress').style.background = `linear-gradient(90deg, ${r.color}, #fff)`;
    
    $('#rank-current').textContent = fmt(dep) + ' ₽';
    if (dep >= 10000) {
      $('#rank-next').textContent = 'Максимальное звание';
    } else {
      $('#rank-next').textContent = 'До след.: ' + fmt(r.next - dep) + ' ₽';
    }
    
    if (r.perks) $('#rank-perks').style.display = 'block';
    else $('#rank-perks').style.display = 'none';
  }

  if ($('#cb-rank-badge')) {
    $('#cb-rank-badge').textContent = 'Ваш кэшбэк: ' + r.rate + '%';
    $('#cb-rank-badge').style.background = r.color;
    $('#cb-rank-badge').style.color = '#000';
  }

  if ($('#cb-timer') && $('#cb-claim-btn')) {
    const last = S.user.last_cashback || 0;
    const next = last + 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (now >= next - 1000 * 60 * 60) {
      $('#cb-timer').textContent = 'Кэшбэк доступен!';
      $('#cb-timer').style.color = 'var(--ok)';
      $('#cb-claim-btn').disabled = false;
      $('#cb-claim-btn').textContent = 'Забрать кэшбэк';
    } else {
      const left = next - now;
      const d = Math.floor(left / (24*3600000));
      const h = Math.floor((left % (24*3600000)) / 3600000);
      $('#cb-timer').textContent = `Доступен через: ${d}д ${h}ч`;
      $('#cb-timer').style.color = 'var(--m)';
      $('#cb-claim-btn').disabled = true;
      $('#cb-claim-btn').textContent = 'Уже получен';
    }
  }
}

if ($('#cb-claim-btn')) {
  $('#cb-claim-btn').onclick = async () => {
    const r = await api('/cashback/claim');
    if (r.ok) {
      toast(`+${fmt(r.amount)} монет! Отыграть: ${fmt(r.wager)}`, 'w');
      syncMe();
    } else {
      if (r.error === 'time') toast('Кэшбэк еще не начислен', 'e');
      else if (r.error === 'no_dep') toast('У вас не было депозитов за неделю', 'e');
      else if (r.error === 'no_rank') toast('Нужно сделать первый депозит', 'e');
      else toast('Ошибка', 'e');
    }
  };
}
// ===================================================

// ---------- ДЕПОЗИТ ----------
const dAmt = () => { const v = Math.round(parseFloat(String($('#dam').value).replace(',', '.')) * 100) / 100; return v > 0 ? v : 0; };

function dUI() {
  if (!$('#dam') || !$('#dmethod')) return;
  const amt = dAmt();
  if (dMethod === 'usd') {
    if ($('#dbadge')) $('#dbadge').textContent = 'CryptoBot';
    if ($('#dlabel')) $('#dlabel').textContent = 'Сумма пополнения, $';
    if ($('#dmin')) $('#dmin').textContent = 'От 1 до 1000 $';
    if ($('#dnote')) $('#dnote').innerHTML = 'Оплата через @CryptoBot. Курс: <b>1 $ = ' + fmt(S.cfg.rate) + ' монет</b>';
    if ($('#dcoins')) $('#dcoins').textContent = fmt(Math.floor(amt * S.cfg.rate));
  } else {
    const rate = +S.cfg.yoo_rate || 1;
    const isSecretActive = S.secret && S.secret.active;
    const min = isSecretActive ? 10 : (+S.cfg.yoo_min || 100);
    const max = +S.cfg.yoo_max || 50000;
    if ($('#dbadge')) {
      $('#dbadge').textContent = isSecretActive ? '🔐 SECRET · 10₽' : 'ЮKassa';
      if (isSecretActive) $('#dbadge').style.background = 'linear-gradient(135deg,#ffd24a,#e09a12)';
      else $('#dbadge').style.background = '';
    }
    if ($('#dlabel')) $('#dlabel').textContent = 'Сумма пополнения, ₽';
    if ($('#dmin')) {
      if (isSecretActive) {
        $('#dmin').innerHTML = 'От <b style="color:#ffd24a">10</b> до ' + fmt(max) + ' ₽ · <span style="color:#ffd24a">🎭 SECRET EVENT</span>';
      } else {
        $('#dmin').textContent = 'От ' + fmt(min) + ' до ' + fmt(max) + ' ₽';
      }
    }
    if ($('#dnote')) $('#dnote').innerHTML = 'Оплата картой через ЮKassa. Курс: <b>1 ₽ = ' + rate + ' монет</b>';
    if ($('#dcoins')) $('#dcoins').textContent = fmt(Math.floor(amt * rate));
  }
}

if ($('#dam')) {
  $('#dam').oninput = () => { const e = $('#dam'), v = e.value.replace(/[^0-9.,]/g, ''); if (v !== e.value) e.value = v; dUI(); };
}

if ($('#dmethod')) {
  $$('#dmethod button').forEach(b => b.onclick = () => {
    if (b.dataset.m === 'rub' && !S.cfg.yookassa_enabled) { toast('Оплата картой временно недоступна', 'e'); return; }
    dMethod = b.dataset.m;
    $$('#dmethod button').forEach(z => z.classList.toggle('sel', z === b));
    dUI();
  });
}

if ($('#dbtn')) {
  $('#dbtn').onclick = async () => {
    const amt = dAmt();
    if (dMethod === 'usd') {
      if (amt < 1 || amt > 1000) { toast('Сумма от 1 до 1000 $', 'e'); return; }
      const r = await api('/invoice', { usd: amt });
      if (r.ok && r.url) {
        if (tg && tg.openTelegramLink) tg.openTelegramLink(r.url); else window.open(r.url, '_blank');
        toast('Счёт создан. Ожидаем оплату...', 'w');
        const iv = setInterval(async () => {
          const chk = await api('/claim', { id: r.id });
          if (chk.status === 'paid') { clearInterval(iv); syncMe(); toast('Успешно! +' + chk.coins + ' монет' + (chk.msg || ''), 'w'); }
          else if (chk.status === 'expired') { clearInterval(iv); toast('Счёт истек', 'e'); }
        }, 5000);
      } else toast('Ошибка создания счёта', 'e');
    } else {
      if (!S.cfg.yookassa_enabled) { toast('Оплата картой временно недоступна', 'e'); return; }
      const isSecretActive = S.secret && S.secret.active;
      const min = isSecretActive ? 10 : (+S.cfg.yoo_min || 100);
      const max = +S.cfg.yoo_max || 50000;
      if (amt < min || amt > max) { toast('Сумма от ' + fmt(min) + ' до ' + fmt(max) + ' ₽', 'e'); return; }
      const r = await api('/yookassa/create', { rub: amt });
      if (r.ok && r.url) {
        if (tg && tg.openLink) tg.openLink(r.url); else window.open(r.url, '_blank');
        toast('Счёт создан. Ожидаем оплату...', 'w');
        const iv = setInterval(async () => {
          const chk = await api('/yookassa/claim', { id: r.id });
          if (chk.status === 'paid') { clearInterval(iv); syncMe(); toast('Успешно! +' + chk.coins + ' монет' + (chk.msg || ''), 'w'); }
          else if (chk.status === 'canceled') { clearInterval(iv); toast('Платёж отменён', 'e'); }
        }, 5000);
      } else {
        toast(r.error === 'disabled' ? 'Оплата картой временно недоступна' :
              r.error === 'amount' ? 'Проверьте сумму' : 'Ошибка создания счёта', 'e');
      }
    }
  };
}

// ---------- ВЫВОД ----------
const wAmt = () => Math.floor(+($('#wam')?.value || 0));

function wUI() {
  if (!$('#wbadge')) return;
  const c = wAmt();
  const rate = +S.cfg.rate || 87;
  const yooRate = +S.cfg.yoo_rate || 1;
  const sbpMin = +S.cfg.sbp_min || 500;

  if (S.wager_req && S.wager_req > 0) {
    if ($('#wager-info')) {
      $('#wager-info').style.display = 'block';
      $('#wager-left').textContent = fmt(S.wager_req);
    }
  } else {
    if ($('#wager-info')) $('#wager-info').style.display = 'none';
  }

  if (wMethod === 'crypto') {
    if ($('#wbadge')) $('#wbadge').textContent = 'CryptoBot';
    if ($('#wlabel')) $('#wlabel').textContent = 'Сколько монет вывести';
    if ($('#wnote')) $('#wnote').innerHTML = 'Выплата в USDT в @CryptoBot после проверки. Курс: <b>1 $ = ' + fmt(rate) + ' монет</b>';
    if ($('#wmin')) $('#wmin').textContent = 'Минимум ' + fmt(Math.ceil(S.cfg.wdMin * rate)) + ' монет (' + S.cfg.wdMin + ' $)';
    if ($('#wusd')) $('#wusd').textContent = (Math.floor(c / rate * 100) / 100).toFixed(2);
    if ($('#wusd-label')) $('#wusd-label').textContent = '$ к получению';
    if ($('#wphone-box')) $('#wphone-box').style.display = 'none';
  } else {
    if ($('#wbadge')) $('#wbadge').textContent = 'СБП (₽)';
    if ($('#wlabel')) $('#wlabel').textContent = 'Сколько монет вывести';
    if ($('#wnote')) $('#wnote').innerHTML = 'Выплата на карту/телефон через СБП после проверки админом. Курс: <b>1 ₽ = ' + yooRate + ' монет</b>';
    if ($('#wmin')) $('#wmin').textContent = 'Минимум ' + fmt(Math.ceil(sbpMin * yooRate)) + ' монет (' + fmt(sbpMin) + ' ₽)';
    const rub = Math.floor(c / yooRate * 100) / 100;
    if ($('#wusd')) $('#wusd').textContent = rub.toFixed(2);
    if ($('#wusd-label')) $('#wusd-label').textContent = '₽ к получению';
    if ($('#wphone-box')) $('#wphone-box').style.display = 'block';
  }

const x2Banner = $('#user-x2-banner');
  if (x2Banner && S.user) {
    const hasUsed = S.user.used_x2_dep || 0;
    if (S.event && S.event.active && !hasUsed) {
      x2Banner.style.display = 'block';
    } else {
      x2Banner.style.display = 'none';
    }
  }
}

if ($('#wam')) {
  $('#wam').oninput = () => { 
    const e = $('#wam'), v = e.value.replace(/\D/g, ''); 
    if (v !== e.value) e.value = v; 
    wUI(); 
  };
}

if ($('#wmax')) {
  $('#wmax').onclick = () => {
    const minCoins = wMethod === 'crypto' 
      ? Math.ceil(S.cfg.wdMin * (+S.cfg.rate || 87)) 
      : Math.ceil((+S.cfg.sbp_min || 500) * (+S.cfg.yoo_rate || 1));
      
    const maxCoins = Math.floor(S.bal);
    
    if (maxCoins < minCoins) {
      toast('Недостаточно средств для минимального вывода', 'e');
      return;
    }
    
    $('#wam').value = maxCoins;
    wUI();
  };
}

if ($('#wmethod')) {
  $$('#wmethod button').forEach(b => b.onclick = () => {
    wMethod = b.dataset.m;
    $$('#wmethod button').forEach(z => z.classList.toggle('sel', z === b));
    wUI();
  });
}

async function loadWithdrawals() {
  if (!$('#wdl')) return;
  const r = await api('/my');
  if (!r.ok) return;
  if (!r.items || !r.items.length) {
    $('#wdl').innerHTML = '<div style="text-align:center; padding:20px; background:rgba(0,0,0,.2); border-radius:14px; color:var(--m); font-size:13px;">Заявок пока нет</div>';
    return;
  }
  $('#wdl').innerHTML = r.items.map(x => {
    const stText = x.status === 'pending' ? 'В обработке' : x.status === 'paid' ? 'Выплачено' : 'Отклонено';
    const stColor = x.status === 'pending' ? '#fbbf24' : x.status === 'paid' ? 'var(--ok)' : 'var(--bad)';
    const stBg = x.status === 'pending' ? 'rgba(251,191,36,.15)' : x.status === 'paid' ? 'rgba(74,222,128,.15)' : 'rgba(255,84,112,.15)';
    
    const methodIcon = x.method === 'sbp' ? '🏦' : '💎';
    
    const amountText = x.method === 'sbp'
      ? `<b>${fmt(x.coins)}</b> монет = <b>${fmt(x.rub || 0)} ₽</b>`
      : `<b>${fmt(x.coins)}</b> монет = <b>$${Number(x.usd || 0).toFixed(2)}</b>`;
      
    return `
      <div style="background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:12px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div>
          <div style="font-size:14px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            <span style="font-size:16px;">${methodIcon}</span> ${amountText}
          </div>
          <div style="font-size:11px; color:var(--m);">
            ${new Date(x.created_at).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
            ${x.details ? `<br><span style="color:var(--g)">📋 ${x.details}</span>` : ''}
          </div>
        </div>
        <div style="background:${stBg}; color:${stColor}; border:1px solid ${stColor}40; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:800; white-space:nowrap;">
          ${stText}
        </div>
      </div>
    `;
  }).join('');
}

if ($('#wdb')) {
  $('#wdb').onclick = async () => {
    const c = wAmt();
    const rate = +S.cfg.rate || 87;
    const yooRate = +S.cfg.yoo_rate || 1;
    const sbpMin = +S.cfg.sbp_min || 500;

    const minCoins = wMethod === 'crypto'
      ? Math.ceil(S.cfg.wdMin * rate)
      : Math.ceil(sbpMin * yooRate);

    if (c < minCoins) { toast('Минимум ' + fmt(minCoins) + ' монет', 'e'); return; }
    if (c > S.bal) { toast('Недостаточно средств', 'e'); return; }

    let details = '';
    if (wMethod === 'sbp') {
      const phone = ($('#wphone')?.value || '').trim();
      const bank = ($('#wbank')?.value || '').trim();
      if (!phone || phone.length < 5) { toast('Укажите номер телефона', 'e'); return; }
      details = phone + (bank ? ' | ' + bank : '');
    }

    const r = await api('/withdraw', { coins: c, method: wMethod, details });
    if (r.ok) {
      toast('Заявка отправлена', 'w');
      S.bal -= c; render();
      $('#wam').value = '';
      if ($('#wphone')) $('#wphone').value = '';
      if ($('#wbank')) $('#wbank').value = '';
      wUI();
      loadWithdrawals();
    } else {
      const errs = {
        'need_deposit': 'Для вывода нужен депозит за последние 7 дней',
        'min': 'Сумма меньше минимальной',
        'max': 'Сумма больше максимальной',
        'pending': 'У вас уже есть заявка в обработке',
        'balance': 'Недостаточно средств',
        'no_phone': 'Укажите телефон',
        'wager_required': 'Нужно отыграть вейджер!'
      };
      toast(errs[r.error] || 'Ошибка вывода', 'e');
    }
  };
}

function getBet(id){
  const b = Math.floor(+$(id).value * 100) / 100;
  if(!(b >= 1)){ toast('Мин. ставка — 1', 'e'); return 0; }
  if(S.ban){ toast('Заблокирован', 'e'); return 0; }
  if(b > S.cfg.maxBet){ toast('Макс. ставка — ' + fmt(S.cfg.maxBet), 'e'); return 0; }
  if(b > S.bal){ toast('Недостаточно средств', 'e'); return 0; }
  return b;
}

async function playGame(game, bet, params) {
  if (S.ban) { toast('Заблокирован', 'e'); return null; }
  const alreadyDeducted = params && params.alreadyDeducted;
  if (!alreadyDeducted && (!params || (params.action !== 'climb' && params.action !== 'cashout'))) {
      if (bet > S.bal) { toast('Недостаточно средств', 'e'); return null; }
      S.bal = Math.round((S.bal - bet) * 100) / 100; render();
  }
  const r = await api('/bet', { game, bet, params });
  if (!r.ok) { await syncMe(); toast('Ошибка ставки', 'e'); return null; }
  const win = r.result.win;
  if (!alreadyDeducted && (!params || (params.action !== 'climb' && params.action !== 'cashout'))) {
      S.bets++; if (win > bet) S.wins++;
      S.best = Math.max(S.best || 0, Math.round((win - bet) * 100) / 100);
      const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка', slot: 'Слоты', blackjack: 'Блэкджек' }[game] || game;
      S.hist.unshift([gn, Math.round((win - bet) * 100) / 100]); S.hist = S.hist.slice(0, 15);
  }
  render(); loadFeed();
  return { ...r.result, newBalance: r.balance };
}

$$('.bet[data-id]').forEach(d => {
  const i = d.dataset.id;
  d.innerHTML = `<input id="${i}" type="number" inputmode="decimal" value="10"><button data-k="h">½</button><button data-k="d">×2</button><button data-k="m">Макс</button>`;
  d.querySelectorAll('button').forEach(b => b.onclick = () => { const e = $('#' + i), v = +e.value || 0, k = b.dataset.k; e.value = k == 'h' ? Math.max(1, Math.floor(v / 2)) : k == 'd' ? Math.min(Math.floor(S.bal), v * 2) : Math.floor(S.bal); });
});

function tab(t) { 
  $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t)); 
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t))); 
  if(t == 'p') { dUI(); wUI(); }
  if(t == 'b') { loadGiveaways(); updateRankUI(); }
  if(t == 'e') { loadSecretEvent(); }
}
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => {
  if (c.dataset.t === 'bj') { openBlackjack(); return; }
  tab(c.dataset.t);
});

// ---------- БОНУСЫ ----------
if ($('#bw')) $('#bw').onclick = async () => {
  const r = await api('/bonus/start');
  if (r.ok) { toast('+100 монет', 'w'); syncMe(); }
  else if (r.error === 'not_subscribed') {
    toast('Подпишитесь на канал @velvetcas', 'e');
    if (tg && tg.openTelegramLink) tg.openTelegramLink('https://t.me/velvetcas');
  }
  else toast('Бонус уже получен', 'e');
};
if ($('#bd')) $('#bd').onclick = async () => { const r = await api('/bonus/daily'); if (r.ok) { toast('+' + r.amount + ' монет', 'w'); syncMe(); } else toast('Приходите завтра', 'e'); };

if ($('#pcb')) $('#pcb').onclick = async () => {
  const c = $('#pc').value.trim().toUpperCase(); if (!c) return;
  const r = await api('/promo/activate', { code: c });
  if (r.ok) {
    if (r.type === 'deposit') toast('Активирован бонус к депозиту: +' + r.bonus + '%', 'w');
    else { S.bal += r.bonus; render(); toast('+' + fmt(r.bonus) + ' по промокоду', 'w'); }
    $('#pc').value = '';
  } else {
    if (r.error === 'already_active') toast('У вас уже есть активный бонус к депозиту', 'e');
    else toast(r.error === 'used' ? 'Уже активировали' : r.error === 'limit' ? 'Лимит' : 'Не найден', 'e');
  }
};

// ---------- РЕФЕРАЛЬНАЯ ССЫЛКА ----------
function getMyRefLink() {
  const U = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0 };
  if (!U.id) return '';
  let base = S.cfg.botLink || 'https://t.me/velvetcasBot/app';
  base = base.split('?')[0]; 
  return base + '?startapp=ref_' + U.id;
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } 
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta); return ok;
    } catch (err) { return false; }
  }
}

if ($('#rcp')) {
  $('#rcp').onclick = async () => {
    const link = getMyRefLink(); if (!link) return;
    const ok = await copyToClipboard(link);
    toast(ok ? 'Ссылка скопирована' : 'Ошибка', ok ? 'w' : 'e');
    h('light');
  };
}

if ($('#rsh')) {
  $('#rsh').onclick = () => {
    const link = getMyRefLink(); if (!link) return;
    const text = `Присоединяйся к Velvet! 🎰\n\nПолучи бонус за регистрацию:\n${link}`;
    
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('Присоединяйся к Velvet! 🎰\n\nПолучи бонус за регистрацию:'));
    } else if (navigator.share) {
      navigator.share({ title: 'Velvet', text }).catch(() => {});
    } else {
      copyToClipboard(text).then(ok => toast(ok ? 'Текст скопирован' : 'Ошибка', ok ? 'w' : 'e'));
    }
  };
}

// ---------- ПАНЕЛЬ БЛОГЕРА ----------
async function updatePanels() {
  const show = S.isAdmin || S.role === 'blogger' || S.role === 'manager';
  ['#pp', '#pm'].forEach(sel => { const el = $(sel); if (el) el.style.display = show ? 'block' : 'none'; });
  const ppt = $('#ppt');
  if (ppt) ppt.textContent = S.isAdmin ? 'Панель администратора' : S.role === 'blogger' ? 'Панель блогера' : S.role === 'manager' ? 'Панель менеджера' : 'Панель';
  if (show) { loadMyPromos(); loadPanelStats(); }
}

async function loadPanelStats() {
  if (!$('#pp-users')) return;
  const r = await api('/panel/stats');
  if (!r.ok) return;
  $('#pp-users').textContent = fmt(r.totalUsers);
  $('#pp-gws').textContent = r.activeGws;
  if ($('#pp-all')) $('#pp-all').textContent = r.myGwsAll;
  if ($('#pp-pool')) $('#pp-pool').textContent = fmt(r.myPool);
}

async function loadMyPromos() {
  if (!$('#pl')) return;
  const r = await api('/promo/my');
  if (!r.ok || !r.items || r.items.length === 0) {
    $('#pl').innerHTML = '<small style="color:var(--m);display:block;text-align:center;padding:8px 0">Промокодов пока нет</small>';
    if ($('#p1')) $('#p1').textContent = '0';
    if ($('#p2')) $('#p2').textContent = '0';
    if ($('#p3')) $('#p3').textContent = '0';
    return;
  }
  let totalUsed = 0, totalCoins = 0;
  $('#pl').innerHTML = r.items.map(x => {
    totalUsed += x.used; totalCoins += x.bonus * x.used;
    return `<div class="pr"><b>${x.code}</b><small>${x.type === 'deposit' ? '+' + x.bonus + '%' : '+' + x.bonus + ' монет'} · ${x.used}/${x.max_uses}</small><button onclick="window.delPromo('${x.code}')">×</button></div>`;
  }).join('');
  if ($('#p1')) $('#p1').textContent = totalUsed;
  if ($('#p2')) $('#p2').textContent = fmt(totalCoins);
  if ($('#p3')) $('#p3').textContent = r.items.length;
}

window.delPromo = async (code) => {
  if (!confirm('Удалить промокод ' + code + '?')) return;
  const r = await api('/promo/delete', { code });
  if (r.ok) { toast('Удалён', 'w'); loadMyPromos(); syncMe(); }
  else if (r.error === 'used') toast('Уже активировали — удалить нельзя', 'e');
  else toast('Ошибка', 'e');
};

if ($('#npc-btn')) {
  $('#npc-btn').onclick = async () => {
    const code = $('#npc').value.trim().toUpperCase();
    const type = $('#npt').value;
    const bonus = +$('#npb').value;
    const uses = +$('#npu').value;
    if (!code || !/^[A-Z0-9]{3,20}$/.test(code)) { toast('Код: A–Z, 0–9, 3–20 символов', 'e'); return; }
    if (bonus < 1) { toast('Бонус > 0', 'e'); return; }
    if (uses < 1)  { toast('Активаций > 0', 'e'); return; }
    const r = await api('/promo/create', { code, bonus, uses, type });
    if (r.ok) {
      toast('Промокод создан', 'w');
      $('#npc').value = ''; $('#npb').value = ''; $('#npu').value = '';
      loadMyPromos(); syncMe();
    } else {
      toast(
        r.error === 'money'       ? `Недостаточно средств (нужно ${r.need})` :
        r.error === 'exists'      ? 'Такой код уже есть' :
        r.error === 'limit_bonus' ? `Бонус больше лимита (${r.max})` :
        r.error === 'limit_uses'  ? `Активаций больше лимита (${r.max})` :
        r.error === 'forbidden'   ? 'Нет прав' :
        r.error === 'data'        ? 'Проверьте поля' : 'Ошибка', 'e'
      );
    }
  };
}

// ================= BLACKJACK =================
let bjWrap = null;

function openBlackjack() {
  if (!bjWrap) {
    bjWrap = document.createElement('div');
    bjWrap.id = 'bj-wrap';
    bjWrap.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0b0618;overflow:hidden;';
    bjWrap.innerHTML = `
      <button id="bj-close" style="position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:10px;z-index:10001;width:42px;height:42px;border-radius:50%;background:linear-gradient(#ff5a7e,#b3123a);color:#fff;border:3px solid #0b0618;box-shadow:0 4px 0 #0b0618;font:900 22px system-ui;line-height:1;cursor:pointer;display:grid;place-items:center;">×</button>
      <iframe id="bj-frame" src="blackjack.html" style="width:100%;height:100%;border:0;display:block;background:#0b0618;" allow="autoplay"></iframe>
    `;
    document.body.appendChild(bjWrap);

    const close = () => {
      bjWrap.style.display = 'none';
      syncMe();
    };

    document.getElementById('bj-close').onclick = close;

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'bj-close') close();
    });

    const frame = document.getElementById('bj-frame');
    frame.addEventListener('load', () => sendBjInit());
    setTimeout(() => sendBjInit(), 500);
    setTimeout(() => sendBjInit(), 1500);
  } else {
    bjWrap.style.display = 'block';
    sendBjInit();
  }
}

function sendBjInit() {
  const frame = document.getElementById('bj-frame');
  if (!frame || !frame.contentWindow) return;
  const tg = window.Telegram && window.Telegram.WebApp;
  const msg = {
    type: 'bj-init',
    initData: (tg && tg.initData) || '',
    apiUrl: API_URL
  };
  try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {}
  setTimeout(() => { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} }, 200);
  setTimeout(() => { try { frame.contentWindow.postMessage(msg, '*'); } catch (e) {} }, 1000);
}
// ==============================================

// ---------- РОЗЫГРЫШИ ----------
async function loadGiveaways() {
  const r = await api('/giveaways/list');
  if (!r.ok) return;
  const card = $('#giveaways-card'), list = $('#giveaways-list');
  if (!r.items || r.items.length === 0) { if (card) card.style.display = 'none'; return; }
  if (card) card.style.display = 'block';
  if (!list) return;
  list.innerHTML = r.items.map(x => {
    const timeLeft = Math.max(0, x.ends_at - Date.now());
    const sec = Math.floor(timeLeft / 1000);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    const hh = Math.floor(mm / 60);
    const timeStr = hh > 0 ? `${hh}ч ${mm % 60}м ${ss}с` : `${mm}м ${ss}с`;
    const badge = x.isAdmin ? 'Официальный розыгрыш' : x.isOwn ? 'Ваш розыгрыш' : 'Розыгрыш от партнёра';
    const joinedBtn = x.isOwn ? '<span style="color:var(--m);font-size:12px;">Вы создатель</span>' : `<button class="btn" onclick="joinGiveaway(${x.id})" ${x.joined ? 'disabled' : ''} style="min-height:36px; font-size:13px; ${x.joined ? 'background:#333;' : ''}">${x.joined ? 'Вы участвуете' : 'Участвовать'}</button>`;
    return `
      <div style="background:rgba(0,0,0,.3); border-radius:15px; padding:15px; margin-bottom:10px; border:1px solid ${x.isOwn ? 'rgba(193,155,255,.5)' : 'var(--ln)'};">
        <div class="shead" style="margin-bottom:5px;">
          <b>${badge}</b>
          <em class="rtp" style="background:rgba(74,222,128,.2); color:var(--ok); border-color:var(--ok);">${timeStr}</em>
        </div>
        <small style="color:var(--m); display:block; margin-bottom:10px;">
          Призовой фонд: <b>${fmt(x.prize_pool)}</b> монет<br>
          Победителей: <b>${x.winners_count}</b>
          ${x.min_deposit > 0 ? ' | Мин. депозит: <b>$' + x.min_deposit + '</b>' : ''}
        </small>
        ${joinedBtn}
      </div>
    `;
  }).join('');
}

window.joinGiveaway = async (id) => {
  const r = await api('/giveaways/join', { id });
  if (r.ok) { toast('Вы участвуете в розыгрыше!', 'w'); loadGiveaways(); }
  else if (r.error === 'deposit') toast('Недостаточный депозит для участия', 'e');
  else if (r.error === 'already') toast('Вы уже участвуете', 'e');
  else if (r.error === 'notfound') toast('Розыгрыш не найден или завершён', 'e');
  else toast('Ошибка участия', 'e');
};

async function createGiveawayFrom(poolSel, winSel, minSel, depSel) {
  const pool = +$(poolSel).value;
  const winners = +$(winSel).value;
  const minutes = +$(minSel).value;
  const mindep = +$(depSel).value;
  if (pool < 100) { toast('Мин. фонд 100 монет', 'e'); return; }
  if (winners < 1) { toast('Мин. 1 победитель', 'e'); return; }
  if (minutes < 1 || minutes > 10080) { toast('Время 1–10080 минут', 'e'); return; }
  const r = await api('/giveaways/create', { prize_pool: pool, winners_count: winners, minutes, min_deposit: mindep });
  if (r.ok) {
    toast(`Розыгрыш создан на ${minutes} мин.`, 'w');
    $(poolSel).value = ''; $(winSel).value = ''; $(minSel).value = ''; $(depSel).value = '';
    await syncMe();
    loadGiveaways();
    loadPanelStats();
  } else {
    toast(r.error === 'money' ? 'Недостаточно средств на балансе' : r.error === 'forbidden' ? 'Нет прав' : 'Проверьте поля', 'e');
  }
}

if ($('#gw-create-btn')) $('#gw-create-btn').onclick = () => createGiveawayFrom('#gw-pool', '#gw-winners', '#gw-minutes', '#gw-mindep');
if ($('#pp-gw-create-btn')) $('#pp-gw-create-btn').onclick = () => createGiveawayFrom('#pp-gw-pool', '#pp-gw-winners', '#pp-gw-minutes', '#pp-gw-mindep');

if ($('#gw-draw-btn')) {
  $('#gw-draw-btn').onclick = async () => {
    if (!confirm('Развести все активные розыгрыши прямо сейчас?')) return;
    const list = await api('/giveaways/list');
    if (!list.ok || !list.items.length) { toast('Нет активных розыгрышей', 'e'); return; }
    let ok = 0;
    for (const g of list.items) {
      const r = await api('/admin/giveaway-draw', { id: g.id });
      if (r.ok) { ok++; toast(`#${g.id}: ${r.count} победителей × ${r.per}`, 'w'); }
    }
    if (ok) setTimeout(loadGiveaways, 800);
  };
}

setInterval(() => { if ($('#t-b') && $('#t-b').classList.contains('on')) loadGiveaways(); }, 10000);

// ---------- АДМИНКА ----------
async function openAdmin() {
  tab('a');
  const r = await api('/admin/stats');
  if (r.ok) {
    if ($('#ah')) $('#ah').textContent = '$' + fmt(r.bank);
    if ($('#at')) $('#at').textContent = '$' + fmt(r.deposit);
    if ($('#ap')) $('#ap').textContent = r.usersCount;
    if ($('#arub')) {
      const rate = +S.cfg.rate || 87;
      $('#arub').innerHTML = `💎 Крипта: <b>$${fmt(r.depositUsd)}</b> · 💳 ЮKassa: <b>${fmt(r.depositRub)} ₽</b> (≈ $${fmt(r.depositRub / rate)})`;
    }
    if ($('#cr1')) $('#cr1').value = S.cfg.mines;
    if ($('#cr2')) $('#cr2').value = S.cfg.wheel;
    if ($('#cr3')) $('#cr3').value = S.cfg.crash;
    if ($('#cr4')) $('#cr4').value = S.cfg.flip;
    if ($('#cr5')) $('#cr5').value = S.cfg.ladder;
    if ($('#cr6')) $('#cr6').value = S.cfg.slot;
    if ($('#cmb')) $('#cmb').value = S.cfg.maxBet;
    if ($('#prd')) $('#prd').value = S.cfg.refDef;
    if ($('#prm')) $('#prm').value = S.cfg.refCap;
    if ($('#pbu')) $('#pbu').value = S.cfg.botLink;
    if ($('#pb1')) $('#pb1').value = S.cfg.blogger_max_bonus;
    if ($('#pb2')) $('#pb2').value = S.cfg.blogger_max_uses;
    if ($('#pb3')) $('#pb3').value = S.cfg.blogger_dep_share;
    if ($('#pm1')) $('#pm1').value = S.cfg.manager_max_bonus;
    if ($('#pm2')) $('#pm2').value = S.cfg.manager_max_uses;
    if ($('#pm3')) $('#pm3').value = S.cfg.manager_dep_share;
    if ($('#yr1')) $('#yr1').value = S.cfg.yoo_rate;
    if ($('#yr2')) $('#yr2').value = S.cfg.yoo_min;
    if ($('#yr3')) $('#yr3').value = S.cfg.yoo_max;
    if ($('#ysbp')) $('#ysbp').value = S.cfg.sbp_min;
  }
  const u = await api('/admin/users');
  if (u.ok && $('#ul')) {
    $('#ul').innerHTML = u.users.map(x => `
      <div class="ur" style="border-bottom:1px solid rgba(255,255,255,.1); padding:8px 0; cursor:pointer;" onclick="window.selectUser('${x.id}', '${(x.name||'').replace(/'/g, "\\'")}', ${x.balance})">
        <b>${x.name || 'Игрок'}</b> (ID: ${x.id})<br>
        Баланс: ${fmt(x.balance)} | Роль: ${x.role} ${x.banned ? '<b style="color:var(--bad)">· БАН</b>' : ''}
        <div style="display:flex; gap:5px; margin-top:6px;">
          <button class="opt" style="padding:2px 6px; height:28px; font-size:11px;" onclick="event.stopPropagation();window.setRole('${x.id}','blogger')">Блогер</button>
          <button class="opt" style="padding:2px 6px; height:28px; font-size:11px;" onclick="event.stopPropagation();window.setRole('${x.id}','manager')">Менеджер</button>
          <button class="opt" style="padding:2px 6px; height:28px; font-size:11px;" onclick="event.stopPropagation();window.setRole('${x.id}','player')">Игрок</button>
        </div>
      </div>
    `).join('');
  }
  const L = $('#wal');
  if (L) {
    L.innerHTML = '<div style="text-align:center; padding:10px;">Загрузка...</div>';
    const wd = await api('/admin/list');
    if (wd.ok && wd.items) {
      if (wd.items.length === 0) L.innerHTML = '<div style="text-align:center; color:var(--m); padding:10px;">Заявок пока нет</div>';
      else {
        L.innerHTML = '';
        wd.items.forEach(x => {
          const d = document.createElement('div'); d.className = 'wr';
          const stText = x.status === 'pending' ? 'В обработке' : x.status === 'paid' ? 'Выплачено' : 'Отклонено';
          const stColor = x.status === 'pending' ? 'var(--g)' : x.status === 'paid' ? 'var(--ok)' : 'var(--bad)';
          const methodIcon = x.method === 'sbp' ? '🏦 СБП' : '💎 Crypto';
          const amountStr = x.method === 'sbp'
            ? `${fmt(x.coins)} монет = ${fmt(x.rub || 0)} ₽`
            : `${fmt(x.coins)} монет = $${Number(x.usd).toFixed(2)}`;
          d.innerHTML = `
            <div class="wh" style="display:flex; justify-content:space-between;">
              <b>${x.name || 'Игрок'} (ID: ${x.uid})</b>
              <em style="color:${stColor}; font-style:normal;">${stText}</em>
            </div>
            <small>${methodIcon} · ${amountStr}</small>
            ${x.details ? `<small style="color:var(--g)">📋 ${x.details}</small>` : ''}
            <small>Пополнений: ${Number(x.dep).toFixed(2)} $ | Выплачено: ${Number(x.paid).toFixed(2)} $</small>
            <small style="color:var(--m)">${new Date(x.created_at).toLocaleString('ru-RU')} ${x.note ? '· ' + x.note : ''}</small>
          `;
          if (x.status === 'pending') {
            const bd = document.createElement('div'); bd.style.cssText = 'display:flex; gap:8px; margin-top:8px;';
            const bp = document.createElement('button'); bp.className='btn'; bp.style.cssText='flex:1;min-height:36px;font-size:12px;'; bp.textContent='Одобрить'; bp.onclick=()=>resolveWd(x.id,'paid');
            const br = document.createElement('button'); br.className='opt'; br.style.cssText='flex:1;min-height:36px;color:var(--bad);'; br.textContent='Отклонить'; br.onclick=()=>resolveWd(x.id,'rejected');
            bd.appendChild(bp); bd.appendChild(br); d.appendChild(bd);
          }
          L.appendChild(d);
        });
      }
    } else L.innerHTML = '<div style="color:red; text-align:center;">Ошибка загрузки</div>';
  }
}

// Поиск игрока по нику или ID
if ($('#admin-search')) {
  $('#admin-search').oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    const items = $('#ul').querySelectorAll('.ur');
    items.forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(q) ? 'block' : 'none';
    });
  };
}

async function resolveWd(id, action) {
  const note = $('#wanote')?.value || '';
  if (action === 'rejected' && !note) { toast('Напишите причину в поле ниже', 'e'); return; }
  const r = await api('/admin/resolve', { id, action, note });
  if (r.ok) { toast(action === 'paid' ? 'Выплачено' : 'Отклонено', 'w'); if ($('#wanote')) $('#wanote').value = ''; openAdmin(); } else toast('Ошибка', 'e');
}

window.selectUser = (id, name, bal) => { selU = id; if ($('#asel')) $('#asel').textContent = `Выбран: ${name} (ID: ${id}) | Баланс: ${fmt(bal)}`; };

window.uEdit = async (action) => {
  if (!selU) { toast('Выберите игрока из списка', 'e'); return; }
  const amount = parseFloat($('#aamt')?.value) || 0;
  if (action === 'ban' || action === 'simref') {
    const r = await api('/admin/user-action', { target: selU, action });
    if (r.ok) { toast(action === 'ban' ? (r.banned ? 'Забанен' : 'Разбанен') : 'Реф-бонус начислен', 'w'); openAdmin(); }
    else toast('Ошибка', 'e');
    return;
  }
  if (amount <= 0 && action !== 'set') { toast('Введите сумму', 'e'); return; }
  const r = await api('/admin/edit-balance', { target: selU, action, amount });
  if (r.ok) { toast('Баланс изменён', 'w'); if ($('#aamt')) $('#aamt').value = ''; openAdmin(); } else toast('Ошибка', 'e');
};

window.uRole = async (role) => {
  if (!selU) { toast('Выберите игрока', 'e'); return; }
  const r = await api('/admin/set-role', { target: selU, role });
  if (r.ok) { toast('Роль изменена', 'w'); openAdmin(); } else toast('Ошибка', 'e');
};

if ($('#acs')) {
  $('#acs').onclick = async () => {
    const body = {
      mines: +$('#cr1').value || 97, wheel: +$('#cr2').value || 93.33,
      crash: +$('#cr3').value || 97, flip: +$('#cr4').value || 97,
      ladder: +$('#cr5').value || 97, slot: +$('#cr6').value || 96,
      maxBet: +$('#cmb').value || 10000
    };
    const r = await api('/admin/save-rtp', body);
    if (r.ok) { toast('RTP сохранены', 'w'); syncMe(); } else toast('Ошибка', 'e');
  };
}

if ($('#aps')) {
  $('#aps').onclick = async () => {
    const body = {
      blogger_max_bonus: +$('#pb1').value || 0, blogger_max_uses: +$('#pb2').value || 0, blogger_dep_share: +$('#pb3').value || 0,
      manager_max_bonus: +$('#pm1').value || 0, manager_max_uses: +$('#pm2').value || 0, manager_dep_share: +$('#pm3').value || 0,
      refDef: +$('#prd').value || 50, refCap: +$('#prm').value || 500,
      botLink: $('#pbu').value || '',
      yoo_rate: +($('#yr1')?.value) || 1,
      yoo_min: +($('#yr2')?.value) || 100,
      yoo_max: +($('#yr3')?.value) || 50000,
      sbp_min: +($('#ysbp')?.value) || 500
    };
    const r = await api('/admin/save-partner-limits', body);
    if (r.ok) { toast('Сохранено', 'w'); syncMe(); } else toast('Ошибка', 'e');
  };
}

if ($('#btn-event')) {
  $('#btn-event').onclick = async () => {
    const hours = +($('#secret-hours')?.value) || 48;
    const r = await api('/admin/toggle-secret', { hours });
    if (r.ok) {
      toast(r.active ? `🔐 SECRET EVENT запущен на ${r.hours}ч!` : 'Ивент остановлен', 'w');
      syncMe();
    } else {
      toast('Ошибка', 'e');
    }
  };
}

if ($('#bc-send')) {
  $('#bc-send').onclick = async () => {
    const msg = $('#bc-msg').value.trim();
    const btnT = $('#bc-btn-text').value.trim();
    const btnU = $('#bc-btn-url').value.trim();
    
    if (!msg) { toast('Введите текст сообщения', 'e'); return; }
    if ((btnT && !btnU) || (!btnT && btnU)) { toast('Заполните и текст, и ссылку для кнопки', 'e'); return; }
    
    if (!confirm('Отправить рассылку всем пользователям? Это действие нельзя отменить.')) return;
    
    const btn = $('#bc-send');
    btn.disabled = true;
    btn.textContent = 'Запуск...';
    
    const r = await api('/admin/broadcast', { message: msg, btnText: btnT, btnUrl: btnU });
    if (r.ok) {
      toast(`Рассылка запущена для ${r.count} игроков!`, 'w');
      $('#bc-msg').value = '';
      $('#bc-btn-text').value = '';
      $('#bc-btn-url').value = '';
    } else {
      toast('Ошибка запуска рассылки', 'e');
    }
    
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Отправить всем';
    }, 3000);
  };
}

// ---------- ТЕХПОДДЕРЖКА ----------
async function loadMySupport() {
  if (!$('#sup-history')) return;
  const r = await api('/support/my');
  if (!r.ok) return;
  $('#sup-history').innerHTML = r.items.length ? r.items.map(x => `
    <div class="hr" style="flex-direction:column; align-items:flex-start; gap:5px; padding:10px; background:rgba(0,0,0,.2); border-radius:10px; margin-bottom:5px;">
      <small style="color:var(--m)">Вы: ${x.message}</small>
      ${x.reply ? `<b style="color:var(--g)">Ответ: ${x.reply}</b>` : `<small style="color:var(--ok)">Ожидает ответа...</small>`}
    </div>
  `).join('') : '<small style="color:var(--m)">Тикетов пока нет</small>';
}
if ($('#sup-btn')) {
  $('#sup-btn').onclick = async () => {
    const msg = $('#sup-msg').value.trim(); if (!msg) return;
    const r = await api('/support/create', { message: msg });
    if (r.ok) { toast('Сообщение отправлено', 'w'); $('#sup-msg').value = ''; loadMySupport(); } else toast('Ошибка', 'e');
  };
}
async function loadAdminSupport() {
  if (!$('#admin-support-list')) return;
  const r = await api('/admin/support/list');
  if (!r.ok) return;
  $('#admin-support-list').innerHTML = r.items.length ? r.items.map(x => `
    <div class="wr">
      <div class="wh">
        <b>${x.name} (ID: ${x.uid})</b>
        <div style="display:flex; gap:5px; align-items:center;">
          <em class="${x.status === 'open' ? 'role' : 'role ok'}">${x.status === 'open' ? 'Открыт' : 'Закрыт'}</em>
          ${x.status === 'closed' ? `<button class="opt" style="min-height:24px;padding:0 8px;font-size:11px;color:var(--bad);border-color:rgba(255,84,112,.3);" onclick="window.deleteSupportTicket(${x.id})">Удалить</button>` : ''}
        </div>
      </div>
      <small>${new Date(x.created_at).toLocaleString('ru-RU')}</small>
      <div style="margin:10px 0; padding:10px; background:rgba(0,0,0,.3); border-radius:10px; font-size:13px;">${x.message}</div>
      ${x.reply ? `<div style="margin:10px 0; padding:10px; background:rgba(74,222,128,.1); border-left:3px solid var(--ok); border-radius:10px; font-size:13px;"><b>Ваш ответ:</b> ${x.reply}</div>` : `
      <div style="display:flex; gap:5px; margin-top:5px;">
        <input type="text" id="reply-${x.id}" placeholder="Написать ответ..." style="flex:1; height:36px; font-size:13px;">
        <button class="opt" style="min-height:36px;" onclick="window.replySupport(${x.id})">Ответить</button>
      </div>`}
    </div>
  `).join('') : '<small style="color:var(--m)">Тикетов нет</small>';
}

window.replySupport = async (id) => {
  const reply = $(`#reply-${id}`)?.value; if (!reply) return;
  const r = await api('/admin/support/reply', { id, reply });
  if (r.ok) { toast('Ответ отправлен', 'w'); loadAdminSupport(); }
};

window.deleteSupportTicket = async (id) => {
  if (!confirm('Удалить этот тикет навсегда?')) return;
  const r = await api('/admin/support/delete', { id });
  if (r.ok) { toast('Тикет удален', 'w'); loadAdminSupport(); }
  else toast('Ошибка удаления', 'e');
};

if ($('#sup-reload')) $('#sup-reload').onclick = loadAdminSupport;

// ---------- ОНЛАЙН ----------
async function updateOnline() {
  try {
    const r = await api('/online');
    const el = $('#online-count');
    if (!el) return;
    if (r && r.ok) el.textContent = r.count;
    else if (el.textContent === '...') el.textContent = '1';
  } catch (e) {
    const el = $('#online-count');
    if (el && el.textContent === '...') el.textContent = '1';
  }
}
updateOnline();
setInterval(updateOnline, 15000);

// ---------- Обёртки ----------
const originalTab = tab;
tab = function(t) {
  originalTab(t);
  if (t == 'p') { loadMySupport(); loadWithdrawals(); }
  if (t == 'b') loadGiveaways();
};
const originalOpenAdmin = openAdmin;
openAdmin = async function() { await originalOpenAdmin(); loadAdminSupport(); };

(async () => { render(); await syncMe(); })();