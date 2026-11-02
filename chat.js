// chat.js — Velvet live chat (load AFTER app.js)
(function () {
  'use strict';
  if (typeof api !== 'function') {
    console.warn('[chat] api() not found — include chat.js AFTER app.js');
    return;
  }

  const POLL_MS = 3000;
  const ONLINE_MS = 30000;

  let lastId = 0, pollTimer = null, onlineTimer = null;
  let opened = false, unread = 0, sending = false;

  // ---------- CSS ----------
  function injectCSS() {
    if (document.getElementById('chatStyles')) return;
    const st = document.createElement('style');
    st.id = 'chatStyles';
    st.textContent = `
.chat-fab{position:fixed;right:16px;bottom:calc(104px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#8b3dff,#c04dff);color:#fff;display:grid;place-items:center;box-shadow:0 8px 24px rgba(139,61,255,.55),inset 0 1px 0 rgba(255,255,255,.35);z-index:9000;cursor:pointer;transition:transform .15s;border:0}
.chat-fab:active{transform:scale(.94)}
.chat-fab.hidden{display:none}
.chat-unread{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;border-radius:10px;background:#ff3d5d;color:#fff;font:800 11px/20px system-ui;text-align:center;padding:0 5px;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center}
.chat-panel{position:fixed;left:0;right:0;bottom:0;height:min(75vh,620px);max-width:480px;margin:0 auto;background:linear-gradient(180deg,#140a33,#0a0518);border-top-left-radius:24px;border-top-right-radius:24px;border:1px solid rgba(168,120,255,.35);border-bottom:0;transform:translateY(105%);transition:transform .28s cubic-bezier(.2,.8,.3,1);z-index:9500;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.6);overflow:hidden}
.chat-panel.on{transform:translateY(0)}
.chat-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(168,120,255,.2);background:rgba(10,5,26,.85);flex:none}
.chat-title{font:800 16px Manrope,system-ui,sans-serif;color:#fff;display:flex;align-items:center;gap:10px}
.chat-online{font-size:11px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.3);border-radius:10px;padding:3px 8px}
.chat-close{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font:900 22px/1 system-ui;display:grid;place-items:center;border:0}
.chat-list{flex:1;overflow-y:auto;padding:12px 12px 6px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:10px}
.chat-list::-webkit-scrollbar{width:6px}
.chat-list::-webkit-scrollbar-thumb{background:rgba(168,120,255,.3);border-radius:3px}
.chat-msg{display:flex;gap:10px;align-items:flex-start}
.chat-avatar{width:36px;height:36px;flex:none;border-radius:50%;display:grid;place-items:center;color:#fff;font:800 15px/1 system-ui;box-shadow:0 2px 8px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.3)}
.chat-body{flex:1;min-width:0}
.chat-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px}
.chat-name{font:800 12.5px Manrope,system-ui,sans-serif;color:#fff;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chat-rank{font:800 9.5px Manrope,system-ui,sans-serif;padding:2px 7px;border-radius:7px;border:1px solid currentColor;background:rgba(255,255,255,.04);letter-spacing:.03em;text-transform:uppercase}
.chat-role{font:800 9.5px Manrope,system-ui,sans-serif;padding:2px 7px;border-radius:7px;letter-spacing:.03em;text-transform:uppercase}
.chat-role-player{background:rgba(255,255,255,.08);color:#a79bc9}
.chat-role-blogger{background:linear-gradient(135deg,#ec4899,#8b3dff);color:#fff}
.chat-role-manager{background:linear-gradient(135deg,#ffd24a,#e09a12);color:#3a2500}
.chat-role-admin{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff}
.chat-time{font-size:10px;color:#6b6485;margin-left:auto;font-variant-numeric:tabular-nums}
.chat-text{font:500 13.5px/1.35 Manrope,system-ui,sans-serif;color:#e8e2ff;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap}
.chat-msg.me .chat-avatar{box-shadow:0 0 0 2px #c19bff,0 2px 8px rgba(0,0,0,.3)}
.chat-msg.me .chat-name{color:#c19bff}
.chat-input-row{flex:none;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(10,5,26,.95);border-top:1px solid rgba(168,120,255,.2)}
.chat-input-row input{flex:1;height:44px;background:rgba(255,255,255,.06);border:1px solid rgba(168,120,255,.3);border-radius:22px;padding:0 16px;color:#fff;font:500 14px Manrope,system-ui,sans-serif;outline:none}
.chat-input-row input:focus{border-color:#c19bff;box-shadow:0 0 0 3px rgba(193,155,255,.15)}
.chat-send{width:44px;height:44px;flex:none;border-radius:50%;background:linear-gradient(135deg,#8b3dff,#c04dff);color:#fff;display:grid;place-items:center;box-shadow:0 4px 14px rgba(139,61,255,.5);border:0}
.chat-send:active{transform:scale(.94)}
.chat-send:disabled{opacity:.5}
    `;
    document.head.appendChild(st);
  }

  function ensureUI() {
    if (document.getElementById('chatFab')) return;

    const fab = document.createElement('button');
    fab.id = 'chatFab';
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'Чат');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.6L3 21l1.7-5.7A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>
      </svg>
      <span id="chatUnread" class="chat-unread" style="display:none">0</span>`;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'chatPanel';
    panel.className = 'chat-panel';
    panel.innerHTML = `
      <div class="chat-head">
        <div class="chat-title">💬 Чат <span id="chatOnline" class="chat-online">—</span></div>
        <button id="chatClose" class="chat-close" aria-label="Закрыть">×</button>
      </div>
      <div id="chatList" class="chat-list"></div>
      <div class="chat-input-row">
        <input id="chatInput" type="text" placeholder="Написать сообщение..." maxlength="500" autocomplete="off">
        <button id="chatSend" class="chat-send" aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>`;
    document.body.appendChild(panel);

    fab.addEventListener('click', open);
    document.getElementById('chatClose').addEventListener('click', close);
    document.getElementById('chatSend').addEventListener('click', send);
    document.getElementById('chatInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  function open() {
    opened = true; unread = 0; updateUnreadBadge();
    document.getElementById('chatPanel').classList.add('on');
    document.getElementById('chatFab').classList.add('hidden');
    startPoll();
    updateOnlineCount();
    setTimeout(() => {
      try { document.getElementById('chatInput').focus(); } catch (e) {}
      scrollToBottom(false);
    }, 300);
  }

  function close() {
    opened = false;
    document.getElementById('chatPanel').classList.remove('on');
    document.getElementById('chatFab').classList.remove('hidden');
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (onlineTimer) { clearInterval(onlineTimer); onlineTimer = null; }
  }

  function startPoll() {
    if (pollTimer) return;
    fetchMessages(true);
    pollTimer = setInterval(() => fetchMessages(false), POLL_MS);
    onlineTimer = setInterval(updateOnlineCount, ONLINE_MS);
  }

  async function fetchMessages(reset) {
    if (reset) {
      lastId = 0;
      const list = document.getElementById('chatList');
      if (list) list.innerHTML = '';
    }
    const list = document.getElementById('chatList');
    const wasBottom = list ? isNearBottom(list) : true;

    let r;
    try { r = await api('/chat/messages', { after: lastId }); }
    catch (e) { return; }
    if (!r || !r.ok) return;

    if (r.items && r.items.length) {
      r.items.forEach(renderMessage);
      lastId = r.lastId || lastId;
      if (reset || wasBottom) scrollToBottom(!reset);
      if (!opened) { unread += r.items.length; updateUnreadBadge(); }
    }
  }

  async function send() {
    if (sending) return;
    const inp = document.getElementById('chatInput');
    const btn = document.getElementById('chatSend');
    const text = (inp.value || '').trim();
    if (!text) return;

    sending = true; if (btn) btn.disabled = true;
    inp.value = '';
    try {
      const r = await api('/chat/send', { text });
      if (r && r.ok) {
        fetchMessages(false);
      } else {
        const err = r && r.error;
        if (err === 'slow') toast('Не так быстро 🙃', 'e');
        else if (err !== 'empty') toast('Не удалось отправить', 'e');
        inp.value = text;
      }
    } catch (e) {
      inp.value = text;
      toast('Нет связи', 'e');
    } finally {
      sending = false; if (btn) btn.disabled = false;
      try { inp.focus(); } catch (e) {}
    }
  }

  async function updateOnlineCount() {
    const el = document.getElementById('chatOnline');
    if (!el) return;
    try {
      const r = await api('/chat/online', {});
      if (r && r.ok) el.textContent = '🟢 ' + r.count;
    } catch (e) {}
  }

  function renderMessage(m) {
    const list = document.getElementById('chatList');
    if (!list || document.getElementById('msg-' + m.id)) return;

    const myId = (typeof S !== 'undefined' && S.user && S.user.id) ? String(S.user.id) : '';
    const isMe = myId && String(m.uid) === myId;
    const roleLabel =
      m.role === 'admin' ? 'Админ' :
      m.role === 'blogger' ? 'Блогер' :
      m.role === 'manager' ? 'Менеджер' : 'Игрок';
    const roleClass = 'chat-role-' + (['admin','blogger','manager'].includes(m.role) ? m.role : 'player');
    const rankName  = (m.rank && m.rank.name) || 'Без звания';
    const rankColor = (m.rank && m.rank.color) || '#9b93cf';

    const el = document.createElement('div');
    el.id = 'msg-' + m.id;
    el.className = 'chat-msg' + (isMe ? ' me' : '');
    el.innerHTML = `
      <div class="chat-avatar" style="${avatarStyle(m.uid)}">${escapeHtml(initial(m.name))}</div>
      <div class="chat-body">
        <div class="chat-meta">
          <span class="chat-name">${escapeHtml(m.name || 'Игрок')}</span>
          <span class="chat-rank" style="color:${rankColor};border-color:${rankColor}66">${escapeHtml(rankName)}</span>
          <span class="chat-role ${roleClass}">${roleLabel}</span>
          <span class="chat-time">${fmtTime(m.ts)}</span>
        </div>
        <div class="chat-text">${escapeHtml(m.message)}</div>
      </div>`;
    list.appendChild(el);
  }

  function initial(name) { const s = String(name || '?').trim(); return s ? s.charAt(0).toUpperCase() : '?'; }
  function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function avatarStyle(uid) {
    const hue = hashCode(String(uid || '0')) % 360;
    return `background: linear-gradient(135deg, hsl(${hue},65%,48%), hsl(${(hue + 50) % 360},65%,58%))`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  function isNearBottom(el, t) { t = t || 80; return el.scrollHeight - el.scrollTop - el.clientHeight < t; }
  function scrollToBottom(smooth) {
    const list = document.getElementById('chatList');
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }
  function updateUnreadBadge() {
    const el = document.getElementById('chatUnread');
    if (!el) return;
    if (unread > 0) { el.textContent = unread > 99 ? '99+' : String(unread); el.style.display = 'flex'; }
    else el.style.display = 'none';
  }

  injectCSS();
  (function waitForUser() {
    if (typeof S !== 'undefined' && S.user && S.user.id) {
      ensureUI();
      fetchMessages(true);
      setInterval(() => { if (!opened) fetchMessages(false); }, 20000);
      return;
    }
    setTimeout(waitForUser, 400);
  })();
})();