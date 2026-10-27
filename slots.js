// slots.js — Оригинальные слоты

const LINES=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[1,0,0,0,1],[1,2,2,2,1],[0,0,1,2,2],[2,2,1,0,0],[1,2,1,0,1],[1,0,1,2,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,0,2,0,0],[2,2,0,2,2],[0,2,2,2,0]];
const CAPX=135000,zeros=()=>[0,1,2,3,4].map(()=>[0,0,0]),RI=n=>Math.floor(Math.random()*n);
function pickW(o){const k=Object.keys(o);let t=Math.random()*k.reduce((a,x)=>a+o[x],0);for(const x of k){t-=o[x];if(t<0)return x}return k[0]}
const wmul=(G,fs)=>G.wm?G.wm(fs):1;
function drawSym(G,c,fs){
 const w=G.keys.map(k=>{let x=(fs&&G.wtf&&G.wtf[k]!=null)?G.wtf[k]:(G.wt[k]||0);
  if(k=='wild'&&!G.wildR.includes(c))x=0;if(k=='scat'&&(!G.scatR.includes(c)||(fs&&G.noScatFS)))x=0;return x});
 let t=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<w.length;i++){t-=w[i];if(t<0)return G.keys[i]}return G.keys[0]}
const mkc=(G,s,fs)=>({s,m:s=='wild'?wmul(G,fs):0});
function spinGrid(G,fs,st){const g=[];for(let c=0;c<5;c++){g[c]=[];for(let r=0;r<3;r++){if(st&&st[c][r]){g[c][r]={s:'wild',m:st[c][r]};continue}g[c][r]=mkc(G,drawSym(G,c,fs),fs)}}return g}
function evalGrid(G,g,fs){
 let total=0;const wins=[];
 LINES.forEach((ln,li)=>{
  const cs=ln.map((r,c)=>g[c][r]);let tgt=null;
  for(const x of cs){if(x.s=='scat')break;if(x.s!='wild'){tgt=x.s;break}}
  if(!tgt||!G.pay[tgt])return;
  let n=0,mult=0,wl=0;
  for(const x of cs){if(x.s==tgt||x.s=='wild'){n++;if(x.s=='wild'){wl++;mult+=x.m}}else break}
  if(n<3)return;
  const mm=(wl&&fs&&G.wsum)?mult:1,pay=G.pay[tgt][n-3]*mm;
  total+=pay;wins.push({li,n,pay,mm,cells:ln.slice(0,n).map((r,c)=>[c,r])})});
 return{total,wins}}
const scatCount=(G,g)=>G.byReel?g.filter(col=>col.some(x=>x.s=='scat')).length:g.reduce((a,col)=>a+col.filter(x=>x.s=='scat').length,0);
const cloneG=g=>g.map(col=>col.map(x=>({...x})));
function postDraw(G,g,fs,ctx){
 const c2=cloneG(g);
 if(G.mech=='expand'){for(const c of G.wildR){const w=c2[c].find(x=>x.s=='wild');if(w)for(let r=0;r<3;r++)c2[c][r]={s:'wild',m:w.m}}}
 else if(G.mech=='book'&&fs&&ctx.E){for(let c=0;c<5;c++)if(c2[c].some(x=>x.s==ctx.E))for(let r=0;r<3;r++)c2[c][r]={s:ctx.E,m:0}}
 else if(G.mech=='dragon'){const n=fs?3+RI(4):(Math.random()<G.breath?2+RI(3):0);for(let i=0;i<n;i++){const c=RI(5),r=RI(3);if(c2[c][r].s!='scat')c2[c][r]={s:'wild',m:wmul(G,fs)}}}
 else if(G.mech=='mystery'){const cl=[];c2.forEach((col,c)=>col.forEach((x,r)=>{if(x.s=='myst')cl.push([c,r])}));if(cl.length){const rv=pickW(G.mw);for(const[c,r]of cl)c2[c][r]=mkc(G,rv,fs)}}
 return c2}
