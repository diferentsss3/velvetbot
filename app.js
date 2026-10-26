// app.js
const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.disableVerticalSwipes() } catch (e) { } }

const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fmt = n => (+n).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const h = (t = 'light') => { try { tg.HapticFeedback.impactOccurred(t) } catch (e) { } };

// --- НАСТРОЙКИ ---
const API_URL = 'https://asset-palmer-locally-neighbors.trycloudflare.com'; // <--- ОБЯЗАТЕЛЬНО ВСТАВЬ ССЫЛКУ!
const CFG0 = { rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000 };
let S = { bal: 0, bets: 0, role: 'player', isAdmin: false, refCount: 0 };

async function api(path, data = {}) {
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, initData: (tg && tg.initData) || '', startParam: tg?.initDataUnsafe?.start_param })
    });
    return await r.json();
  } catch (e) {
    toast('Нет связи с сервером', 'e');
    return { ok: false };
  }
}

async function syncMe() {
  const r = await api('/me');
  if (!r.ok) return;
  S.bal = r.user.balance;
  S.bets = r.user.bets;
  S.role = r.user.role;
  S.refCount = r.user.ref_count || 0;
  S.isAdmin = !!r.admin;
  
  render();
  
  // Показываем кнопку админки или партнерки
  if (S.isAdmin) {
    $('#adm').style.display = 'block';
    $('#adm').textContent = 'Админ-панель';
    $('#adm').onclick = () => openAdmin();
  } else if (S.role === 'blogger' || S.role === 'manager') {
    $('#adm').style.display = 'block';
    $('#adm').textContent = 'Статистика партнёра';
    $('#adm').onclick = () => openPartner();
  }
}

let tt;
function toast(m, k) {
  const e = $('#toast');
  if (!e) return;
  e.textContent = m; e.className = 'on ' + (k || '');
  clearTimeout(tt); tt = setTimeout(() => e.className = '', 2200);
}

function render() {
  $('#bal').textContent = fmt(S.bal);
  $('#pbal').textContent = fmt(S.bal);
  $('#urole').textContent = S.role === 'player' ? 'Игрок' : S.role === 'blogger' ? 'Блогер' : 'Менеджер';
  $('#urole').className = 'role ' + S.role;
  $('#refc').textContent = S.refCount;
  
  const U = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { first_name: 'Гость', id: 0 };
  $('#un').textContent = [U.first_name, U.last_name].filter(Boolean).join(' ');
  $('#rl').value = 'https://t.me/YOUR_BOT/app?startapp=ref_' + U.id;
}

function tab(t) {
  $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t)));
}
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => tab(c.dataset.t));

// --- БОНУСЫ ---
$('#bw').onclick = async () => {
  const r = await api('/bonus/start');
  if (r.ok) { toast('+100 монет', 'w'); syncMe(); }
  else toast('Бонус уже получен', 'e');
};

$('#bd').onclick = async () => {
  const r = await api('/bonus/daily');
  if (r.ok) { toast('+' + r.amount + ' монет', 'w'); syncMe(); }
  else toast('Приходите завтра', 'e');
};

$('#pcb').onclick = async () => {
  const c = $('#pc').value.trim().toUpperCase();
  if (!c) { toast('Введите промокод', 'e'); return; }
  const r = await api('/promo/activate', { code: c });
  if (!r.ok) { toast(r.error === 'used' ? 'Вы уже активировали' : r.error === 'limit' ? 'Лимит исчерпан' : 'Не найден', 'e'); return; }
  S.bal += r.bonus; render(); $('#pc').value = '';
  toast('+' + fmt(r.bonus) + ' по промокоду', 'w'); h('medium');
};

$('#rcp').onclick = () => { $('#rl').select(); document.execCommand('copy'); toast('Ссылка скопирована', 'w') };
$('#rsh').onclick = () => { const u = 'https://t.me/share/url?url=' + encodeURIComponent($('#rl').value); if (tg) tg.openTelegramLink(u); else window.open(u) };

// --- АДМИНКА ---
async function openAdmin() {
  tab('a');
  const r = await api('/admin/stats');
  if (r.ok) {
    $('#aDep').textContent = fmt(r.deposit);
    $('#aBank').textContent = fmt(r.bank);
  }
  
  const u = await api('/admin/users');
  if (u.ok) {
    $('#ul').innerHTML = u.users.map(x => `
      <div style="border-bottom:1px solid rgba(255,255,255,.1); padding:8px 0;">
        <b>${x.name}</b> (ID: ${x.id})<br>
        Баланс: ${fmt(x.balance)} | Роль: <span style="color:var(--g)">${x.role}</span><br>
        <div style="display:flex; gap:5px; margin-top:6px;">
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','blogger')">Блогер</button>
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','manager')">Менеджер</button>
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','player')">Игрок</button>
        </div>
      </div>
    `).join('');
  }
}

window.setRole = async (target, role) => {
  await api('/admin/set-role', { target, role });
  toast('Роль изменена', 'w');
  openAdmin(); // Перезагружаем список
};

window.createPromo = async () => {
  const code = $('#pcode').value.trim();
  const bonus = Math.floor(+$('#pbonus').value);
  const uses = Math.floor(+$('#puses').value);
  if (!code || bonus <= 0 || uses <= 0) { toast('Заполните все поля', 'e'); return; }
  
  const r = await api('/admin/create-promo', { code, bonus, uses });
  if (r.ok) {
    toast('Промокод создан', 'w');
    $('#pcode').value = ''; $('#pbonus').value = ''; $('#puses').value = '';
    syncMe();
  } else {
    toast(r.error === 'money' ? 'Недостаточно средств на балансе' : 'Ошибка', 'e');
  }
};

// --- ПАРТНЕРКА ---
async function openPartner() {
  // Пока просто показываем модалку со ссылкой
  toast('Вы партнер! Ссылка во вкладке Бонусы', 'w');
  tab('b');
}

// --- СТАРТ ---
(async () => {
  await syncMe();
})();