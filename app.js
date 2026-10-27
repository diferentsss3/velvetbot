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

const API_URL = 'https://pic-sky-lid-nutrition.trycloudflare.com'; // <--- ВСТАВЬ ССЫЛКУ!
const CFG0 = { rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000, refDef: 50 };
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

// --- НАСТОЯЩАЯ ЛЕНТА СТАВОК ---
async function loadFeed() {
  const r = await api('/feed');
  if (!r.ok || !$('#feed')) return;
  
  const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка', slot: 'Слоты' };
  
  if (!r.items || r.items.length === 0) {
    $('#feed').innerHTML = '<small style="color:var(--m); padding:10px; display:block; text-align:center;">Пока нет ставок</small>';
    return;
  }

  $('#feed').innerHTML = r.items.map(x => {
    const pr = Math.round((x.win - x.bet) * 100) / 100;
    const mult = (x.win / x.bet).toFixed(2);
    return `
      <div class="fr">
        <span>${gn[x.game] || x.game}</span>
        <span>${x.name || 'Игрок'}</span>
        <span>${fmt(x.bet)}</span>
        <span>x${mult}</span>
        <b style="color:var(${pr > 0 ? '--ok' : '--bad'})">${pr > 0 ? '+' : ''}${fmt(pr)}</b>
      </div>
    `;
  }).join('');
}
setInterval(loadFeed, 10000); // Обновляем каждые 10 секунд

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

// ДЕПОЗИТ
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
        if (chk.status === 'paid') { clearInterval(iv); syncMe(); toast('Успешно! +' + chk.coins + ' монет', 'w'); }
        else if (chk.status === 'expired') { clearInterval(iv); toast('Счёт истек', 'e'); }
      }, 5000);
    } else toast('Ошибка создания счёта', 'e');
  };
}

// ВЫВОД
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
      if (r.error === 'min') toast('Сумма меньше минимальной', 'e');
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
  
  render(); 
  loadFeed(); // Обновляем ленту сразу после ставки
  
  return { ...r.result, newBalance: r.balance };
}

// ГЕНЕРАТОР ПОЛЕЙ
$$('.bet[data-id]').forEach(d => {
  const i = d.dataset.id;
  d.innerHTML = `<input id="${i}" type="number" inputmode="decimal" value="10"><button data-k="h">½</button><button data-k="d">×2</button><button data-k="m">Макс</button>`;
  d.querySelectorAll('button').forEach(b => b.onclick = () => { const e = $('#' + i), v = +e.value || 0, k = b.dataset.k; e.value = k == 'h' ? Math.max(1, Math.floor(v / 2)) : k == 'd' ? Math.min(Math.floor(S.bal), v * 2) : Math.floor(S.bal); });
});

function tab(t) { $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t)); $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t))); if(t == 'p') { dUI(); wUI(); } }
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => tab(c.dataset.t));

// БОНУСЫ
if ($('#bw')) $('#bw').onclick = async () => { const r = await api('/bonus/start'); if (r.ok) { toast('+100 монет', 'w'); syncMe(); } else toast('Бонус уже получен', 'e'); };
if ($('#bd')) $('#bd').onclick = async () => { const r = await api('/bonus/daily'); if (r.ok) { toast('+' + r.amount + ' монет', 'w'); syncMe(); } else toast('Приходите завтра', 'e'); };
if ($('#pcb')) $('#pcb').onclick = async () => { const c = $('#pc').value.trim().toUpperCase(); if (!c) return; const r = await api('/promo/activate', { code: c }); if (r.ok) { S.bal += r.bonus; render(); $('#pc').value = ''; toast('+' + fmt(r.bonus) + ' по промокоду', 'w'); } };

// АДМИНКА
async function openAdmin() {
  tab('a');
  const r = await api('/admin/stats');
  if (r.ok) {
    if ($('#ah')) $('#ah').textContent = fmt(r.bank);
    if ($('#at')) $('#at').textContent = fmt(r.deposit);
    if ($('#cr1')) $('#cr1').value = S.cfg.mines;
    if ($('#cr2')) $('#cr2').value = S.cfg.wheel;
    if ($('#cr3')) $('#cr3').value = S.cfg.crash;
    if ($('#cmb')) $('#cmb').value = S.cfg.maxBet;
    if ($('#prd')) $('#prd').value = S.cfg.refDef;
  }
  const u = await api('/admin/users');
  if (u.ok && $('#ul')) {
    $('#ul').innerHTML = u.users.map(x => `
      <div class="ur" style="border-bottom:1px solid rgba(255,255,255,.1); padding:8px 0; cursor:pointer;" onclick="window.selectUser('${x.id}', '${x.name.replace(/'/g, "\\'")}', ${x.balance})">
        <b>${x.name}</b> (ID: ${x.id})<br>Баланс: ${fmt(x.balance)} | Роль: ${x.role}
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

window.selectUser = (id, name, bal) => {
  selU = id;
  if ($('#asel')) $('#asel').textContent = `Выбран: ${name} (ID: ${id}) | Баланс: ${fmt(bal)}`;
};

window.uEdit = async (action) => {
  if (!selU) { toast('Выберите игрока из списка', 'e'); return; }
  const amount = parseFloat($('#aamt')?.value) || 0;
  if (amount <= 0 && action !== 'set') { toast('Введите сумму', 'e'); return; }
  const r = await api('/admin/edit-balance', { target: selU, action, amount });
  if (r.ok) { toast('Баланс изменен', 'w'); if ($('#aamt')) $('#aamt').value = ''; openAdmin(); } else toast('Ошибка', 'e');
};

window.setRole = async (target, role) => { await api('/admin/set-role', { target, role }); toast('Роль изменена', 'w'); openAdmin(); };

if ($('#acs')) {
  $('#acs').onclick = async () => {
    const rate = +$('#cr1').value || 87;
    const maxBet = +$('#cmb').value || 10000;
    const refDef = +$('#prd').value || 50;
    const r = await api('/admin/save-settings', { rate, maxBet, refDef });
    if (r.ok) { toast('Настройки сохранены', 'w'); syncMe(); } else toast('Ошибка', 'e');
  };
}

async function updateOnline() { const r = await api('/online'); if (r.ok && $('#online-count')) $('#online-count').textContent = r.count; }
updateOnline(); setInterval(updateOnline, 30000);

(async () => { render(); await syncMe(); })();