function tumbleNext(G,g,ev,fs){
 const rm=new Set();ev.wins.forEach(w=>w.cells.forEach(([c,r])=>rm.add(c*3+r)));
 return g.map((col,c)=>{const keep=col.filter((x,r)=>!rm.has(c*3+r)),n=3-keep.length,nw=[];for(let i=0;i<n;i++)nw.push(mkc(G,drawSym(G,c,fs),fs));return nw.concat(keep)})}
function resolve(G,g0,fs,ctx){
 const g1=postDraw(G,g0,fs,ctx),steps=[];let total=0;
 if(G.mech=='tumble'){
  let g=g1,m=fs?ctx.tm:1;
  for(let k=0;k<14;k++){const ev=evalGrid(G,g,fs);
   if(ev.total<=0){steps.push({g,ev:{total:0,wins:[]},m,win:0});break}
   steps.push({g,ev,m,win:ev.total*m});total+=ev.total*m;m++;g=tumbleNext(G,g,ev,fs)}
  if(fs)ctx.tm=Math.min(25,m)}
 else{
  const ev=evalGrid(G,g1,fs);let m=fs?(G.fsMult||1):1;
  if(G.mech=='streak')m=fs?Math.min(G.fsCap||10,1+(G.fsStep||1)*ctx.fsw):[1,2,3,5,8][Math.min(ctx.streak,4)];
  steps.push({g:g1,ev,m,win:ev.total*m});total=ev.total*m;
  if(G.mech=='streak'){if(ev.total>0){fs?ctx.fsw++:ctx.streak++}else if(!fs)ctx.streak=0}}
 return{g1,steps,total,final:steps[steps.length-1].g}}
const newFS=G=>({st:G.mech=='cat'?zeros():null,E:G.mech=='book'?pickW(G.ew):null,tm:1,fsw:0,streak:0});

const PT={l1:[3,8,30],l2:[3,8,30],l3:[4,10,40],l4:[6,16,60],l5:[6,16,60],m1:[8,25,100],m2:[10,30,120],h1:[16,50,200],h2:[24,80,300],h3:[40,120,600]};
const WT={l1:20,l2:20,l3:18,l4:14,l5:12,m1:8,m2:7,h1:6,h2:4,h3:3,wild:10,scat:9};
const K=['l1','l2','l3','l4','l5','m1','m2','h1','h2','h3','wild','scat'];
const SLOTS={
 cat:{keys:['9','10','J','Q','K','A','collar','fish','c1','c2','c3','c4','wild','scat'],mech:'cat',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:7,noScatFS:true,wsum:true,
  wm:fs=>fs?(Math.random()<.6?2:3):1,wt:{'9':20,'10':20,J:18,Q:16,K:12,A:10,collar:7,fish:6,c1:6,c2:5,c3:4,c4:3,wild:10,scat:9},wtf:{wild:9},
  pay:{'9':[6.3,16.8,63],'10':[6.3,16.8,63],J:[8.4,21,84],Q:[8.4,21,84],K:[12.6,33.6,126],A:[12.6,33.6,126],collar:[16.8,52.5,210],fish:[21,63,252],c1:[25.2,84,315],c2:[33.6,105,420],c3:[42,147,630],c4:[63,210,1050]}},
 gold:{keys:K,mech:'expand',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,wsum:true,wm:fs=>fs?2:1,wt:{...WT,wild:5},wtf:{wild:8},pay:PT},
 pha:{keys:K,mech:'book',wildR:[1,2,3],scatR:[0,1,2,3,4],byReel:false,fsn:10,noScatFS:true,fsMult:3,wt:{...WT,wild:6,scat:4},ew:{h1:3,h2:3,h3:2,m1:2,m2:2},pay:PT},
 neon:{keys:K,mech:'streak',wildR:[1,2,3],scatR:[0,1,2,3,4],byReel:false,fsn:8,noScatFS:true,fsStep:2,fsCap:15,wt:{...WT,wild:8,scat:4},pay:PT},
 dra:{keys:K,mech:'dragon',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,breath:.12,fsMult:1,wt:{...WT,wild:4},pay:PT},
 cos:{keys:K,mech:'tumble',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,wt:{...WT,wild:8},pay:PT},
 pot:{keys:[...K,'myst'],mech:'mystery',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,fsMult:3,wt:{...WT,wild:5,myst:6},wtf:{myst:10},mw:{l3:8,l4:8,l5:8,m1:8,m2:8,h1:6,h2:5,h3:4,wild:3},pay:PT}
};

