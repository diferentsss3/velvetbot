// games.js

// --- МИНЫ ---
let M = null; 
const cells = [];
const mm = (k, m) => { let r = S.cfg.mines / 100; for (let i = 0; i < k; i++) r *= (25 - i) / (25 - m - i); return r; };

if ($('#grid')) {
  for (let i = 0; i < 25; i++) { 
    const c = document.createElement('button'); 
    c.textContent = '?'; 
    c.onclick = () => mClick(i); 
    $('#grid').appendChild(c); 
    cells.push(c); 
  }
}

function mUI() {
  const cur = M && M.open ? M.open.size : 0;
  const n = cur ? mm(cur, M.m) : 1;
  const b = $('#mbtn');
  if (!b) return;
  
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
    cells[i].className = 'bomb'; 
    cells[i].innerHTML = ic('bomb');
    cells.forEach((c, k) => { if (k != i && !c.className) { c.className = 'dim'; c.innerHTML = ic('gem') } });
    toast('Мина! −' + fmt(M.b), 'e'); 
    M.done = true; 
    mEnd(); 
    return;
  }
  
  M.open.add(i); 
  cells[i].className = 'gem'; 
  cells[i].innerHTML = ic('gem'); 
  h();
  
  if (M.open.size >= 25 - M.m) { 
    toast('Поле очищено', 'w'); 
    mCash(); 
    return; 
  }
  mUI();
}

async function mCash() {
  if (!M || M.done || !M.open.size) return;
  const res = await playGame('mines', M.b, { mines: M.m, picks: [...M.open] });
  if (!res) return;
  M.done = true; 
  toast('+' + fmt(res.win - M.b), 'w'); 
  mEnd();
}

function mEnd() {
  $('#mc').disabled = false; 
  $('#mb').disabled = false; 
  $('#mbtn').textContent = 'Играть'; 
  $('#mbtn').disabled = false; 
  $('#mbtn').classList.remove('cash'); 
  mUI();
}

if ($('#mbtn')) {
  $('#mbtn').onclick = () => {
    if (M && !M.done && M.open.size) { mCash(); return; }
    const b = getBet('#mb'); 
    if (!b) return;
    M = { b, m: +$('#mc').value, open: new Set(), done: false };
    cells.forEach(c => { c.className = ''; c.textContent = '?' });
    $('#mc').disabled = true; 
    $('#mb').disabled = true; 
    mUI();
  };
}

$$('#mcs button').forEach(b => b.onclick = () => {
  if (M && !M.done) return;
  $('#mc').value = b.dataset.v;
  $$('#mcs button').forEach(z => z.classList.toggle('sel', z == b));
});


// --- КОЛЕСО ---
const COL = { r: '#e5384b', b: '#1f1f1f', g: '#16a34a' };
const wc = $('#wc'), wx = wc?.getContext('2d'); 
if (wc) wc.width = wc.height = 560;

if (wx) {
  (function () {
    const C0 = 280, r1 = 244; 
    let g = wx.createRadialGradient(C0, C0, 220, C0, C0, 272); 
    g.addColorStop(0, '#ffe9a8'); g.addColorStop(.6, '#d9a43a'); g.addColorStop(1, '#8a5a00');
    wx.beginPath(); wx.arc(C0, C0, 272, 0, 7); wx.fillStyle = g; wx.fill();
    
    const P = { r: ['#ff6b7e', '#a8132e'], b: ['#4d4d6b', '#0f0f1a'], g: ['#5eea9a', '#0b6a34'] };
    const WC = ['g', ...Array.from({ length: 14 }, (_, i) => i % 2 ? 'b' : 'r')];
    const A = 2 * Math.PI / 15;
    
    WC.forEach((k, i) => {
      const a0 = -Math.PI / 2 + i * A, gg = wx.createRadialGradient(C0, C0, 50, C0, C0, r1); 
      gg.addColorStop(0, P[k][1]); gg.addColorStop(1, P[k][0]);
      wx.beginPath(); wx.moveTo(C0, C0); wx.arc(C0, C0, r1, a0, a0 + A); wx.closePath(); wx.fillStyle = gg; wx.fill(); wx.strokeStyle = 'rgba(255,224,150,.85)'; wx.lineWidth = 2; wx.stroke();
      wx.save(); wx.translate(C0, C0); wx.rotate(a0 + A / 2 + Math.PI / 2); wx.fillStyle = 'rgba(255,255,255,.88)'; wx.font = '700 26px system-ui,sans-serif'; wx.textAlign = 'center'; wx.fillText(i, 0, -188); wx.restore();
    });
    
    wx.beginPath(); wx.arc(C0, C0, r1, 0, 7); wx.strokeStyle = '#8a5a00'; wx.lineWidth = 5; wx.stroke();
    
    g = wx.createRadialGradient(260, 260, 5, C0, C0, 66); 
    g.addColorStop(0, '#fff6c4'); g.addColorStop(.5, '#ffd24a'); g.addColorStop(1, '#a8680a');
    wx.beginPath(); wx.arc(C0, C0, 66, 0, 7); wx.fillStyle = g; wx.fill();
    wx.beginPath(); wx.arc(C0, C0, 46, 0, 7); wx.fillStyle = '#14102e'; wx.fill();
    wx.fillStyle = '#ffd24a'; wx.font = '700 44px system-ui,sans-serif'; wx.textAlign = 'center'; wx.textBaseline = 'middle'; wx.fillText('V', C0, C0 + 3);
  })();
}

