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

const API_URL = 'https://damages-sought-selections-curves.trycloudflare.com';
const CFG0 = {
  rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000,
  refDef: 50, refCap: 500,
  blogger_max_bonus: 10000, blogger_max_uses: 1000, blogger_dep_share: 10,
  manager_max_bonus: 50000, manager_max_uses: 5000, manager_dep_share: 15,
  botLink: 'https://t.me/velvetcasBot/app'
};
let S = { bal: 0, bets: 0, wins: 0, best: 0, hist: [], role: 'player', isAdmin: false, refCount: 0, refDep: 0, refEarned: 0, cfg: CFG0, ban: 0 };
let selU = null;

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
  const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка', slot: 'Слоты' };
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
  S.bal = Number(r.user.balance) || 0;
  S.bets = r.user.bets; S.wins = r.user.wins || 0; S.best = r.user.best_win || 0;
  S.role = r.user.role; S.ban = r.user.banned;
  S.refCount = r.user.ref_count || 0; S.refDep = r.user.ref_dep || 0; S.refEarned = r.user.ref_earned || 0;
  S.isAdmin = !!r.admin;
  if (r.cfg) S.cfg = { ...CFG0, ...r.cfg };
  render(); dUI(); wUI(); loadFeed();
  if (S.isAdmin) { const adm = $('#adm'); if (adm) { adm.style.display = 'block'; adm.innerHTML = 'Админ-панель'; adm.onclick = () => openAdmin(); } }
  updatePanels();
}

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
  if ($('#rl')) $('#rl').value = 'https://t.me/velvetcasBot/app?startapp=ref_' + U.id;
}

// --- ДЕПОЗИТ ---
const dAmt = () => { const v = Math.round(parseFloat(String($('#dam').value).replace(',', '.')) * 100) / 100; return v > 0 ? v : 0; };
function dUI() { if (!$('#drate')) return; $('#drate').textContent = '1 $ = ' + fmt(S.cfg.rate) + ' монет'; if ($('#dcoins')) $('#dcoins').textContent = fmt(Math.floor(dAmt() * S.cfg.rate)); }
if ($('#dam')) {
  $('#dam').oninput = () => { const e = $('#dam'), v = e.value.replace(/[^0-9.,]/g, ''); if (v !== e.value) e.value = v; dUI(); };
  $('#dbtn').onclick = async () => {
    const usd = dAmt(); if (usd < 1 || usd > 1000) { toast('Сумма от 1 до 1000 $', 'e'); return; }
    const r = await api('/invoice', { usd });
    if (r.ok && r.url) {
      if (tg && tg.openTelegramLink) tg.openTelegramLink(r.url); else window.open(r.url, '_blank');
      toast('Счёт создан. Ожидаем оплату...', 'w');
      const iv = setInterval(async () => {
        const chk = await api('/claim', { id: r.id });
        if (chk.status === 'paid') { clearInterval(iv); syncMe(); toast('Успешно! +' + chk.coins + ' монет' + (chk.msg || ''), 'w'); }
        else if (chk.status === 'expired') { clearInterval(iv); toast('Счёт истек', 'e'); }
      }, 5000);
    } else toast('Ошибка создания счёта', 'e');
  };
}

// --- ВЫВОД ---
function wUI() { if (!$('#wrate')) return; const c = Math.floor(+($('#wam').value || 0)); $('#wrate').textContent = '1 $ = ' + fmt(S.cfg.rate) + ' монет'; $('#wmin').textContent = 'Минимум ' + fmt(Math.ceil(S.cfg.wdMin * S.cfg.rate)) + ' монет (' + S.cfg.wdMin + ' $)'; $('#wusd').textContent = (Math.floor(c / S.cfg.rate * 100) / 100).toFixed(2); }
if ($('#wam')) {
  $('#wam').oninput = () => { const e = $('#wam'), v = e.value.replace(/\D/g, ''); if (v !== e.value) e.value = v; wUI(); };
  $('#wdb').onclick = async () => {
    const c = Math.floor(+$('#wam').value || 0);
    if (c < Math.ceil(S.cfg.wdMin * S.cfg.rate)) { toast('Минимум ' + fmt(Math.ceil(S.cfg.wdMin * S.cfg.rate)) + ' монет', 'e'); return; }
    if (c > S.bal) { toast('Недостаточно средств', 'e'); return; }
    const r = await api('/withdraw', { coins: c });
    if (r.ok) { toast('Заявка отправлена', 'w'); S.bal -= c; render(); $('#wam').value = ''; wUI(); }
    else {
      if (r.error === 'need_deposit') toast('Для вывода нужен депозит от $1 за последние 7 дней', 'e');
      else if (r.error === 'min') toast('Сумма меньше минимальной', 'e');
      else if (r.error === 'max') toast('Сумма больше максимальной (500$)', 'e');
      else if (r.error === 'pending') toast('У вас уже есть заявка в обработке', 'e');
      else if (r.error === 'balance') toast('Недостаточно средств', 'e');
      else toast('Ошибка вывода', 'e');
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
      const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка', slot: 'Слоты' }[game] || game;
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

function tab(t) { $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t)); $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t))); if(t == 'p') { dUI(); wUI(); } }
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => tab(c.dataset.t));