const CAL={"gold":{"pay":{"l1":[4.76,12.68,47.55],"l2":[4.76,12.68,47.55],"l3":[6.34,15.85,63.4],"l4":[9.51,25.36,95.11],"l5":[9.51,25.36,95.11],"m1":[12.68,39.63,158.51],"m2":[15.85,47.55,190.21],"h1":[25.36,79.26,317.02],"h2":[38.04,126.81,475.53],"h3":[63.4,190.21,951.07]},"base":0.9766},"pha":{"pay":{"l1":[9.45,25.19,94.45],"l2":[9.45,25.19,94.45],"l3":[12.59,31.48,125.94],"l4":[18.89,50.37,188.9],"l5":[18.89,50.37,188.9],"m1":[25.19,78.71,314.84],"m2":[31.48,94.45,377.81],"h1":[50.37,157.42,629.68],"h2":[75.56,251.87,944.51],"h3":[125.94,377.81,1889.03]},"base":0.9732},"neon":{"pay":{"l1":[5.83,15.54,58.28],"l2":[5.83,15.54,58.28],"l3":[7.77,19.43,77.7],"l4":[11.66,31.08,116.55],"l5":[11.66,31.08,116.55],"m1":[15.54,48.56,194.26],"m2":[19.43,58.28,233.11],"h1":[31.08,97.13,388.51],"h2":[46.62,155.4,582.77],"h3":[77.7,233.11,1165.53]},"base":0.9675},"dra":{"pay":{"l1":[4.62,12.33,46.25],"l2":[4.62,12.33,46.25],"l3":[6.17,15.42,61.66],"l4":[9.25,24.66,92.49],"l5":[9.25,24.66,92.49],"m1":[12.33,38.54,154.15],"m2":[15.42,46.25,184.98],"h1":[24.66,77.08,308.3],"h2":[37,123.32,462.45],"h3":[61.66,184.98,924.91]},"base":0.9673},"cos":{"pay":{"l1":[6.57,17.52,65.68],"l2":[6.57,17.52,65.68],"l3":[8.76,21.89,87.58],"l4":[13.14,35.03,131.36],"l5":[13.14,35.03,131.36],"m1":[17.52,54.73,218.94],"m2":[21.89,65.68,262.73],"h1":[35.03,109.47,437.88],"h2":[52.55,175.15,656.81],"h3":[87.58,262.73,1313.63]},"base":0.9659},"pot":{"pay":{"l1":[12.31,32.84,123.14],"l2":[12.31,32.84,123.14],"l3":[16.42,41.05,164.19],"l4":[24.63,65.68,246.28],"l5":[24.63,65.68,246.28],"m1":[32.84,102.62,410.47],"m2":[41.05,123.14,492.56],"h1":[65.68,205.24,820.94],"h2":[98.51,328.38,1231.41],"h3":[164.19,492.56,2462.82]},"base":0.9738}};
const LT5={l1:'10',l2:'J',l3:'Q',l4:'K',l5:'A'},ORD=['h3','h2','h1','m2','m1','l5','l4','l3','l2','l1'];
const META={
 cat:{name:'Cat House',sub:'Липкие вайлды x2 и x3',wl:'WILD',sl:'BONUS',lt:{'9':'9','10':'10',J:'J',Q:'Q',K:'K',A:'A'},ico:k=>k=='wild'?'yarn':k=='scat'?'paw':k,order:['c4','c3','c2','c1','fish','collar','A','K','Q','J','10','9'],hero:'c2',
  fsText:'фриспинов. Вайлды-клубки липкие и получают множитель x2 или x3.',rules:'Вайлд-клубок выпадает на барабанах 2–4. Три бонус-символа на барабанах 1, 3 и 5 дают 7 фриспинов: вайлды становятся липкими и получают множитель x2 или x3, множители в одной линии складываются.',base:0.965},
 gold:{name:'Gold Rush',sub:'Взрывные расширяющиеся вайлды',wl:'TNT',sl:'GOLD',fsText:'фриспинов. Динамит расширяется на весь барабан и даёт множитель x2.',rules:'Вайлд-динамит на барабанах 2–4 взрывается и занимает весь барабан. Три золотых самородка на барабанах 1, 3 и 5 дают 8 фриспинов, где расширенные вайлды умножают выигрыш на x2.'},
 pha:{name:'Pharaoh Gold',sub:'Расширяющийся символ из книги',wl:'MASK',sl:'BOOK',fsText:'фриспинов. Перед началом выбирается особый символ: он занимает барабан целиком.',rules:'Три книги где угодно дают 10 фриспинов. Перед бонусом выбирается особый символ: на любом барабане, где он выпал, он расширяется на все три ячейки. Выигрыши бонуса умножаются на x3.'},
 neon:{name:'Neon Fruits',sub:'Серия побед растит множитель',wl:'WILD',sl:'BONUS',fsText:'фриспинов. Множитель растёт с каждым выигрышем и не сбрасывается.',rules:'Выигрыши подряд повышают множитель: x1, x2, x3, x5, x8, а проигрыш сбрасывает серию. Три бонус-символа где угодно дают 8 фриспинов, где множитель растёт на 2 с каждым выигрышем (до x15).',fsStep:2},
 dra:{name:'Dragon Pearl',sub:'Дыхание дракона создаёт вайлды',wl:'PEARL',sl:'INGOT',fsText:'фриспинов. Дракон выдыхает пламя каждый спин и превращает 3–6 ячеек в вайлды.',rules:'Иногда дракон выдыхает пламя и превращает 2–4 случайные ячейки в вайлды-жемчужины. Три слитка на барабанах 1, 3 и 5 дают 8 фриспинов, где пламя срабатывает каждый спин и создаёт 3–6 вайлдов.'},
 cos:{name:'Cosmic Drift',sub:'Каскады с растущим множителем',wl:'NOVA',sl:'COMET',fsText:'фриспинов. Множитель каскадов не сбрасывается между спинами.',rules:'Выигрышные символы исчезают, сверху падают новые. Каждый каскад поднимает множитель на единицу. Три кометы на барабанах 1, 3 и 5 дают 8 фриспинов, где множитель не сбрасывается между каскадами и спинами (до x25).'},
 pot:{name:'Magic Potion',sub:'Загадочные карты превращаются',wl:'ORB',sl:'MOON',fsText:'фриспинов. Загадочных карт больше, а выигрыши умножаются на x3.',rules:'Загадочные карты после остановки барабанов превращаются в один и тот же символ. Три луны на барабанах 1, 3 и 5 дают 8 фриспинов с большим числом карт и множителем x3.'}
};
for(const id in SLOTS){const G=SLOTS[id],M=META[id];Object.assign(G,M);G.id=id;
 if(CAL[id]){G.pay=CAL[id].pay;G.base=CAL[id].base}
 if(id!='cat'){G.lt=LT5;G.order=ORD;G.hero='h1';G.ico=k=>id+'-'+k}}