let rot = 0, wsp = false, pick = 'r';
$$('#wp button').forEach(b => b.onclick = () => { 
  if (wsp) return; 
  pick = b.dataset.c; 
  $$('#wp button').forEach(z => z.classList.toggle('sel', z == b)) 
});

if ($('#wbtn')) {
  $('#wbtn').onclick = async () => {
    if (wsp) return; 
    const b = getBet('#wb'); 
    if (!b) return;
    wsp = true; 
    $('#wbtn').disabled = true;
    
    const res = await playGame('wheel', b, { color: pick });
    if (!res) { wsp = false; $('#wbtn').disabled = false; return; }
    
    const i = res.meta.idx, j = (Math.random() - .5) * .7;
    const des = (((-(i + .5 + j) * 360 / 15) % 360) + 360) % 360;
    rot = rot - (rot % 360) + 360 * 6 + des; 
    wc.style.transform = `rotate(${rot}deg)`;
    
    setTimeout(() => {
      const win = res.win;
      const d = document.createElement('span'); 
      d.className = 'dot'; 
      d.style.background = COL[res.meta.color]; 
      d.style.border = '1px solid #b57bff'; 
      $('#wh').prepend(d);
      while ($('#wh').children.length > 12) $('#wh').lastChild.remove();
      toast(win ? '+' + fmt(win - b) : 'Не повезло −' + fmt(b), win ? 'w' : 'e');
      wsp = false; 
      $('#wbtn').disabled = false;
    }, 4600);
  };
}


