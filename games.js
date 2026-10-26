// games.js

// --- МИНЫ ---
let M = null; 
const cells = [];
// Функция для расчета множителя (совпадает с серверной)
const mm = (k, m) => { let r = 0.97; for (let i = 0; i < k; i++) r *= (25 - i) / (25 - m - i); return r; };

for (let i = 0; i < 25; i++) { 
  const c = document.createElement('button'); 
  c.textContent = '?'; 
  c.onclick = () => mClick(i); 
  $('#grid').appendChild(c); 
  cells.push(c); 
}

function mUI() {
  const cur = M && M.open ? M.open.size : 0, n = cur ? mm(cur, M.m) : 1, b = $('#mbtn');
  $('#mx').textContent = 'x' + n.toFixed(2);
  $('#mn').textContent = 'x' + mm(cur + 1, M ? M.m : +$('#mc').value).toFixed(2);
  $('#mw').textContent = M && M.b ? fmt(Math.floor(M.b * n * 100) / 100) : '—';
  b.textContent = cur ? 'Забрать ' + fmt(Math.floor(M.b * n * 100) / 100) : 'Выберите ячейку';
  b.disabled = !cur;
  b.classList.toggle('cash', cur > 0);
}

async function mClick(i) {
  if (!M || M.done || M.open.has(i)) return;
  const res = await playGame('mines', M.b, { mines: M.m, picks: [...M.open, i] });
  if (!res) return;
  
  if (res.meta.hit != null) {
    cells[i].className = 'bomb'; cells[i].innerHTML = ic('bomb');
    cells.forEach((c, k) => { if (k != i && !c.className) { c.className = 'dim'; c.innerHTML = ic('gem') } });
    toast('Мина! −' + fmt(M.b), 'e'); M.done = true; mEnd(); return;
  }
  M.open.add(i); cells[i].className = 'gem'; cells[i].innerHTML = ic('gem'); h();
  if (M.open.size >= 25 - M.m) { toast('Поле очищено', 'w'); mEnd(); return; }
  mUI();
}

async function mCash() {
  if (!M || M.done || !M.open.size) return;
  const res = await playGame('mines', M.b, { mines: M.m, picks: [...M.open] });
  if (!res) return;
  M.done = true; toast('+' + fmt(res.win - M.b), 'w'); mEnd();
}

function mEnd() {
  $('#mc').disabled = false; $('#mb').disabled = false;
  $('#mbtn').textContent = 'Играть'; $('#mbtn').disabled = false; $('#mbtn').classList.remove('cash');
  mUI();
}

$('#mbtn').onclick = () => {
  if (M && !M.done && M.open.size) { mCash(); return; }
  const b = getBet('#mb'); if (!b) return;
  M = { b, m: +$('#mc').value, open: new Set(), done: false };
  cells.forEach(c => { c.className = ''; c.textContent = '?' });
  $('#mc').disabled = true; $('#mb').disabled = true; mUI();
};

$$('#mcs button').forEach(b => b.onclick = () => {
  if (M && !M.done) return;
  $('#mc').value = b.dataset.v;
  $$('#mcs button').forEach(z => z.classList.toggle('sel', z == b));
});


// --- КОЛЕСО ---
const COL = { r: '#e5384b', b: '#1f1f1f', g: '#16a34a' };
const wc = $('#wc'), wx = wc.getContext('2d'); 
wc.width = wc.height = 560;