const BETS=[1,2,5,10,20,50,100,200,500,1000];
const SL={fs:0,fsTot:0,ctx:null,fctx:null,busy:false,bi:3,turbo:false,G:null},slp=ms=>new Promise(r=>setTimeout(r,ms));
const cellEl=[],slotScale=()=>{
  const rtp = Number(S.cfg && S.cfg.slot) || 96;
  const base = Number(SL.G && SL.G.base) || 0.965;
  return rtp / 100 / base;
};
const mkS=s=>mkc(SL.G,s,false);
function symHTML(x){const G=SL.G,s=x.s;
 if(G.lt[s])return '<b class="lt t'+s+'">'+G.lt[s]+'</b>';
 if(s=='wild')return ic(G.ico('wild'))+'<i class="wt">'+G.wl+'</i>'+(x.m>1?'<em class="wm">x'+x.m+'</em>':'');
 if(s=='scat')return ic(G.ico('scat'))+'<i class="bt">'+G.sl+'</i>';
 return ic(G.ico(s))}
function setCell(c,r,x,ex){const e=cellEl[c][r];e.className='cell k-'+x.s+' kk-'+x.s+(ex?' '+ex:'');e.innerHTML=symHTML(x)}
function renderGrid(g,ex){for(let c=0;c<5;c++)for(let r=0;r<3;r++)setCell(c,r,g[c][r],ex)}
(function(){const R=$('#sreels');if(!R)return;R.innerHTML='';for(let c=0;c<5;c++){const col=document.createElement('div');col.className='sreel';cellEl[c]=[];for(let r=0;r<3;r++){const e=document.createElement('div');col.appendChild(e);cellEl[c][r]=e}R.appendChild(col)}})();
function slotAnim(g,free,ctx){return new Promise(res=>{const G=SL.G,T=SL.turbo,st=free?ctx.st:null,stopped=[0,0,0,0,0];const rnd=()=>{for(let c=0;c<5;c++)if(!stopped[c])for(let r=0;r<3;r++){if(st&&st[c][r])continue;setCell(c,r,mkS(drawSym(G,c,!!free)),'spin')}};rnd();const iv=setInterval(rnd,70);for(let c=0;c<5;c++)setTimeout(()=>{stopped[c]=1;for(let r=0;r<3;r++)setCell(c,r,g[c][r],'drop');h();if(c==4){clearInterval(iv);setTimeout(res,160)}},(T?220:600)+c*(T?80:240))})}
function hl(wins){const on=new Set();wins.forEach(w=>w.cells.forEach(([c,r])=>on.add(c*3+r)));cellEl.forEach((col,c)=>col.forEach((e,r)=>{const k=on.has(c*3+r);e.classList.remove('drop','spin','pop');e.classList.toggle('wn',k);e.classList.toggle('dm',!k&&on.size>0)}))}
function countUp(v){const el=$('#swn'),t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/600);el.textContent=fmt(v*k);if(k<1)requestAnimationFrame(f)})(t0)}
function slotLock(b){$('#sm1').disabled=$('#sp1').disabled=$('#sspin').disabled=$('#sinfo').disabled=b;$('#sspin').classList.toggle('busy',b)}
function bigWin(win,bet){const x=win/bet,b=$('#sbig'),f=$('#sfx');b.innerHTML='<b></b><span></span>';b.firstChild.textContent=x>=100?'МЕГА ВЫИГРЫШ':x>=40?'ОГРОМНЫЙ ВЫИГРЫШ':'БОЛЬШОЙ ВЫИГРЫШ';b.lastChild.textContent='+'+fmt(win);b.classList.remove('on');void b.offsetWidth;b.classList.add('on');for(let i=0,n=Math.min(44,14+Math.floor(x/2));i<n;i++){const c=document.createElement('i');c.style.left=Math.random()*94+'%';c.style.animationDuration=(1.2+Math.random()*1.4)+'s';c.style.animationDelay=Math.random()*.8+'s';f.appendChild(c);setTimeout(()=>c.remove(),3600)}h('heavy')}
function hud(){const G=SL.G,e=$('#sfs'),F=SL.fctx;let t='';
 if(F){t='ФРИСПИНЫ '+(G.fsn-SL.fs)+'/'+G.fsn+' · ИТОГО '+fmt(SL.fsTot);
  if(G.mech=='book')t+=' · СИМВОЛ '+ic(G.ico(F.E));
  if(G.mech=='tumble')t+=' · x'+F.tm;
  if(G.mech=='streak')t+=' · x'+Math.min(G.fsCap||10,1+(G.fsStep||1)*F.fsw)}
 else if(G.mech=='streak')t='СЕРИЯ ПОБЕД · x'+[1,2,3,5,8][Math.min(SL.ctx.streak,4)];
 e.innerHTML=t;e.style.display=t?'block':'none'}