// --- БОНУСЫ ---
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

// --- ПАНЕЛЬ БЛОГЕРА / МЕНЕДЖЕРА / АДМИНА ---
function updatePanels() {
  const show = S.isAdmin || S.role === 'blogger' || S.role === 'manager';
  ['#pp', '#pm'].forEach(sel => { const el = $(sel); if (el) el.style.display = show ? 'block' : 'none'; });
  const ppt = $('#ppt');
  if (ppt) ppt.textContent = S.isAdmin ? 'Панель администратора'
    : S.role === 'blogger' ? 'Панель блогера'
    : S.role === 'manager' ? 'Панель менеджера' : 'Панель';
  if (show) loadMyPromos();
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
    totalUsed += x.used;
    totalCoins += x.bonus * x.used;
    return `
      <div class="pr">
        <b>${x.code}</b>
        <small>${x.type === 'deposit' ? '+' + x.bonus + '%' : '+' + x.bonus + ' монет'} · ${x.used}/${x.max_uses}</small>
        <button onclick="window.delPromo('${x.code}')">×</button>
      </div>
    `;
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
      syncMe();
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

// --- РОЗЫГРЫШИ ---
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
    const isCreatorAdmin = ['802498337'].includes(String(x.creator_id));
    return `
      <div style="background:rgba(0,0,0,.3); border-radius:15px; padding:15px; margin-bottom:10px; border:1px solid var(--ln);">
        <div class="shead" style="margin-bottom:5px;">
          <b>${isCreatorAdmin ? 'Официальный розыгрыш' : 'Розыгрыш от партнёра'}</b>
          <em class="rtp" style="background:rgba(74,222,128,.2); color:var(--ok); border-color:var(--ok);">${timeStr}</em>
        </div>
        <small style="color:var(--m); display:block; margin-bottom:10px;">
          Призовой фонд: <b>${fmt(x.prize_pool)}</b> монет<br>
          Победителей: <b>${x.winners_count}</b>
          ${x.min_deposit > 0 ? ' | Мин. депозит: <b>$' + x.min_deposit + '</b>' : ''}
        </small>
        <button class="btn" onclick="joinGiveaway(${x.id})"
          ${x.joined ? 'disabled' : ''}
          style="min-height:36px; font-size:13px; ${x.joined ? 'background:#333;' : ''}">
          ${x.joined ? 'Вы участвуете' : 'Участвовать'}
        </button>
      </div>
    `;
  }).join('');
}

