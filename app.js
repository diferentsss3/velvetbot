const tg = window.Telegram && Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); try { tg.disableVerticalSwipes() } catch (e) { } }

const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fmt = n => (+n).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const h = (t = 'light') => { try { tg.HapticFeedback.impactOccurred(t) } catch (e) { } };
const ic = n => `<svg class="ic"><use href="#i-${n}"/></svg>`;

const API_URL = 'https://editor-altered-belly-lyrics.trycloudflare.com'; // <--- ВСТАВЬ СВОЮ ССЫЛКУ СЮДА!
const CFG0 = { rate: 87, wdMin: 5, flip: 97, ladder: 97, slot: 96, mines: 97, wheel: 93.33, crash: 97, maxBet: 10000 };
let S = { bal: 0, bets: 0, role: 'player', isAdmin: false, refCount: 0, cfg: CFG0 };

async function api(path, data = {}) {
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST',
      // МЕНЯЕМ ЗАГОЛОВОК: text/plain не вызывает предварительный запрос OPTIONS
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify({ ...data, initData: (tg && tg.initData) || '' })
    });
    return await r.json();
  } catch (e) {
    console.error("Ошибка запроса:", e);
    toast('Нет связи с сервером', 'e');
    return { ok: false };
  }
}

async function syncMe() {
  const r = await api('/me');
  if (!r.ok) return;
  S.bal = r.user.balance; S.bets = r.user.bets; S.role = r.user.role;
  S.refCount = r.user.ref_count || 0; S.isAdmin = !!r.admin;
  if (r.cfg) S.cfg = { ...CFG0, ...r.cfg };
  
  render();
  
  if (S.isAdmin) {
    const adm = $('#adm');
    if (adm) { adm.style.display = 'block'; adm.onclick = () => openAdmin(); }
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
  if ($('#bal')) $('#bal').textContent = fmt(S.bal);
  if ($('#pbal')) $('#pbal').textContent = fmt(S.bal);
  if ($('#urole')) {
    $('#urole').textContent = S.role === 'player' ? 'Игрок' : S.role === 'blogger' ? 'Блогер' : 'Менеджер';
    $('#urole').className = 'role ' + S.role;
  }
  if ($('#rn')) $('#rn').textContent = S.refCount;

  // Вот эта часть отвечает за аватарку, ник и ID
  const U = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { first_name: 'Гость', id: 0, photo_url: null, username: '' };
  if ($('#un')) $('#un').textContent = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Игрок';
  if ($('#uid')) $('#uid').textContent = (U.username ? '@' + U.username + ' · ' : '') + 'ID ' + U.id;
  
  if ($('#av')) {
    if (U.photo_url) {
      $('#av').innerHTML = `<img src="${U.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      $('#av').textContent = (U.first_name || '?')[0].toUpperCase();
    }
  }

  if ($('#rl')) $('#rl').value = 'https://t.me/velvetcasBot/app?startapp=ref_' + U.id;
}

// Запуск при старте
(async () => { 
  if (tg) {
     // Сразу рисуем профиль из данных Telegram (чтобы не было пусто, пока грузится сервер)
     render(); 
  }
  await syncMe(); 
})();

function tab(t) {
  $$('.tab').forEach(e => e.classList.toggle('on', e.id == 't-' + t));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.t == ('mwcfl'.includes(t) ? 'h' : t)));
}
$$('nav button').forEach(b => b.onclick = () => tab(b.dataset.t));
$$('.mc').forEach(c => c.onclick = () => tab(c.dataset.t));

// БОНУСЫ
if ($('#bw')) $('#bw').onclick = async () => {
  const r = await api('/bonus/start');
  if (r.ok) { toast('+100 монет', 'w'); syncMe(); } else toast('Бонус уже получен', 'e');
};
if ($('#bd')) $('#bd').onclick = async () => {
  const r = await api('/bonus/daily');
  if (r.ok) { toast('+' + r.amount + ' монет', 'w'); syncMe(); } else toast('Приходите завтра', 'e');
};

if ($('#pcb')) $('#pcb').onclick = async () => {
  const c = $('#pc').value.trim().toUpperCase();
  if (!c) { toast('Введите промокод', 'e'); return; }
  const r = await api('/promo/activate', { code: c });
  if (!r.ok) { toast(r.error === 'used' ? 'Вы уже активировали' : r.error === 'limit' ? 'Лимит' : 'Не найден', 'e'); return; }
  S.bal += r.bonus; render(); $('#pc').value = '';
  toast('+' + fmt(r.bonus) + ' по промокоду', 'w'); h('medium');
};

if ($('#rcp')) $('#rcp').onclick = () => { $('#rl').select(); document.execCommand('copy'); toast('Ссылка скопирована', 'w') };
if ($('#rsh')) $('#rsh').onclick = () => { const u = 'https://t.me/share/url?url=' + encodeURIComponent($('#rl').value); if (tg) tg.openTelegramLink(u); else window.open(u) };

// АДМИНКА
async function openAdmin() {
  tab('a');
  const r = await api('/admin/stats');
  if (r.ok) {
    if ($('#ah')) $('#ah').textContent = fmt(r.bank);
    if ($('#at')) $('#at').textContent = fmt(r.deposit);
  }
  const u = await api('/admin/users');
  if (u.ok && $('#ul')) {
    $('#ul').innerHTML = u.users.map(x => `
      <div style="border-bottom:1px solid rgba(255,255,255,.1); padding:8px 0;">
        <b>${x.name}</b> (ID: ${x.id})<br>Баланс: ${fmt(x.balance)} | Роль: ${x.role}<br>
        <div style="display:flex; gap:5px; margin-top:6px;">
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','blogger')">Блогер</button>
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','manager')">Менеджер</button>
          <button class="opt" style="padding:2px 6px; min-height:28px; font-size:11px;" onclick="window.setRole('${x.id}','player')">Игрок</button>
        </div>
      </div>
    `).join('');
  }
}
window.setRole = async (target, role) => { await api('/admin/set-role', { target, role }); toast('Роль изменена', 'w'); openAdmin(); };
window.createPromo = async () => {
  const code = $('#pcode')?.value, b = +$('#pbonus')?.value, u = +$('#puses')?.value;
  if (!code || b <= 0 || u <= 0) return;
  const r = await api('/admin/create-promo', { code, bonus: b, uses: u });
  if (r.ok) { toast('Промокод создан', 'w'); syncMe(); } else toast('Нет денег', 'e');
};

(async () => { 
  render(); // Сразу рисуем профиль из данных Telegram
  await syncMe(); // Потом подтягиваем баланс с сервера
})();