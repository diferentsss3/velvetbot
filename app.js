const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.disableVerticalSwipes() } catch (e) { } }

const CFG0 = { rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000 };
let S = { bal: 0, bets: 0, wins: 0, best: 0, hist: [], wd: [], ban: 0, cfg: CFG0, role: 'player', isAdmin: false, pendInv: null };

function render() {
  $('#bal').textContent = fmt(S.bal); $('#pbal').textContent = fmt(S.bal);
  $('#urole').textContent = S.role === 'player' ? 'Игрок' : S.role === 'blogger' ? 'Блогер' : 'Менеджер';
  $('#urole').className = 'role ' + S.role;
  $('#s1').textContent = S.bets; $('#s2').textContent = S.wins; $('#s3').textContent = fmt(S.best);
  $('#hist').innerHTML = S.hist.length ? S.hist.map(r => `<div class="hr"><span>${r[0]}</span><b style="color:var(${r[1] > 0 ? '--ok' : '--bad'})">${r[1] > 0 ? '+' : ''}${fmt(r[1])}</b></div>`).join('') : '<small style="color:var(--m)">Пока пусто</small>';
}

function getBet(id) {
  const b = Math.floor(+$(id).value * 100) / 100;
  if (!(b >= 1)) { toast('Минимальная ставка — 1', 'e'); return 0; }
  if (S.ban) { toast('Аккаунт заблокирован', 'e'); return 0; }
  if (b > S.cfg.maxBet) { toast('Максимальная ставка — ' + fmt(S.cfg.maxBet), 'e'); return 0; }
  if (b > S.bal) { toast('Недостаточно средств', 'e'); return 0; }
  return b;
}

function tab(t) { $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t)); $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t))); }
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => tab(c.dataset.t));
$$('.bet[data-id]').forEach(d => { const i = d.dataset.id; d.innerHTML = `<input id="${i}" type="number" inputmode="decimal" value="10"><button data-k="h">½</button><button data-k="d">×2</button><button data-k="m">Макс</button>`; d.querySelectorAll('button').forEach(b => b.onclick = () => { const e = $('#' + i), v = +e.value || 0, k = b.dataset.k; e.value = k == 'h' ? Math.max(1, Math.floor(v / 2)) : k == 'd' ? Math.min(Math.floor(S.bal), v * 2) : Math.floor(S.bal); }) });

// ПРОФИЛЬ
const U = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { first_name: 'Гость', id: 0 };
$('#un').textContent = [U.first_name, U.last_name].filter(Boolean).join(' ');
$('#uid').textContent = (U.username ? '@' + U.username + ' · ' : '') + 'ID ' + U.id;
if (U.photo_url) { const im = document.createElement('img'); im.src = U.photo_url; $('#av').appendChild(im); } else $('#av').textContent = (U.first_name || '?')[0].toUpperCase();

// ДЕПОЗИТ (CryptoBot)
const dAmt = () => { const v = Math.round(parseFloat(String($('#dam').value).replace(',', '.')) * 100) / 100; return v > 0 ? v : 0; };
const dpost = (path, body) => api(path, body);
function dUI() { $('#dcoins').textContent = fmt(Math.floor(dAmt() * S.cfg.rate)); }
$('#dam').oninput = () => dUI();
$('#dbtn').onclick = async () => {
  if (S.ban) { toast('Аккаунт заблокирован', 'e'); return; }
  const usd = dAmt();
  if (usd < 1 || usd > 1000) { toast('Сумма от 1 до 1000 $', 'e'); return; }
  const b = $('#dbtn'); b.disabled = true; b.textContent = 'Создаём счёт…';
  try {
    const r = await api('/invoice', { usd });
    if (!r.ok || !r.url) throw 0;
    S.pendInv = { id: r.id, usd, url: r.url };
    toast('Счёт создан. Оплатите в CryptoBot.', 'w');
    if (tg && tg.openTelegramLink) tg.openTelegramLink(r.url); else window.open(r.url, '_blank');
  } catch (e) { toast('Ошибка создания счёта', 'e'); }
  b.textContent = 'Пополнить через CryptoBot'; b.disabled = false;
};
$('#dchk').onclick = async () => {
  if (!S.pendInv) return;
  const r = await api('/claim', { id: S.pendInv.id });
  if (r.status === 'paid') { toast('+ ' + r.coins + ' монет', 'w'); S.pendInv = null; syncMe(); }
  else toast('Оплата еще не поступила', 'e');
};

// ВЫВОД
function wdMinCoins() { return Math.ceil(S.cfg.wdMin * S.cfg.rate); }
function wUI() { const c = Math.floor(+($('#wam').value || 0)); $('#wrate').textContent = '1 $ = ' + fmt(S.cfg.rate) + ' монет'; $('#wmin').textContent = 'Минимум ' + fmt(wdMinCoins()) + ' монет (' + S.cfg.wdMin + ' $)'; $('#wusd').textContent = (Math.floor(c / S.cfg.rate * 100) / 100).toFixed(2); }
$('#wam').oninput = () => { const e = $('#wam'), v = e.value.replace(/\D/g, ''); if (v !== e.value) e.value = v; wUI(); };
$('#wdb').onclick = async () => {
  const c = Math.floor(+$('#wam').value || 0);
  if (c < wdMinCoins()) { toast('Минимум ' + fmt(wdMinCoins()) + ' монет', 'e'); return; }
  if (c > S.bal) { toast('Недостаточно средств', 'e'); return; }
  const b = $('#wdb'); b.disabled = true;
  try {
    const r = await api('/withdraw', { coins: c });
    if (!r.ok) throw r.error || 0;
    S.bal -= c; S.wd.unshift({ id: r.id, coins: c, usd: r.usd, status: 'pending', note: '', ts: Date.now() });
    render(); renderWD(); $('#wam').value = ''; wUI(); toast('Заявка отправлена', 'w');
  } catch (e) { toast('Ошибка вывода', 'e'); }
  b.disabled = false;
};
const ST = { pending: 'В обработке', paid: 'Выплачено', rejected: 'Отклонено' }, stCls = { pending: 'role', paid: 'role ok', rejected: 'role no' };
function renderWD() {
  const L = $('#wdl'); L.innerHTML = '';
  S.wd.slice(0, 8).forEach(x => {
    const d = document.createElement('div'); d.className = 'wr'; d.innerHTML = '<div class="wh"><b></b><em></em></div><small></small>';
    d.children[0].children[0].textContent = fmt(x.coins) + ' монет · ' + Number(x.usd).toFixed(2) + ' $';
    const e = d.children[0].children[1]; e.textContent = ST[x.status] || x.status; e.className = stCls[x.status] || 'role';
    d.children[1].textContent = new Date(x.ts).toLocaleString('ru-RU') + (x.note ? ' · ' + x.note : ''); L.appendChild(d);
  });
}