function ovShow(t,v,pHTML,btn){
 $('#ovt').textContent=t;$('#ovv').textContent=v;$('#ovv').style.display=v?'block':'none';$('#ovp').innerHTML=pHTML;$('#ovb').textContent=btn;$('#sov').classList.add('on');
 return new Promise(res=>{$('#ovb').onclick=()=>{$('#sov').classList.remove('on');res()}})}
async function slotSpin(free){
 if(SL.busy)return;const G=SL.G,bet=BETS[SL.bi],ctx=free?SL.fctx:SL.ctx,T=SL.turbo;
 if(!free){
  if (S.bal < bet) { toast('Недостаточно средств', 'e'); return; }

}
 SL.busy=true;slotLock(true);hl([]);$('#swn').textContent='0';$('#smsg').textContent=free?'Фриспин':'Удачи!';
 const g0=spinGrid(G,!!free,free&&G.mech=='cat'?ctx.st:null);
 await slotAnim(g0,free,ctx);
 const r=resolve(G,g0,!!free,ctx);
 if(free&&G.mech=='cat')for(let c=0;c<5;c++)for(let q=0;q<3;q++)if(g0[c][q].s=='wild')ctx.st[c][q]=g0[c][q].m;
 if(JSON.stringify(g0)!=JSON.stringify(r.g1)){await slp(T?200:420);renderGrid(r.g1,'pop');await slp(T?250:520)}
 let win=0;const sc=bet/20*slotScale();
 for(let i=0;i<r.steps.length;i++){const st=r.steps[i];
  if(i>0){renderGrid(st.g,'drop');await slp(T?220:420)}
  const w=Math.floor(st.win*sc*100)/100;
  if(w>0){win+=w;hl(st.ev.wins);countUp(win);$('#smsg').textContent='Выигрыш'+(st.m>1?' · x'+st.m:'');if(r.steps.length>1)await slp(T?350:700)}}
 if(free)win=Math.min(win,Math.max(0,6750*bet-SL.fsTot));
  win=Math.round(win*100)/100; // Оставляем копейки, как ты и просил
 if(win>0){if(r.steps.length==1)hl(r.steps[0].ev.wins);countUp(win);if(win>=bet*15)bigWin(win,bet);$('#smsg').textContent=(win>=bet*20?'Большой выигрыш! ':'Выигрыш ')+'x'+(win/bet).toFixed(2)}
 else{hl([]);$('#smsg').textContent=free?'Без выигрыша':'Попробуйте ещё'}
 
 if(free){
   if(win>0){S.bal+=win;SL.fsTot+=win;render()}
 } else {
   // ОТПРАВЛЯЕМ ВЫИГРЫШ НА СЕРВЕР
   const res = await playGame('slot', bet, { win: win });
   if(res) { S.bal = res.balance; render(); }
 }
 
 const trig=!free&&scatCount(G,r.final)>=3;
 SL.busy=false;if(!free)slotLock(false);hud();
 if(trig){await slp(900);await runFree(bet)}
}
async function runFree(bet){const G=SL.G;
 await ovShow('Бонус!',String(G.fsn),'<p class="rl" style="text-align:center">'+G.fsText+'</p>','Начать');
 SL.fs=G.fsn;SL.fsTot=0;SL.fctx=newFS(G);
 if(G.mech=='book')await ovShow('Особый символ','','<div class="cell kk-'+SL.fctx.E+'" style="width:92px;margin:8px auto">'+symHTML({s:SL.fctx.E})+'</div><p class="rl" style="text-align:center">Выпав на барабане, он займёт его целиком.</p>','Играть');
 $('#slw').classList.add('fsm');hud();slotLock(true);
 while(SL.fs>0){SL.fs--;hud();await slotSpin(true);slotLock(true);await slp(SL.turbo?500:1100)}
 $('#slw').classList.remove('fsm');
const tot=Math.round(SL.fsTot*100)/100;
if(tot>0){
  S.wins++;
  S.best=Math.max(S.best,tot);
  // СИНХРОНИЗАЦИЯ ВЫИГРЫША БОНУСА С СЕРВЕРОМ
  const res = await playGame('slot', 0, { win: tot });
  if (res) { S.bal = res.balance; render(); }
}
 S.hist.unshift([G.name+' · бонус',tot]);S.hist=S.hist.slice(0,15);render();feed(G.name,$('#un').textContent||'Вы',bet,tot);
 slotLock(false);SL.fctx=null;hud();if(tot>=bet*15)bigWin(tot,bet);
 await ovShow('Итого',(tot>0?'+':'')+fmt(tot),'<p class="rl" style="text-align:center">'+(tot>0?'за бонусную игру':'бонус без выигрыша')+'</p>','Продолжить');
 $('#swn').textContent=fmt(tot);
}
function showPay(){const G=SL.G,sc=slotScale()/20;
 let t=G.order.map(k=>'<div class="pt"><div class="cell k-'+k+' kk-'+k+'">'+symHTML({s:k})+'</div><div><b>'+G.pay[k].map((v,i)=>(i+3)+'× '+(v*sc).toFixed(2)).join(' · ')+'</b><small>от ставки</small></div></div>').join('');
 t+='<p class="rl">20 линий, выигрыш считается слева направо от 1-го барабана. Вайлд заменяет все символы, кроме бонуса. '+G.rules+' Максимальный выигрыш за бонус — x6750 от ставки. RTP: '+S.cfg.slot+'%.</p>';
 ovShow('Выплаты','',t,'Закрыть')}