// --- КРАШ ---
let C = null; 
const cv = $('#cv'), cx = cv?.getContext('2d');
function cDraw(m, t, bad) {
  if (!cv || !cx) return;
  const W = (cv.clientWidth || 320) * 2, H = (cv.clientHeight || 220) * 2; 
  cv.width = W; cv.height = H;
  const tm = Math.max(6, t * 1.15), mx = Math.max(2, m * 1.25), X = q => 20 + q / tm * (W - 60), V = q => Math.exp(.11 * q), Y = v => H - 30 - (v - 1) / (mx - 1) * (H - 70);
  cx.clearRect(0, 0, W, H);
  cx.font = '600 20px system-ui,sans-serif'; cx.textAlign = 'left';
  
  for (let g = 0; g <= 4; g++) {
    const v = 1 + (mx - 1) * g / 4, y = Y(v);
    cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); 
    cx.strokeStyle = 'rgba(255,255,255,.07)'; cx.lineWidth = 2; cx.stroke();
    if (g) { cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillText('x' + v.toFixed(v < 10 ? 1 : 0), 10, y - 8) }
  }
  
  const Pa = new Path2D(); Pa.moveTo(X(0), Y(1));
  for (let q = .05; q <= t; q += .05) Pa.lineTo(X(q), Y(V(q)));
  Pa.lineTo(X(t), Y(V(t)));
  
  const F = new Path2D(Pa); F.lineTo(X(t), H); F.lineTo(X(0), H); F.closePath();
  const gr = cx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, bad ? 'rgba(255,84,112,.4)' : 'rgba(139,61,255,.5)'); 
  gr.addColorStop(1, 'rgba(139,61,255,0)');
  cx.fillStyle = gr; cx.fill(F);
  cx.strokeStyle = bad ? '#ff5470' : '#c19bff'; 
  cx.shadowColor = bad ? '#ff5470' : '#8b3dff'; 
  cx.shadowBlur = 18; cx.lineWidth = 6; cx.lineJoin = 'round'; cx.lineCap = 'round'; 
  cx.stroke(Pa); cx.shadowBlur = 0;
  
  const tx = X(t), ty = Y(V(t)), r = $('#cr');
  if (bad) {
    const bg = cx.createRadialGradient(tx, ty, 0, tx, ty, 80);
    bg.addColorStop(0, 'rgba(255,230,150,.95)'); bg.addColorStop(.4, 'rgba(255,100,70,.6)'); bg.addColorStop(1, 'rgba(255,84,112,0)');
    cx.fillStyle = bg; cx.beginPath(); cx.arc(tx, ty, 80, 0, 7); cx.fill();
    cx.strokeStyle = '#ffd0a0'; cx.lineWidth = 4;
    for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, d = k % 2 ? 56 : 70; cx.beginPath(); cx.moveTo(tx + Math.cos(a) * 34, ty + Math.sin(a) * 34); cx.lineTo(tx + Math.cos(a) * d, ty + Math.sin(a) * d); cx.stroke() }
  }
  if (r) {
    r.style.display = bad ? 'none' : 'block';
    if (!bad) { const q = Math.max(0, t - .1), ang = Math.atan2(Y(V(t)) - Y(V(q)) || -1, X(t) - X(q) || 1) * 180 / Math.PI + 55; r.style.left = tx / 2 + 'px'; r.style.top = ty / 2 + 'px'; r.style.transform = 'rotate(' + ang + 'deg)' }
  }
  $('#cm').textContent = 'x' + m.toFixed(2);
}

if ($('#cbtn')) {
  $('#cbtn').onclick = async () => {
    if (C) return;
    const b = getBet('#cb'); 
    if (!b) return; 
    const auto = +$('#ca').value || 0; 
    $('#cbtn').disabled = true;
    
    const res = await playGame('crash', b, { cashAt: auto });
    if (!res) { $('#cbtn').disabled = false; return; }
    
    const cp = res.meta.crashPoint; 
    let m = 1, t0 = performance.now();
    
    const anim = () => {
      if (m >= cp || m >= 1000) { 
        cDraw(cp, Math.log(cp) / .11, true); 
        $('#cm').style.color = 'var(--bad)'; 
        return; 
      }
      m = Math.exp(.11 * ((performance.now() - t0) / 1000));
      cDraw(m, (performance.now() - t0) / 1000, false);
      requestAnimationFrame(anim);
    };
    anim();
    
    setTimeout(() => {
      toast(res.win ? '+' + fmt(res.win - b) : 'Краш! −' + fmt(b), res.win ? 'w' : 'e');
      $('#cbtn').disabled = false; C = null;
    }, Math.log(cp) / .11 * 1000 + 500);
  };
}


// --- МОНЕТА ---
let fpk = 'h', fsp = false, frot = 0;
$$('#fp button').forEach(b => b.onclick = () => { 
  if (fsp) return; 
  fpk = b.dataset.c; 
  $$('#fp button').forEach(z => z.classList.toggle('sel', z == b)) 
});

if ($('#fbtn')) {
  $('#fbtn').onclick = async () => {
    if (fsp) return; 
    const b = getBet('#fb'); 
    if (!b) return;
    fsp = true; 
    $('#fbtn').disabled = true;
    
    const res = await playGame('flip', b, { side: fpk });
    if (!res) { fsp = false; $('#fbtn').disabled = false; return; }
    
    frot = frot - (frot % 360) + 1800 + (res.meta.result == 't' ? 180 : 0);
    const t3 = $('#toss'); 
    if (t3) { t3.classList.remove('go'); void t3.offsetWidth; t3.classList.add('go'); }
    if ($('#coin3')) $('#coin3').style.transform = 'rotateY(' + frot + 'deg)';
    
    setTimeout(() => {
      const win = res.win;
      const d = document.createElement('span'); 
      d.className = 'pill'; 
      d.textContent = res.meta.result == 'h' ? 'О' : 'Р';
      d.style.background = res.meta.result == 'h' ? 'rgba(255,210,74,.22)' : 'rgba(139,61,255,.3)';
      d.style.color = res.meta.result == 'h' ? '#ffd24a' : '#d9b3ff';
      if ($('#fh')) {
        $('#fh').prepend(d); 
        while ($('#fh').children.length > 12) $('#fh').lastChild.remove();
      }
      toast(win ? '+' + fmt(win - b) : 'Не угадали −' + fmt(b), win ? 'w' : 'e');
      fsp = false; 
      $('#fbtn').disabled = false;
    }, 1700);
  };
}