// АДМИНКА
let WA = [];
async function wAdminLoad() { const r = await api('/admin/list'); if (!r.ok) return; WA = r.items; wAdminRender(); }
function wAdminRender() {
  const L = $('#wal'); L.innerHTML = '';
  WA.slice().sort((a, b) => b.created_at - a.created_at).forEach(x => {
    const d = document.createElement('div'); d.className = 'wr'; d.innerHTML = '<div class="wh"><b></b><em></em></div><small></small><div class="g2" style="margin:0"></div>';
    d.children[0].children[0].textContent = (x.name || '—');
    const e = d.children[0].children[1]; e.textContent = ST[x.status] || x.status; e.className = stCls[x.status] || 'role';
    d.children[1].textContent = 'ID ' + x.uid + ' · ' + fmt(x.coins) + ' монет = ' + Number(x.usd).toFixed(2) + ' $';
    const act = d.children[2];
    if (x.status == 'pending') {
      act.innerHTML = '<button class="opt">Выплачено</button><button class="opt">Отклонить</button>';
      act.children[0].onclick = () => wResolve(x, 'paid'); act.children[1].onclick = () => wResolve(x, 'rejected');
    } else act.remove();
    L.appendChild(d);
  });
}
async function wResolve(x, action) {
  const note = $('#wanote').value.trim();
  if (action == 'rejected' && !note) { toast('Укажите причину отказа', 'e'); return; }
  await api('/admin/resolve', { id: x.id, action, note });
  $('#wanote').value = ''; wAdminLoad();
}
$('#walr').onclick = wAdminLoad;
$('#adm').onclick = () => { tab('a'); wAdminLoad(); };
$('#aback').onclick = () => tab('p');
$('#reset').onclick = () => { if (confirm('Сбросить?')) { S.hist = []; S.bets = 0; S.wins = 0; S.best = 0; render(); } };

// ЗАПУСК
(async () => {
  await syncMe();
  render();
  renderWD();
  wUI();
  dUI();
})();
// --- БОНУСЫ И ПРОМОКОДЫ ---
$('#pcb').onclick = async () => {
  const c = $('#pc').value.trim().toUpperCase();
  if (!c) { toast('Введите промокод', 'e'); return; }
  const r = await api('/promo/activate', { code: c });
  if (!r.ok) {
    toast(r.error === 'used' ? 'Вы уже активировали' : r.error === 'limit' ? 'Лимит исчерпан' : 'Не найден', 'e');
    return;
  }
  S.bal += r.bonus; render(); $('#pc').value = '';
  toast('+' + fmt(r.bonus) + ' по промокоду', 'w'); h('medium');
};

// Генерация реф-ссылки (визуально)
$('#rl').value = 'https://t.me/YOUR_BOT/app?startapp=ref_' + U.id;
$('#rcp').onclick = () => { $('#rl').select(); document.execCommand('copy'); toast('Ссылка скопирована', 'w'); };
$('#rsh').onclick = () => { const u = 'https://t.me/share/url?url=' + encodeURIComponent($('#rl').value); if (tg) tg.openTelegramLink(u); else window.open(u); };

// --- ПОПОЛНЕНИЕ (ДЕПОЗИТ) ---
// Мы уже добавили dUI и логику в прошлом шаге, но чтобы кнопка «Пополнить» работала корректно:
$('#dbtn').onclick = async () => {
  const usd = dAmt();
  if (usd < 1 || usd > 1000) { toast('Сумма от 1 до 1000 $', 'e'); return; }
  const b = $('#dbtn'); b.disabled = true; b.textContent = 'Создаём счёт...';
  
  try {
    const r = await api('/invoice', { usd });
    if (!r.ok || !r.url) throw new Error('Ошибка сервера');
    
    // Открываем счет в CryptoBot
    if (tg && tg.openTelegramLink) tg.openTelegramLink(r.url); 
    else window.open(r.url, '_blank');
    
    toast('Счёт создан. Ожидаем оплату...', 'w');
    
    // Запускаем цикл проверки оплаты каждые 5 секунд
    if (window.invCheck) clearInterval(window.invCheck);
    window.invCheck = setInterval(async () => {
      const claim = await api('/claim', { id: r.id });
      if (claim.status === 'paid') {
        clearInterval(window.invCheck);
        await syncMe(); // Обновляем баланс
        toast('Успешно! +' + claim.coins + ' монет', 'w');
      }
    }, 5000);

  } catch (e) {
    toast('Ошибка создания счёта', 'e');
  }
  b.textContent = 'Пополнить через CryptoBot'; b.disabled = false;
};