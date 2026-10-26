// api.js - Вся серверная логика
const API_URL = 'https://experiencing-delivery-ethnic-expense.trycloudflare.com'; // ЗАМЕНИ НА СВОЮ ССЫЛКУ!

async function api(path, data = {}) {
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, initData: (window.Telegram && window.Telegram.WebApp.initData) || '' }),
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
  S.bets = r.user.bets; S.wins = r.user.wins; S.best = r.user.best_win;
  S.ban = r.user.banned; S.role = r.user.role;
  S.wd = r.withdrawals || [];
  S.cfg = { ...CFG0, ...r.cfg };
  S.isAdmin = !!r.admin;
  if (S.isAdmin) { document.getElementById('adm').style.display = 'block'; }
  if (typeof render === 'function') render();
}

async function playGame(game, bet, params) {
  if (S.ban) { toast('Аккаунт заблокирован', 'e'); return null; }
  if (bet > S.cfg.maxBet) { toast('Максимальная ставка — ' + fmt(S.cfg.maxBet), 'e'); return null; }
  if (bet > S.bal) { toast('Недостаточно средств', 'e'); return null; }

  // Оптимистичное списание для UI
  S.bal = Math.round((S.bal - bet) * 100) / 100;
  render();

  const r = await api('/bet', { game, bet, params });
  if (!r.ok) {
    await syncMe();
    toast(r.error === 'banned' ? 'Заблокирован' : r.error === 'balance' ? 'Недостаточно средств' : 'Ошибка ставки', 'e');
    return null;
  }

  S.bal = r.balance;
  const win = r.result.win;
  S.bets++; if (win > bet) S.wins++;
  S.best = Math.max(S.best, Math.round((win - bet) * 100) / 100);
  
  const gn = { mines:'Мины', wheel:'Колесо', crash:'Краш', flip:'Монета', ladder:'Лесенка' }[game] || game;
  S.hist.unshift([gn, Math.round((win - bet) * 100) / 100]);
  S.hist = S.hist.slice(0, 15);
  
  render();
  feed(gn, document.getElementById('un').textContent || 'Вы', bet, win);
  
  const st = document.querySelector('.tab.on .stage');
  if (st) { st.classList.remove('win','lose'); void st.offsetWidth; st.classList.add(win > bet ? 'win' : 'lose'); }
  h(win > bet ? 'medium' : 'heavy');
  
  return r.result;
}