function openSlot(id){const G=SLOTS[id];SL.G=G;SL.ctx={streak:0,tm:1};SL.fctx=null;SL.fs=0;
 const w=$('#slw');w.className='slw th-'+id+(id=='cat'?'':' nt');
 $('#ssign').textContent=G.name.toUpperCase();
 $('#slobby').style.display='none';$('#sgame').style.display='block';
 for(let c=0;c<5;c++)for(let r=0;r<3;r++)setCell(c,r,mkS(drawSym(G,c,false)));
 $('#sov').classList.remove('on');hl([]);$('#swn').textContent='0';$('#smsg').textContent='Удачи!';hud()}
function buildLobby(){const L=$('#slobby');if(!L)return;L.innerHTML='<h3 class="sh">Выберите слот</h3>';const grid=document.createElement('div');grid.className='slg';
 Object.keys(SLOTS).forEach(id=>{const G=SLOTS[id],d=document.createElement('div');d.className='sc th-'+id;
  d.innerHTML='<div class="scp">'+'<svg class="ic"><use href="#i-'+G.ico(G.hero)+'"/></svg></div><b></b><small></small><em class="rtp"></em>';
  d.children[1].textContent=G.name;d.children[2].textContent=G.sub;d.children[3].textContent='RTP '+S.cfg.slot+'%';d.onclick=()=>openSlot(id);grid.appendChild(d)});
 L.appendChild(grid)}