// --- ЛЕСЕНКА ---
const LD = { e: { p: .8, n: 10 }, n: { p: .6, n: 8 }, h: { p: .4, n: 6 } }, RH = 340;
let L = null, ldp = 'e';
const lm = (k, d) => 0.97 / Math.pow(LD[d].p, k);
const man = $('#lman'), rock = $('#lrock');
const lBot = (k, d) => 12 + k * (RH / LD[d].n) - 3;

function lBuild(d) {
  const h = $('#lrows'); 
  if (!h) return;
  h.innerHTML = '';
  for (let i = LD[d].n; i >= 1; i--) {
    const r = document.createElement('div'); 
    r.className = 'lr'; r.dataset.i = i; 
    r.innerHTML = '<span></span>'; 
    r.firstChild.textContent = 'x' + lm(i, d).toFixed(2); 
    h.appendChild(r);
  }
}
function lReset(d) {
  lBuild(d);
  if (man) { man.classList.remove('sq'); man.style.transition = 'none'; man.style.bottom = lBot(0, d) + 'px'; void man.offsetWidth; man.style.transition = ''; }
  if (rock) { rock.style.transition = 'none'; rock.style.top = '-100px'; }
  if ($('#ldust')) $('#ldust').className = '';
}
function lUI() {
  const d = L ? L.d : ldp, n = LD[d].n, k = L ? L.k : 0, cur = k ? lm(k, d) : 1;
  $$('#lrows .lr').forEach(r => { const i = +r.dataset.i; r.classList.toggle('ps', i <= k); r.classList.toggle('nx', !!L && !L.done && i == k + 1) });
  if ($('#lx')) $('#lx').textContent = 'x' + cur.toFixed(2);
  if ($('#ln')) $('#ln').textContent = k < n ? 'x' + lm(k + 1, d).toFixed(2) : '—';
  if ($('#lc')) $('#lc').textContent = Math.round(LD[d].p * 100) + '%';
  if ($('#lw')) $('#lw').textContent = L && k ? fmt(Math.floor(L.b * cur * 100) / 100) : '—';
  
  const a = L && !L.done;
  if ($('#lbtn')) $('#lbtn').textContent = a ? 'Подняться на ступень' : 'Играть';
  if ($('#lcash')) {
    $('#lcash').style.display = a && k ? 'block' : 'none';
    if (a && k) $('#lcash').textContent = 'Забрать ' + fmt(Math.floor(L.b * cur * 100) / 100);
  }
}

if ($('#lbtn')) {
  $('#lbtn').onclick = async () => {
    if (!L || L.done) {
      const b = getBet('#lb'); 
      if (!b) return;
      const d = $('#ld').value; ldp = d;
      L = { b, k: 0, d, done: false, busy: false };
      lReset(d); lUI(); return;
    }
    if (L.busy) return; 
    L.busy = true;
    
    const res = await playGame('ladder', L.b, { diff: L.d, stopAt: 0 });
    if (!res) { L.busy = false; return; }
    
    let cur = 0, stepped = res.meta.stepped;
    const step = () => {
      cur++; 
      if (man) man.style.bottom = lBot(cur, L.d) + 'px'; 
      h();
      if (cur < stepped) { setTimeout(step, 300); return; }
      if (res.win > 0) { L.k = stepped; toast('+' + fmt(res.win - L.b), 'w'); }
      else { if (man) man.classList.add('sq'); toast('Камень! −' + fmt(L.b), 'e'); }
      L.done = true; L.busy = false; lUI();
    };
    step();
  };
}

if ($('#lcash')) $('#lcash').onclick = () => { if (L && !L.busy) L.done = true; };

$$('#lds button').forEach(b => b.onclick = () => {
  if (L && !L.done) return;
  ldp = b.dataset.v; $('#ld').value = ldp;
  $$('#lds button').forEach(z => z.classList.toggle('sel', z == b));
  L = null; lReset(ldp); lUI();
});

lReset('e'); lUI();