(function () {
  const C0 = 280, r1 = 244;
  let g = wx.createRadialGradient(C0, C0, 220, C0, C0, 272); g.addColorStop(0, '#ffe9a8'); g.addColorStop(.6, '#d9a43a'); g.addColorStop(1, '#8a5a00');
  wx.beginPath(); wx.arc(C0, C0, 272, 0, 7); wx.fillStyle = g; wx.fill();
  const P = { r: ['#ff6b7e', '#a8132e'], b: ['#4d4d6b', '#0f0f1a'], g: ['#5eea9a', '#0b6a34'] };
  const WC = ['g', ...Array.from({ length: 14 }, (_, i) => i % 2 ? 'b' : 'r')];
  const A = 2 * Math.PI / 15;
  WC.forEach((k, i) => {
    const a0 = -Math.PI / 2 + i * A, gg = wx.createRadialGradient(C0, C0, 50, C0, C0, r1); gg.addColorStop(0, P[k][1]); gg.addColorStop(1, P[k][0]);
    wx.beginPath(); wx.moveTo(C0, C0); wx.arc(C0, C0, r1, a0, a0 + A); wx.closePath(); wx.fillStyle = gg; wx.fill(); wx.strokeStyle = 'rgba(255,224,150,.85)'; wx.lineWidth = 2; wx.stroke();
    wx.save(); wx.translate(C0, C0); wx.rotate(a0 + A / 2 + Math.PI / 2); wx.fillStyle = 'rgba(255,255,255,.88)'; wx.font = '700 26px system-ui,sans-serif'; wx.textAlign = 'center'; wx.fillText(i, 0, -188); wx.restore()
  });
  wx.beginPath(); wx.arc(C0, C0, r1, 0, 7); wx.strokeStyle = '#8a5a00'; wx.lineWidth = 5; wx.stroke();
  g = wx.createRadialGradient(260, 260, 5, C0, C0, 66); g.addColorStop(0, '#fff6c4'); g.addColorStop(.5, '#ffd24a'); g.addColorStop(1, '#a8680a');
  wx.beginPath(); wx.arc(C0, C0, 66, 0, 7); wx.fillStyle = g; wx.fill();
  wx.beginPath(); wx.arc(C0, C0, 46, 0, 7); wx.fillStyle = '#14102e'; wx.fill();
})();

let rot = 0, wsp = false, pick = 'r';
$$('#wp button').forEach(b => b.onclick = () => { if (wsp) return; pick = b.dataset.c; $$('#wp button').forEach(z => z.classList.toggle('sel', z == b)) });

$('#wbtn').onclick = async () => {
  if (wsp) return; const b = getBet('#wb'); if (!b) return;
  wsp = true; $('#wbtn').disabled = true;
  const res = await playGame('wheel', b, { color: pick });
  if (!res) { wsp = false; $('#wbtn').disabled = false; return; }
  
  const i = res.meta.idx, j = (Math.random() - .5) * .7;
  const des = (((-(i + .5 + j) * 360 / 15) % 360) + 360) % 360;
  rot = rot - (rot % 360) + 360 * 6 + des; wc.style.transform = `rotate(${rot}deg)`;
  
  setTimeout(() => {
    const win = res.win;
    const d = document.createElement('span'); d.className = 'dot'; d.style.background = COL[res.meta.color]; d.style.border = '1px solid #b57bff'; $('#wh').prepend(d);
    while ($('#wh').children.length > 12) $('#wh').lastChild.remove();
    toast(win ? '+' + fmt(win - b) : 'Не повезло −' + fmt(b), win ? 'w' : 'e');
    wsp = false; $('#wbtn').disabled = false;
  }, 4600);
};


// --- КРАШ ---
let C = null; const cv = $('#cv'), cx = cv.getContext('2d');
function cDraw(m, t, bad) {
  const W = (cv.clientWidth || 320) * 2, H = (cv.clientHeight || 220) * 2; cv.width = W; cv.height = H;
  const tm = Math.max(6, t * 1.15), mx = Math.max(2, m * 1.25), X = q => 20 + q / tm * (W - 60), V = q => Math.exp(.11 * q), Y = v => H - 30 - (v - 1) / (mx - 1) * (H - 70);
  cx.clearRect(0,0,W,H);
  const Pa = new Path2D(); Pa.moveTo(X(0), Y(1)); for (let q = .05; q <= t; q += .05) Pa.lineTo(X(q), Y(V(q))); Pa.lineTo(X(t), Y(V(t)));
  cx.strokeStyle = bad ? '#ff5470' : '#c19bff'; cx.lineWidth = 6; cx.stroke(Pa);
  $('#cm').textContent = 'x' + m.toFixed(2);
}