const setBet=d=>{SL.bi=Math.min(BETS.length-1,Math.max(0,SL.bi+d));$('#sbt').textContent=fmt(BETS[SL.bi])};
$('#sm1').onclick=()=>setBet(-1);$('#sp1').onclick=()=>setBet(1);$('#sspin').onclick=()=>slotSpin(false);
$('#sturbo').onclick=()=>{SL.turbo=!SL.turbo;$('#sturbo').classList.toggle('sel',SL.turbo)};
$('#sinfo').onclick=showPay;
$('#sback').onclick=()=>{if(SL.busy)return;$('#sgame').style.display='none';$('#slobby').style.display='block'};
SL.G=SLOTS.cat;SL.ctx={streak:0,tm:1};buildLobby();setBet(0);

// Фейковая лента ставок (если нужно оставить)
const NM=['Alex','Max','Kira','Dima','Neo','Sasha','Vlad','Lena','Tim','Zoe','Ivan','Mila'];
function feed(g,p,b,w){const r=document.createElement('div'),pr=Math.round((w-b)*100)/100;if(!r)return;r.className='fr';r.innerHTML='<span></span><span></span><span></span><span></span><b></b>';const c=r.children;c[0].textContent=g;c[1].textContent=p;c[2].textContent=fmt(b);c[3].textContent='x'+(w/b).toFixed(2);c[4].textContent=(pr>0?'+':'')+fmt(pr);c[4].style.color=pr>0?'var(--ok)':'var(--bad)';const el=$('#feed');if(el){el.prepend(r);while(el.children.length>6)el.lastChild.remove()}}