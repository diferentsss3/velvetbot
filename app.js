const tg=window.Telegram&&Telegram.WebApp;if(tg){tg.ready();tg.expand()}
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const fmt=n=>(+n).toLocaleString('ru-RU',{maximumFractionDigits:2});
const API_URL='https://asset-palmer-locally-neighbors.trycloudflare.com'; 
const CFG0={rate:87,maxBet:10000};let S={bal:0,bets:0,role:'player',isAdmin:false,refCount:0,cfg:CFG0};

async function api(p,d={}){try{const r=await fetch(API_URL+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,initData:tg?.initData||''})});return await r.json()}catch(e){toast('Нет связи','e');return{ok:false}}}

async function syncMe(){const r=await api('/me');if(!r.ok)return;S.bal=r.user.balance;S.role=r.user.role;S.isAdmin=!!r.admin;S.refCount=r.user.ref_count||0;render();if(S.isAdmin||S.role!=='player'){document.getElementById('adm').style.display='block';document.getElementById('adm').onclick=()=>S.isAdmin?openAdmin():tab('b')}}
let tt;function toast(m,k){const e=$('#toast');if(!e)return;e.textContent=m;e.className='on '+(k||'');clearTimeout(tt);tt=setTimeout(()=>e.className='',2200)}
function render(){$('#bal').textContent=fmt(S.bal);$('#pbal').textContent=fmt(S.bal);$('#urole').textContent=S.role;$('#refc').textContent=S.refCount;const U=tg?.initDataUnsafe?.user||{first_name:'Гость',id:0};$('#un').textContent=U.first_name;$('#rl').value='https://t.me/BOT?startapp=ref_'+U.id}
function tab(t){$$('.tab').forEach(e=>e.classList.toggle('on',e.id=='t-'+t));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==('mwcfl'.includes(t)?'h':t)))}
$$('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.t));$$('.mc').forEach(c=>c.onclick=()=>tab(c.dataset.t));
$('#bw').onclick=async()=>{const r=await api('/bonus/start');if(r.ok){toast('+100','w');syncMe()}else toast('Получен','e')};
$('#bd').onclick=async()=>{const r=await api('/bonus/daily');if(r.ok){toast('+'+r.amount,'w');syncMe()}else toast('Завтра','e')};
$('#pcb').onclick=async()=>{const r=await api('/promo/activate',{code:$('#pc').value});if(r.ok){toast('+'+r.bonus,'w');syncMe()}else toast('Ошибка','e')};
async function openAdmin(){tab('a');const r=await api('/admin/stats');if(r.ok){$('#aDep').textContent=fmt(r.deposit);$('#aBank').textContent=fmt(r.bank)};const u=await api('/admin/users');if(u.ok){$('#ul').innerHTML=u.users.map(x=>`<div style="padding:5px;border-bottom:1px solid #333">${x.name}<br><button onclick="setRole('${x.id}','blogger')">Блогер</button><button onclick="setRole('${x.id}','manager')">Менеджер</button></div>`).join('')}}
window.setRole=async(t,r)=>{await api('/admin/set-role',{target:t,role:r});openAdmin()};
window.createPromo=async()=>{await api('/admin/create-promo',{code:$('#pcode').value,bonus:+$('#pbonus').value,uses:+$('#puses').value});toast('Создан')};
(async()=>{await syncMe()})();