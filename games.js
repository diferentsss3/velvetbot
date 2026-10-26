// МИНЫ
let M = null; const cells = [];
const mm = (k, m) => { let r = S.cfg.mines / 100; for (let i = 0; i < k; i++) r *= (25 - i) / (25 - m - i); return r; };
for (let i = 0; i < 25; i++) { const c = document.createElement('button'); c.textContent = '?'; c.onclick = () => mClick(i); $('#grid').appendChild(c); cells.push(c); }
function mUI() {
  const cur = M && M.open ? M.open.size : 0, n = cur ? mm(cur, M.m) : 1, b = $('#mbtn');
  $('#mx').textContent = 'x' + n.toFixed(2); $('#mn').textContent = 'x' + mm(cur + 1, M ? M.m : +$('#mc').value).toFixed(2);
  b.textContent = cur ? 'Забрать' : 'Играть'; b.disabled = false;
}
async function mClick(i) {
  if (!M || M.done || M.open.has(i)) return;
  const res = await playGame('mines', M.b, { mines: M.m, picks: [...M.open, i] });
  if (!res) return;
  if (res.meta.hit != null) {
    cells[i].className = 'bomb'; cells[i].innerHTML = ic('bomb');
    toast('Мина! −' + fmt(M.b), 'e'); M.done = true;
    $('#mbtn').textContent = 'Играть'; return;
  }
  M.open.add(i); cells[i].className = 'gem'; cells[i].innerHTML = ic('gem');
  mUI();
}
$('#mbtn').onclick = async () => {
  if (M && !M.done && M.open.size) {
    const res = await playGame('mines', M.b, { mines: M.m, picks: [...M.open] });
    if (res) toast('+' + fmt(res.win - M.b), 'w');
    M.done = true; $('#mbtn').textContent = 'Играть'; return;
  }
  const b = getBet('#mb'); if (!b) return;
  M = { b, m: +$('#mc').value, open: new Set(), done: false };
  cells.forEach(c => { c.className = ''; c.textContent = '?'; });
  mUI();
};

// ОСТАЛЬНЫЕ ИГРЫ (Колесо, Краш, Монета) - логика по аналогии, просто вызывают playGame