window.joinGiveaway = async (id) => {
  const r = await api('/giveaways/join', { id });
  if (r.ok) { toast('Вы участвуете в розыгрыше!', 'w'); loadGiveaways(); }
  else if (r.error === 'deposit') toast('Недостаточный депозит для участия', 'e');
  else if (r.error === 'already') toast('Вы уже участвуете', 'e');
  else if (r.error === 'notfound') toast('Розыгрыш не найден или уже завершён', 'e');
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

  const r = await api('/giveaways/create', {
    prize_pool: pool, winners_count: winners, minutes, min_deposit: mindep
  });
  if (r.ok) {
    toast(`Розыгрыш создан на ${minutes} мин.`, 'w');
    $(poolSel).value = ''; $(winSel).value = ''; $(minSel).value = ''; $(depSel).value = '';
    loadGiveaways(); syncMe();
  } else {
    toast(
      r.error === 'money'     ? 'Недостаточно средств на балансе' :
      r.error === 'forbidden' ? 'Нет прав' :
      r.error === 'data'      ? 'Проверьте поля' : 'Ошибка создания', 'e'
    );
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

// --- АДМИНКА ---
async function openAdmin() {
  tab('a');
  const r = await api('/admin/stats');
  if (r.ok) {
    if ($('#ah')) $('#ah').textContent = fmt(r.bank);
    if ($('#at')) $('#at').textContent = fmt(r.deposit);
    if ($('#ap')) $('#ap').textContent = r.usersCount;
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
          d.innerHTML = `
            <div class="wh" style="display:flex; justify-content:space-between;">
              <b>${x.name || 'Игрок'} (ID: ${x.uid})</b>
              <em style="color:${stColor}; font-style:normal;">${stText}</em>
            </div>
            <small>${fmt(x.coins)} монет = ${Number(x.usd).toFixed(2)} $</small>
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

// RTP + maxBet
if ($('#acs')) {
  $('#acs').onclick = async () => {
    const body = {
      mines: +$('#cr1').value || 97,
      wheel: +$('#cr2').value || 93.33,
      crash: +$('#cr3').value || 97,
      flip: +$('#cr4').value || 97,
      ladder: +$('#cr5').value || 97,
      slot: +$('#cr6').value || 96,
      maxBet: +$('#cmb').value || 10000
    };
    const r = await api('/admin/save-rtp', body);
    if (r.ok) { toast('Настройки RTP сохранены', 'w'); syncMe(); } else toast('Ошибка', 'e');
  };
}

// Партнёрские лимиты и реф-бонусы
if ($('#aps')) {
  $('#aps').onclick = async () => {
    const body = {
      blogger_max_bonus: +$('#pb1').value || 0,
      blogger_max_uses:  +$('#pb2').value || 0,
      blogger_dep_share: +$('#pb3').value || 0,
      manager_max_bonus: +$('#pm1').value || 0,
      manager_max_uses:  +$('#pm2').value || 0,
      manager_dep_share: +$('#pm3').value || 0,
      refDef: +$('#prd').value || 50,
      refCap: +$('#prm').value || 500,
      botLink: $('#pbu').value || ''
    };
    const r = await api('/admin/save-partner-limits', body);
    if (r.ok) { toast('Сохранено', 'w'); syncMe(); } else toast('Ошибка', 'e');
  };
}

// --- ТЕХПОДДЕРЖКА ---
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
      <div class="wh"><b>${x.name} (ID: ${x.uid})</b><em class="${x.status === 'open' ? 'role' : 'role ok'}">${x.status === 'open' ? 'Открыт' : 'Закрыт'}</em></div>
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
if ($('#sup-reload')) $('#sup-reload').onclick = loadAdminSupport;

// --- ХЭЛЛОУИН ТЕМА ---
function enableHalloween() {
  const style = document.createElement('style');
  style.innerHTML = `
    body::before { background: radial-gradient(70% 38% at 90% -6%, rgba(255, 120, 0, 0.4), transparent 70%), radial-gradient(55% 32% at -5% 58%, rgba(139, 61, 255, 0.3), transparent 70%), radial-gradient(70% 40% at 100% 100%, rgba(20, 10, 40, 0.8), transparent 70%) !important; }
    .lg { background: linear-gradient(135deg, #ff7b00, #ff4400) !important; box-shadow: 0 4px 16px rgba(255, 100, 0, 0.6) !important; }
    .btn { background: linear-gradient(135deg, #ff7b00, #ff4400) !important; box-shadow: 0 10px 26px rgba(255, 100, 0, 0.5) !important; }
    .hero.p { background: radial-gradient(70% 90% at 95% 8%, rgba(255,255,255,.28), transparent 55%), linear-gradient(125deg, #4a14c2, #9a3dff 60%, #ff7b00) !important; }
    .halloween-bg { position: fixed; inset: 0; pointer-events: none; z-index: -1; overflow: hidden; }
    .pumpkin { position: absolute; font-size: 40px; opacity: 0.15; animation: float 10s linear infinite; }
    @keyframes float { 0% { transform: translateY(100vh) rotate(0deg); } 100% { transform: translateY(-100px) rotate(360deg); } }
  `;
  document.head.appendChild(style);
  const bg = document.createElement('div'); bg.className = 'halloween-bg';
  const emojis = ['🎃', '👻', '🕷️', '🕸️', '💀'];
  for (let i = 0; i < 15; i++) {
    const span = document.createElement('div'); span.className = 'pumpkin'; span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = Math.random() * 100 + 'vw'; span.style.animationDuration = (5 + Math.random() * 10) + 's';
    span.style.animationDelay = Math.random() * 5 + 's'; span.style.fontSize = (20 + Math.random() * 40) + 'px';
    bg.appendChild(span);
  }
  document.body.appendChild(bg);
}
enableHalloween();

// --- Обёртка tab / openAdmin ---
const originalTab = tab;
tab = function(t) { originalTab(t); if(t == 'p') loadMySupport(); if(t == 'b') loadGiveaways(); };
const originalOpenAdmin = openAdmin;
openAdmin = async function() { await originalOpenAdmin(); loadAdminSupport(); };

// --- СЧЕТЧИК ОНЛАЙНА ---
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

(async () => { render(); await syncMe(); })();