$('#cbtn').onclick = async () => {
  if (C) return;
  const b = getBet('#cb'); if (!b) return; const auto = +$('#ca').value || 0; $('#cbtn').disabled = true;
  const res = await playGame('crash', b, { cashAt: auto });
  if (!res) { $('#cbtn').disabled = false; return; }
  
  const cp = res.meta.crashPoint; let m = 1, t0 = performance.now();
  const anim = () => {
    if (m >= cp || m >= 1000) { cDraw(cp, Math.log(cp) / .11, true); $('#cm').style.color = 'var(--bad)'; return; }
    m = Math.exp(.11 * ((performance.now() - t0) / 1000));
    cDraw(m, (performance.now() - t0) / 1000, false);
    requestAnimationFrame(anim);
  };
  anim();
  setTimeout(() => { toast(res.win ? '+' + fmt(res.win - b) : 'Краш! −' + fmt(b), res.win ? 'w' : 'e'); $('#cbtn').disabled = false; C=null; }, Math.log(cp) / .11 * 1000 + 500);
};


// --- МОНЕТА ---
let fpk = 'h', fsp = false, frot = 0;
$$('#fp button').forEach(b => b.onclick = () => { if (fsp) return; fpk = b.dataset.c; $$('#fp button').forEach(z => z.classList.toggle('sel', z == b)) });

$('#fbtn').onclick = async () => {
  if (fsp) return; const b = getBet('#fb'); if (!b) return;
  fsp = true; $('#fbtn').disabled = true;
  const res = await playGame('flip', b, { side: fpk });
  if (!res) { fsp = false; $('#fbtn').disabled = false; return; }
  
  frot = frot - (frot % 360) + 1800 + (res.meta.result == 't' ? 180 : 0);
  const t3 = $('#toss'); t3.classList.remove('go'); void t3.offsetWidth; t3.classList.add('go');
  $('#coin3').style.transform = 'rotateY(' + frot + 'deg)';
  
  setTimeout(() => {
    const win = res.win;
    const d = document.createElement('span'); d.className = 'pill'; d.textContent = res.meta.result == 'h' ? 'О' : 'Р'; 
    d.style.background = res.meta.result == 'h' ? 'rgba(255,210,74,.22)' : 'rgba(139,61,255,.3)';
    $('#fh').prepend(d); while ($('#fh').children.length > 12) $('#fh').lastChild.remove();
    toast(win ? '+' + fmt(win - b) : 'Не угадали −' + fmt(b), win ? 'w' : 'e');
    fsp = false; $('#fbtn').disabled = false;
  }, 1700);
};


// --- ЛЕСЕНКА ---
const LD = { e: { p: .8, n: 10 }, n: { p: .6, n: 8 }, h: { p: .4, n: 6 } }, RH = 340;
let L = null, ldp = 'e';
const lm = (k, d) => 0.97 / Math.pow(LD[d].p, k);
const man = $('#lman'), rock = $('#lrock');
const lBot = (k, d) => 12 + k * (RH / LD[d].n) - 3;

function lUI() {
  const d = L ? L.d : ldp, n = LD[d].n, k = L ? L.k : 0, cur = k ? lm(k, d) : 1;
  $('#lx').textContent = 'x' + cur.toFixed(2);
  $('#lw').textContent = L && k ? fmt(Math.floor(L.b * cur * 100) / 100) : '—';
  $('#lcash').style.display = (L && !L.done && k) ? 'block' : 'none';
}

$('#lbtn').onclick = async () => {
  if (!L || L.done) {
    const b = getBet('#lb'); if (!b) return;
    L = { b, k: 0, d: $('#ld').value, done: false, busy: false };
    man.style.bottom = lBot(0, L.d) + 'px'; lUI(); return;
  }
  if (L.busy) return; L.busy = true;
  
  const res = await playGame('ladder', L.b, { diff: L.d, stopAt: 0 });
  if (!res) { L.busy = false; return; }
  
  let cur = 0, stepped = res.meta.stepped;
  const step = () => {
    cur++; man.style.bottom = lBot(cur, L.d) + 'px'; h();
    if (cur < stepped) { setTimeout(step, 300); return; }
    if (res.win > 0) { L.k = stepped; toast('+' + fmt(res.win - L.b), 'w'); }
    else { man.classList.add('sq'); toast('Камень! −' + fmt(L.b), 'e'); }
    L.done = true; L.busy = false; lUI();
  };
  step();
};

$('#lcash').onclick = () => { if (L && !L.busy) L.done = true; };
$$('#lds button').forEach(b => b.onclick = () => {
  if (L && !L.done) return;
  ldp = b.dataset.v; $('#ld').value = ldp;
  $$('#lds button').forEach(z => z.classList.toggle('sel', z == b));
  L = null; lUI();
});