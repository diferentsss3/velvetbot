// slots.js

/* ===== SVG-символы слотов (gold, pha, neon, dra, cos, pot) =====
   Добавляются в страницу только если символа с таким id ещё нет — ваши рисунки не затираются. */
(function(){
 const sh='<ellipse cx="50" cy="95" rx="30" ry="4" fill="#000" opacity=".25"/>';
 const DEFS=
  '<linearGradient id="saPr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c8ff"/><stop offset="1" stop-color="#6a22d9"/></linearGradient>'+
  '<linearGradient id="saPk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb0dc"/><stop offset="1" stop-color="#c01e7a"/></linearGradient>'+
  '<linearGradient id="saGn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dffc4"/><stop offset="1" stop-color="#12924f"/></linearGradient>'+
  '<linearGradient id="saBl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b4dcff"/><stop offset="1" stop-color="#2b5fd9"/></linearGradient>'+
  '<linearGradient id="saCy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8f8ff"/><stop offset="1" stop-color="#0a9bc4"/></linearGradient>'+
  '<linearGradient id="saRd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a6a"/><stop offset="1" stop-color="#9a1220"/></linearGradient>'+
  '<radialGradient id="saPearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#bfe6ff"/><stop offset="1" stop-color="#6a8fe0"/></radialGradient>';

 const ART={
 gold:{
  scat:'<path d="M14 66L26 38L48 28L72 36L88 60L76 84L40 88Z" fill="url(#gG)" stroke="#a8680a" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 38L48 52L14 66M48 28V52L72 36M48 52L88 60M48 52L40 88" stroke="#fff6c4" stroke-opacity=".6" stroke-width="2" fill="none"/><ellipse cx="38" cy="42" rx="10" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 38 42)"/>',
  wild:'<g transform="rotate(-8 50 60)"><rect x="22" y="32" width="18" height="54" rx="5" fill="url(#gR)" stroke="#7a0e22" stroke-width="2"/><rect x="41" y="28" width="18" height="58" rx="5" fill="url(#gR)" stroke="#7a0e22" stroke-width="2"/><rect x="60" y="32" width="18" height="54" rx="5" fill="url(#gR)" stroke="#7a0e22" stroke-width="2"/></g><rect x="16" y="54" width="68" height="12" rx="3" fill="#f3e2b0" stroke="#8a6a2a" stroke-width="2"/><path d="M50 28Q54 12 70 12" stroke="#e0b87a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="72" cy="12" r="6" fill="url(#gF)"/>',
  h1:'<path d="M26 90L66 34" stroke="url(#gW)" stroke-width="9" stroke-linecap="round"/><path d="M14 42Q50 4 90 30Q62 26 56 46Q40 30 14 42Z" fill="url(#gK)" stroke="#1d1f2b" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 40Q50 18 78 28" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" fill="none"/>',
  h2:'<rect x="36" y="10" width="28" height="8" rx="3" fill="#3a3a58"/><path d="M50 10V4" stroke="#7a7a99" stroke-width="3"/><path d="M32 20H68L74 78H26Z" fill="url(#gF)" stroke="#8a4b10" stroke-width="3" stroke-linejoin="round"/><path d="M40 30H60L64 68H36Z" fill="#fff3b0" opacity=".8"/><path d="M50 20V78" stroke="#8a4b10" stroke-width="2"/><rect x="24" y="78" width="52" height="10" rx="3" fill="#3a3a58"/>',
  h3:'<path d="M10 86L22 54H78L90 86Z" fill="url(#gG)" stroke="#a8680a" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 54L34 30H66L76 54Z" fill="#ffe27a" stroke="#a8680a" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 36H60" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><path d="M20 62H46" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>',
  m1:'<path d="M26 86V50A24 24 0 0 1 74 50V86" stroke="url(#gK)" stroke-width="15" fill="none"/><path d="M26 86V50A24 24 0 0 1 74 50V86" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" transform="translate(-3 0)"/><circle cx="26" cy="62" r="2.6" fill="#1d1f2b"/><circle cx="26" cy="76" r="2.6" fill="#1d1f2b"/><circle cx="74" cy="62" r="2.6" fill="#1d1f2b"/><circle cx="74" cy="76" r="2.6" fill="#1d1f2b"/>',
  m2:'<path d="M24 30Q36 8 50 18Q64 6 76 30Z" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><path d="M14 30H86L78 68H22Z" fill="url(#gW)" stroke="#5a3210" stroke-width="3" stroke-linejoin="round"/><path d="M20 44H80" stroke="#5a3210" stroke-opacity=".5" stroke-width="2"/><circle cx="32" cy="78" r="9" fill="url(#gK)" stroke="#1d1f2b" stroke-width="2"/><circle cx="68" cy="78" r="9" fill="url(#gK)" stroke="#1d1f2b" stroke-width="2"/>'
 },
 pha:{
  wild:'<path d="M22 38L12 92H32L36 42Z" fill="#2b6fd9"/><path d="M78 38L88 92H68L64 42Z" fill="#2b6fd9"/><path d="M50 6C74 8 84 26 80 50L84 92H16L20 50C16 26 26 8 50 6Z" fill="url(#gG)" stroke="#a8680a" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 20L24 56M70 20L76 56" stroke="#2b6fd9" stroke-width="5" opacity=".9"/><ellipse cx="50" cy="52" rx="19" ry="24" fill="#ffe3a0" stroke="#a8680a" stroke-width="2.5"/><path d="M36 46H47M53 46H64" stroke="#14102e" stroke-width="4" stroke-linecap="round"/><path d="M45 62Q50 66 55 62" stroke="#a8680a" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="45" y="74" width="10" height="16" rx="3" fill="#2b6fd9" stroke="#14102e" stroke-width="1.5"/>',
  scat:'<rect x="16" y="12" width="68" height="78" rx="7" fill="#7a2a1a" stroke="#ffd24a" stroke-width="3.5"/><rect x="25" y="21" width="50" height="60" rx="4" fill="#2a0f0a"/><circle cx="50" cy="50" r="17" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="#2a0f0a"/><path d="M33 50Q50 36 67 50" stroke="#14102e" stroke-width="3" fill="none"/>',
  h1:'<path d="M26 44L8 34M24 62L6 66M28 80L12 92M74 44L92 34M76 62L94 66M72 80L88 92" stroke="#a8680a" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="50" cy="58" rx="26" ry="31" fill="url(#saCy)" stroke="#0a5a70" stroke-width="3"/><path d="M50 28V88M25 52Q50 62 75 52" stroke="#0a5a70" stroke-width="3" fill="none"/><circle cx="50" cy="26" r="11" fill="url(#gG)" stroke="#a8680a" stroke-width="2.5"/><circle cx="50" cy="10" r="7" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><ellipse cx="40" cy="48" rx="7" ry="11" fill="#fff" opacity=".3"/>',
  h2:'<path d="M6 50Q50 12 94 50Q50 88 6 50Z" fill="#fff" stroke="#a8680a" stroke-width="3.5"/><circle cx="50" cy="50" r="17" fill="url(#saBl)"/><circle cx="50" cy="50" r="7.5" fill="#14102e"/><path d="M6 50Q50 12 94 50" stroke="#14102e" stroke-width="5" fill="none"/><path d="M52 68Q62 86 44 92" stroke="#14102e" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M86 54L98 68" stroke="#14102e" stroke-width="5" stroke-linecap="round"/>',
  h3:'<ellipse cx="50" cy="30" rx="17" ry="21" fill="none" stroke="#a8680a" stroke-width="14"/><ellipse cx="50" cy="30" rx="17" ry="21" fill="none" stroke="url(#gG)" stroke-width="9"/><rect x="43" y="46" width="14" height="46" rx="4" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><rect x="22" y="58" width="56" height="13" rx="4" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/>',
  m1:'<path d="M50 10L94 88H6Z" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><path d="M50 10L94 88H50Z" fill="#000" opacity=".2"/><path d="M28 56H72M18 72H82" stroke="#a8680a" stroke-opacity=".6" stroke-width="2"/><circle cx="80" cy="20" r="9" fill="url(#gF)"/>',
  m2:'<path d="M34 12H66L62 28Q84 40 80 66Q74 92 50 92Q26 92 20 66Q16 40 38 28Z" fill="url(#gX)" stroke="#8a3a05" stroke-width="3" stroke-linejoin="round"/><path d="M24 54H76M30 68H70" stroke="#ffe08a" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="46" rx="5" ry="12" fill="#fff" opacity=".3"/>'
 },
 neon:{
  wild:'<polygon points="50,6 62,36 94,38 68,58 78,90 50,72 22,90 32,58 6,38 38,36" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><polygon points="50,24 56,40 72,42 59,52 63,68 50,60 37,68 41,52 28,42 44,40" fill="#fff" opacity=".45"/>',
  scat:'<path d="M50 10Q30 12 30 44V62L16 78H84L70 62V44Q70 12 50 10Z" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="86" r="8" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><circle cx="50" cy="8" r="5" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/><ellipse cx="42" cy="38" rx="6" ry="14" fill="#fff" opacity=".4"/>',
  h1:'<path d="M32 64Q38 30 66 14M70 62Q72 34 66 14" stroke="#3aa24a" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M66 14Q84 12 88 28Q70 30 66 14Z" fill="#4ade80" stroke="#1f7a33" stroke-width="2"/><circle cx="32" cy="72" r="21" fill="url(#gR)" stroke="#7a0e22" stroke-width="2.5"/><circle cx="71" cy="70" r="21" fill="url(#gR)" stroke="#7a0e22" stroke-width="2.5"/><ellipse cx="24" cy="64" rx="6" ry="4" fill="#fff" opacity=".6"/><ellipse cx="63" cy="62" rx="6" ry="4" fill="#fff" opacity=".6"/>',
  h2:'<path d="M50 20V8M50 8Q62 4 70 12" stroke="#3aa24a" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="url(#saPr)" stroke="#4a14a8" stroke-width="2"><circle cx="30" cy="34" r="12"/><circle cx="52" cy="32" r="12"/><circle cx="72" cy="36" r="12"/><circle cx="40" cy="54" r="12"/><circle cx="62" cy="54" r="12"/><circle cx="30" cy="48" r="12" opacity="0"/><circle cx="50" cy="74" r="12"/></g><ellipse cx="26" cy="30" rx="4" ry="3" fill="#fff" opacity=".6"/><ellipse cx="48" cy="28" rx="4" ry="3" fill="#fff" opacity=".6"/>',
  h3:'<text x="50" y="82" font-size="88" font-weight="900" text-anchor="middle" fill="url(#gR)" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" font-family="Unbounded,Arial Black,sans-serif">7</text>',
  m1:'<path d="M8 52Q10 26 50 22Q90 26 92 52Q88 80 50 82Q12 80 8 52Z" fill="#ffe14a" stroke="#c29a00" stroke-width="3"/><path d="M6 52L16 48M94 52L84 48" stroke="#c29a00" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="40" rx="14" ry="6" fill="#fff" opacity=".55"/>',
  m2:'<path d="M8 46A42 42 0 0 0 92 46Z" fill="#2fb44a" stroke="#1a7a2c" stroke-width="3" stroke-linejoin="round"/><path d="M15 46A35 35 0 0 0 85 46Z" fill="url(#saRd)"/><g fill="#14102e"><ellipse cx="34" cy="58" rx="2.4" ry="4"/><ellipse cx="50" cy="66" rx="2.4" ry="4"/><ellipse cx="66" cy="58" rx="2.4" ry="4"/><ellipse cx="42" cy="52" rx="2" ry="3.4"/><ellipse cx="58" cy="52" rx="2" ry="3.4"/></g>'
 },
 dra:{
  wild:'<circle cx="50" cy="50" r="42" fill="none" stroke="url(#gG)" stroke-width="6"/><circle cx="50" cy="50" r="34" fill="url(#saPearl)" stroke="#6a8fe0" stroke-width="2"/><ellipse cx="38" cy="36" rx="12" ry="7" fill="#fff" opacity=".8" transform="rotate(-30 38 36)"/>',
  scat:'<path d="M8 54Q10 30 34 34Q50 42 66 34Q90 30 92 54Q86 78 50 78Q14 78 8 54Z" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><path d="M32 34Q50 20 68 34Q50 46 32 34Z" fill="#ffe27a" stroke="#a8680a" stroke-width="2.5"/><ellipse cx="30" cy="54" rx="8" ry="4" fill="#fff" opacity=".4"/>',
  h1:'<path d="M20 20Q32 30 36 42M80 20Q68 30 64 42" stroke="#ffd24a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M50 26C78 26 90 46 84 66C80 82 64 92 50 92C36 92 20 82 16 66C10 46 22 26 50 26Z" fill="url(#saRd)" stroke="#5a0a18" stroke-width="3"/><ellipse cx="50" cy="72" rx="23" ry="15" fill="#d0343c" stroke="#5a0a18" stroke-width="2"/><ellipse cx="42" cy="72" rx="3" ry="4" fill="#5a0a18"/><ellipse cx="58" cy="72" rx="3" ry="4" fill="#5a0a18"/><path d="M34 46L44 52M66 46L56 52" stroke="#ffd24a" stroke-width="5" stroke-linecap="round"/><ellipse cx="36" cy="54" rx="6" ry="5" fill="#ffd24a"/><ellipse cx="64" cy="54" rx="6" ry="5" fill="#ffd24a"/><ellipse cx="36" cy="54" rx="1.8" ry="4.5" fill="#14050b"/><ellipse cx="64" cy="54" rx="1.8" ry="4.5" fill="#14050b"/><path d="M26 76Q10 78 6 90M74 76Q90 78 94 90" stroke="#ffd24a" stroke-width="3" fill="none" stroke-linecap="round"/>',
  h2:'<rect x="38" y="6" width="24" height="9" rx="3" fill="#ffd24a" stroke="#a8680a" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="31" ry="34" fill="url(#gR)" stroke="#7a0e22" stroke-width="3"/><path d="M50 16V84M36 20Q22 50 36 80M64 20Q78 50 64 80" stroke="#7a0e22" stroke-width="2" fill="none" opacity=".6"/><rect x="36" y="82" width="28" height="9" rx="3" fill="#ffd24a" stroke="#a8680a" stroke-width="1.5"/><path d="M50 91V98" stroke="#ffd24a" stroke-width="3" stroke-linecap="round"/><ellipse cx="38" cy="38" rx="5" ry="10" fill="#fff" opacity=".3"/>',
  h3:'<circle cx="50" cy="50" r="34" fill="none" stroke="#0f6b3f" stroke-width="18"/><circle cx="50" cy="50" r="34" fill="none" stroke="url(#saGn)" stroke-width="13"/><path d="M26 36A28 28 0 0 1 52 22" stroke="#fff" stroke-opacity=".6" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="50" cy="12" r="6" fill="url(#gG)" stroke="#a8680a" stroke-width="2"/>',
  m1:'<path d="M50 88L10 38Q50 6 90 38Z" fill="url(#gR)" stroke="#7a0e22" stroke-width="3" stroke-linejoin="round"/><path d="M50 88L26 28M50 88L38 22M50 88L50 20M50 88L62 22M50 88L74 28" stroke="#ffd24a" stroke-width="2.4" opacity=".85"/><circle cx="50" cy="88" r="5" fill="url(#gG)" stroke="#a8680a" stroke-width="1.5"/>',
  m2:'<circle cx="50" cy="50" r="41" fill="url(#gG)" stroke="#a8680a" stroke-width="3"/><circle cx="50" cy="50" r="33" fill="none" stroke="#a8680a" stroke-opacity=".5" stroke-width="2"/><rect x="38" y="38" width="24" height="24" fill="#14050b" stroke="#a8680a" stroke-width="3"/><ellipse cx="34" cy="26" rx="12" ry="5" fill="#fff" opacity=".45" transform="rotate(-30 34 26)"/>'
 },
 cos:{
  wild:'<polygon points="50,2 58,38 98,50 58,62 50,98 42,62 2,50 42,38" fill="url(#saCy)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="#fff"/><circle cx="50" cy="50" r="8" fill="url(#saPr)"/>',
  scat:'<path d="M6 92Q36 64 58 46" stroke="url(#gF)" stroke-width="18" stroke-linecap="round" opacity=".75"/><path d="M14 88Q40 66 60 48" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/><circle cx="68" cy="36" r="24" fill="url(#gF)" stroke="#c75a08" stroke-width="3"/><circle cx="60" cy="30" r="8" fill="#fff" opacity=".6"/>',
  h1:'<g transform="rotate(-22 50 52)"><ellipse cx="50" cy="52" rx="46" ry="13" fill="none" stroke="#c9a13a" stroke-width="6"/></g><circle cx="50" cy="50" r="27" fill="url(#saPr)" stroke="#4a14a8" stroke-width="2.5"/><path d="M26 42Q50 34 74 44M24 58Q50 52 76 60" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none"/><g transform="rotate(-22 50 52)"><path d="M4 52A46 13 0 0 0 96 52" fill="none" stroke="url(#gG)" stroke-width="6"/></g><ellipse cx="40" cy="38" rx="8" ry="5" fill="#fff" opacity=".4"/>',
  h2:'<ellipse cx="50" cy="60" rx="44" ry="15" fill="url(#gK)" stroke="#1d1f2b" stroke-width="2.5"/><path d="M26 56Q50 8 74 56Z" fill="url(#saCy)" opacity=".9" stroke="#0a5a70" stroke-width="2.5"/><circle cx="24" cy="64" r="3.4" fill="#ffd24a"/><circle cx="42" cy="68" r="3.4" fill="#ffd24a"/><circle cx="58" cy="68" r="3.4" fill="#ffd24a"/><circle cx="76" cy="64" r="3.4" fill="#ffd24a"/><path d="M34 84L26 94M66 84L74 94M50 86V96" stroke="#7a7a99" stroke-width="3" stroke-linecap="round"/>',
  h3:'<circle cx="50" cy="50" r="40" fill="#e8ecff" stroke="#8a90c0" stroke-width="3.5"/><rect x="20" y="32" width="60" height="38" rx="18" fill="url(#saBl)" stroke="#2a3a90" stroke-width="3"/><path d="M30 42Q40 36 52 38" stroke="#fff" stroke-opacity=".8" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="40" y="76" width="20" height="8" rx="3" fill="#ffd24a" stroke="#a8680a" stroke-width="1.5"/>',
  m1:'<path d="M60 8A42 42 0 1 0 92 64A34 34 0 0 1 60 8Z" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="50" r="4" fill="#a8680a" opacity=".4"/><circle cx="40" cy="72" r="3" fill="#a8680a" opacity=".4"/>',
  m2:'<path d="M50 6L76 40L64 92H36L24 40Z" fill="url(#saPk)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 40H76M50 6L40 40L36 92M50 6L60 40L64 92" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>'
 },
 pot:{
  wild:'<circle cx="50" cy="46" r="35" fill="url(#saPr)" stroke="#4a14a8" stroke-width="3"/><path d="M30 38Q50 24 70 38" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="38" cy="32" rx="9" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 38 32)"/><path d="M24 84Q50 98 76 84L68 76H32Z" fill="url(#gG)" stroke="#a8680a" stroke-width="2.5" stroke-linejoin="round"/>',
  scat:'<path d="M62 8A42 42 0 1 0 92 62A34 34 0 0 1 62 8Z" fill="url(#gG)" stroke="#a8680a" stroke-width="3" stroke-linejoin="round"/><polygon points="76,18 79,26 87,26 81,31 83,39 76,34 69,39 71,31 65,26 73,26" fill="#fff6c4"/>',
  myst:'<rect x="20" y="8" width="60" height="84" rx="9" fill="#2a0f55" stroke="url(#gG)" stroke-width="4"/><rect x="28" y="16" width="44" height="68" rx="5" fill="#14062e"/><text x="50" y="68" font-size="54" font-weight="900" text-anchor="middle" fill="url(#gG)" font-family="Unbounded,Arial Black,sans-serif">?</text>',
  h1:'<rect x="40" y="3" width="20" height="11" rx="3" fill="#8a5222" stroke="#5a3210" stroke-width="2"/><path d="M42 14H58V36L82 76Q90 94 70 94H30Q10 94 18 76L42 36Z" fill="url(#saPk)" stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".95"/><path d="M26 72H74" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><circle cx="42" cy="78" r="4" fill="#fff" opacity=".6"/><circle cx="58" cy="70" r="3" fill="#fff" opacity=".6"/><circle cx="52" cy="84" r="2.6" fill="#fff" opacity=".6"/>',
  h2:'<path d="M12 36H88V60Q88 92 50 92Q12 92 12 60Z" fill="#26263f" stroke="#7a7a99" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="50" cy="36" rx="38" ry="10" fill="url(#saGn)" stroke="#12924f" stroke-width="2"/><circle cx="36" cy="30" r="5" fill="#9dffc4"/><circle cx="58" cy="26" r="6" fill="#9dffc4"/><circle cx="70" cy="34" r="3.4" fill="#9dffc4"/><path d="M24 90L18 98M76 90L82 98" stroke="#7a7a99" stroke-width="5" stroke-linecap="round"/><path d="M26 54Q32 74 40 82" stroke="#fff" stroke-opacity=".25" stroke-width="4" fill="none" stroke-linecap="round"/>',
  h3:'<path d="M50 4L70 64H30Z" fill="url(#saPr)" stroke="#4a14a8" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="68" rx="44" ry="11" fill="#3a1466" stroke="#4a14a8" stroke-width="3"/><path d="M33 56H67" stroke="url(#gG)" stroke-width="7"/><rect x="45" y="51" width="10" height="10" rx="2" fill="#ffd24a" stroke="#a8680a" stroke-width="1.5"/>',
  m1:'<path d="M10 54Q10 14 50 14Q90 14 90 54Z" fill="url(#gR)" stroke="#7a0e22" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="38" r="6" fill="#fff"/><circle cx="52" cy="28" r="5" fill="#fff"/><circle cx="70" cy="42" r="6" fill="#fff"/><path d="M38 54H62V86Q50 92 38 86Z" fill="#f6ecde" stroke="#cbb79b" stroke-width="2.5" stroke-linejoin="round"/>',
  m2:'<rect x="14" y="14" width="72" height="74" rx="7" fill="url(#saGn)" stroke="#0f6b3f" stroke-width="3.5"/><rect x="14" y="14" width="12" height="74" rx="4" fill="#0f6b3f" opacity=".5"/><polygon points="56,32 61,46 76,46 64,55 68,70 56,61 44,70 48,55 36,46 51,46" fill="url(#gG)" stroke="#a8680a" stroke-width="2" stroke-linejoin="round"/>'
 }};

 function boot(){
  let host=document.querySelector('body>svg[aria-hidden="true"]');
  if(!host){
   host=document.createElementNS('http://www.w3.org/2000/svg','svg');
   host.setAttribute('width','0');host.setAttribute('height','0');host.setAttribute('aria-hidden','true');
   host.style.position='absolute';
   document.body.insertBefore(host,document.body.firstChild)}
  if(!document.getElementById('saPr'))host.insertAdjacentHTML('beforeend','<defs>'+DEFS+'</defs>');
  let out='';
  for(const t in ART)for(const k in ART[t]){
   const id='i-'+t+'-'+k;
   if(document.getElementById(id))continue;
   out+='<symbol id="'+id+'" viewBox="0 0 100 100">'+sh+ART[t][k]+'</symbol>'}
  if(out)host.insertAdjacentHTML('beforeend',out)}
 if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);
})();


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
const WT={l1:22,l2:22,l3:20,l4:16,l5:12,m1:7,m2:6,h1:4.5,h2:3,h3:2,wild:6,scat:6};
const K=['l1','l2','l3','l4','l5','m1','m2','h1','h2','h3','wild','scat'];

const SLOTS={
 cat:{keys:['9','10','J','Q','K','A','collar','fish','c1','c2','c3','c4','wild','scat'],mech:'cat',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:7,noScatFS:true,wsum:true,
  wm:fs=>fs?(Math.random()<.6?2:3):1,
  wt:{'9':24,'10':24,J:20,Q:16,K:11,A:9,collar:6,fish:5,c1:3.5,c2:2.5,c3:2,c4:1.5,wild:6,scat:6},
  wtf:{wild:4},
  pay:{'9':[6.3,16.8,63],'10':[6.3,16.8,63],J:[8.4,21,84],Q:[8.4,21,84],K:[12.6,33.6,126],A:[12.6,33.6,126],collar:[16.8,52.5,210],fish:[21,63,252],c1:[25.2,84,315],c2:[33.6,105,420],c3:[42,147,630],c4:[63,210,1050]}},
 gold:{keys:K,mech:'expand',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,wsum:true,wm:fs=>fs?2:1,wt:{...WT,wild:5},wtf:{wild:6},pay:PT},
 pha:{keys:K,mech:'book',wildR:[1,2,3],scatR:[0,1,2,3,4],byReel:false,fsn:10,noScatFS:true,fsMult:3,wt:{...WT,wild:6,scat:4},ew:{h1:3,h2:3,h3:2,m1:2,m2:2},pay:PT},
 neon:{keys:K,mech:'streak',wildR:[1,2,3],scatR:[0,1,2,3,4],byReel:false,fsn:8,noScatFS:true,fsStep:2,fsCap:15,wt:{...WT,wild:5,scat:4},pay:PT},
 dra:{keys:K,mech:'dragon',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,breath:.12,fsMult:1,wt:{...WT,wild:4},pay:PT},
 cos:{keys:K,mech:'tumble',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,wt:{...WT,wild:5},pay:PT},
 pot:{keys:[...K,'myst'],mech:'mystery',wildR:[1,2,3],scatR:[0,2,4],byReel:true,fsn:8,noScatFS:true,fsMult:3,wt:{...WT,wild:5,myst:4},wtf:{myst:6},mw:{l3:8,l4:8,l5:8,m1:8,m2:8,h1:6,h2:5,h3:4,wild:3},pay:PT}
};

const CAL={"gold":{"pay":{"l1":[4.76,12.68,47.55],"l2":[4.76,12.68,47.55],"l3":[6.34,15.85,63.4],"l4":[9.51,25.36,95.11],"l5":[9.51,25.36,95.11],"m1":[12.68,39.63,158.51],"m2":[15.85,47.55,190.21],"h1":[25.36,79.26,317.02],"h2":[38.04,126.81,475.53],"h3":[63.4,190.21,951.07]},"base":0.9766},"pha":{"pay":{"l1":[9.45,25.19,94.45],"l2":[9.45,25.19,94.45],"l3":[12.59,31.48,125.94],"l4":[18.89,50.37,188.9],"l5":[18.89,50.37,188.9],"m1":[25.19,78.71,314.84],"m2":[31.48,94.45,377.81],"h1":[50.37,157.42,629.68],"h2":[75.56,251.87,944.51],"h3":[125.94,377.81,1889.03]},"base":0.9732},"neon":{"pay":{"l1":[5.83,15.54,58.28],"l2":[5.83,15.54,58.28],"l3":[7.77,19.43,77.7],"l4":[11.66,31.08,116.55],"l5":[11.66,31.08,116.55],"m1":[15.54,48.56,194.26],"m2":[19.43,58.28,233.11],"h1":[31.08,97.13,388.51],"h2":[46.62,155.4,582.77],"h3":[77.7,233.11,1165.53]},"base":0.9675},"dra":{"pay":{"l1":[4.62,12.33,46.25],"l2":[4.62,12.33,46.25],"l3":[6.17,15.42,61.66],"l4":[9.25,24.66,92.49],"l5":[9.25,24.66,92.49],"m1":[12.33,38.54,154.15],"m2":[15.42,46.25,184.98],"h1":[24.66,77.08,308.3],"h2":[37,123.32,462.45],"h3":[61.66,184.98,924.91]},"base":0.9673},"cos":{"pay":{"l1":[6.57,17.52,65.68],"l2":[6.57,17.52,65.68],"l3":[8.76,21.89,87.58],"l4":[13.14,35.03,131.36],"l5":[13.14,35.03,131.36],"m1":[17.52,54.73,218.94],"m2":[21.89,65.68,262.73],"h1":[35.03,109.47,437.88],"h2":[52.55,175.15,656.81],"h3":[87.58,262.73,1313.63]},"base":0.9659},"pot":{"pay":{"l1":[12.31,32.84,123.14],"l2":[12.31,32.84,123.14],"l3":[16.42,41.05,164.19],"l4":[24.63,65.68,246.28],"l5":[24.63,65.68,246.28],"m1":[32.84,102.62,410.47],"m2":[41.05,123.14,492.56],"h1":[65.68,205.24,820.94],"h2":[98.51,328.38,1231.41],"h3":[164.19,492.56,2462.82]},"base":0.9738}};

const LT5={l1:'10',l2:'J',l3:'Q',l4:'K',l5:'A'},ORD=['h3','h2','h1','m2','m1','l5','l4','l3','l2','l1'];
const META={
 cat:{name:'Cat House',sub:'Липкие вайлды x2 и x3',wl:'WILD',sl:'BONUS',lt:{'9':'9','10':'10',J:'J',Q:'Q',K:'K',A:'A'},ico:k=>k=='wild'?'yarn':k=='scat'?'paw':k,order:['c4','c3','c2','c1','fish','collar','A','K','Q','J','10','9'],hero:'c2',
  fsText:'фриспинов. Вайлды-клубки липкие и получают множитель x2 или x3.',rules:'Вайлд-клубок выпадает на барабанах 2–4. Три бонус-символа на барабанах 1, 3 и 5 дают 7 фриспинов.',base:0.965},
 gold:{name:'Gold Rush',sub:'Взрывные вайлды',wl:'TNT',sl:'GOLD',fsText:'фриспинов. Динамит расширяется на весь барабан и даёт x2.',rules:'Три самородка на барабанах 1, 3 и 5 дают 8 фриспинов.'},
 pha:{name:'Pharaoh Gold',sub:'Расширяющийся символ',wl:'MASK',sl:'BOOK',fsText:'фриспинов. Перед началом выбирается особый символ.',rules:'Три книги где угодно дают 10 фриспинов.'},
 neon:{name:'Neon Fruits',sub:'Серия побед',wl:'WILD',sl:'BONUS',fsText:'фриспинов. Множитель растёт с каждым выигрышем.',rules:'Выигрыши подряд повышают множитель.',fsStep:2},
 dra:{name:'Dragon Pearl',sub:'Создание вайлдов',wl:'PEARL',sl:'INGOT',fsText:'фриспинов. Дракон выдыхает пламя.',rules:'Три слитка на барабанах 1, 3 и 5 дают 8 фриспинов.'},
 cos:{name:'Cosmic Drift',sub:'Каскады',wl:'NOVA',sl:'COMET',fsText:'фриспинов. Множитель не сбрасывается.',rules:'Три кометы на барабанах 1, 3 и 5 дают 8 фриспинов.'},
 pot:{name:'Magic Potion',sub:'Загадочные карты',wl:'ORB',sl:'MOON',fsText:'фриспинов. Карт больше.',rules:'Три луны на барабанах 1, 3 и 5 дают 8 фриспинов.'}
};
for(const id in SLOTS){const G=SLOTS[id],M=META[id];Object.assign(G,M);G.id=id;
 if(CAL[id]){G.pay=CAL[id].pay;G.base=CAL[id].base}
 if(id!='cat'){G.lt=LT5;G.order=ORD;G.hero='h1';G.ico=k=>id+'-'+k}}

const BETS=[1,2,5,10,20,50,100,200,500,1000];
const SL={fs:0,fsTot:0,ctx:null,fctx:null,busy:false,bi:3,turbo:false,G:null},slp=ms=>new Promise(r=>setTimeout(r,ms));
const cellEl=[],slotScale=()=>{
  const rtp = Number(S.cfg && S.cfg.slot) || 85;
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
 if(SL.busy)return;
 SL.busy = true;
 slotLock(true);

 const G=SL.G,bet=BETS[SL.bi],ctx=free?SL.fctx:SL.ctx,T=SL.turbo;

 if(!free){
  if (S.bal < bet) {
    toast('Недостаточно средств', 'e');
    SL.busy = false;
    slotLock(false);
    return;
  }
  S.bal = Math.round((S.bal - bet) * 100) / 100;
  render();
 }

 hl([]);$('#swn').textContent='0';$('#smsg').textContent=free?'Фриспин':'Удачи!';
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
 win=Math.round(win*100)/100;

 if(win>0){if(r.steps.length==1)hl(r.steps[0].ev.wins);countUp(win);if(win>=bet*15)bigWin(win,bet);$('#smsg').textContent=(win>=bet*20?'Большой выигрыш! ':'Выигрыш ')+'x'+(win/bet).toFixed(2)}
 else{hl([]);$('#smsg').textContent=free?'Без выигрыша':'Попробуйте ещё'}

 if(free){
   if(win>0){SL.fsTot+=win;}
 } else {
   const res = await playGame('slot', bet, { win: win, alreadyDeducted: true });
   if(res && res.newBalance !== undefined) {
      S.bal = res.newBalance;
      render();
   }
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

 while(SL.fs>0){
   SL.fs--;hud();
   await slotSpin(true);
   slotLock(true);
   await slp(SL.turbo?500:1100);
 }

 $('#slw').classList.remove('fsm');
 const tot=Math.round(SL.fsTot*100)/100;

 if(tot>0){
   S.wins++;
   S.best=Math.max(S.best||0,tot);
   const res = await playGame('slot', 0, { win: tot, alreadyDeducted: true });
   if(res && res.newBalance !== undefined) {
      S.bal = res.newBalance;
      render();
   }
 }

 S.hist.unshift([G.name+' · бонус',tot]);
 S.hist=S.hist.slice(0,15);
 render();
 feed(G.name,$('#un').textContent||'Вы',bet,tot);
 slotLock(false);SL.fctx=null;hud();
 if(tot>=bet*15)bigWin(tot,bet);

 await ovShow('Итого',(tot>0?'+':'')+fmt(tot),'<p class="rl" style="text-align:center">'+(tot>0?'за бонусную игру':'бонус без выигрыша')+'</p>','Продолжить');
 $('#swn').textContent=fmt(tot);
}

function showPay(){const G=SL.G,sc=slotScale()/20;
 let t=G.order.map(k=>'<div class="pt"><div class="cell k-'+k+' kk-'+k+'">'+symHTML({s:k})+'</div><div><b>'+G.pay[k].map((v,i)=>(i+3)+'× '+(v*sc).toFixed(2)).join(' · ')+'</b><small>от ставки</small></div></div>').join('');
 t+='<p class="rl">20 линий. '+G.rules+' RTP: '+(S.cfg.slot||85)+'%.</p>';
 ovShow('Выплаты','',t,'Закрыть')}

function openSlot(id){const G=SLOTS[id];SL.G=G;SL.ctx={streak:0,tm:1};SL.fctx=null;SL.fs=0;
 const w=$('#slw');w.className='slw th-'+id+(id=='cat'?'':' nt');
 $('#ssign').textContent=G.name.toUpperCase();
 $('#slobby').style.display='none';$('#sgame').style.display='block';
 for(let c=0;c<5;c++)for(let r=0;r<3;r++)setCell(c,r,mkS(drawSym(G,c,false)));
 $('#sov').classList.remove('on');hl([]);$('#swn').textContent='0';$('#smsg').textContent='Удачи!';hud()}

// ================== ЛОББИ (стили .sc-* лежат в index.html) ==================
function buildLobby(){
 const L=$('#slobby'); if(!L) return;
 L.innerHTML='';

 const rtpText=()=>'RTP '+(Number(window.S&&S.cfg&&S.cfg.slot)||85)+'%';
 const em=c=>'<span>'+c+'</span>';

 const mk=e=>{
  const d=document.createElement('div');
  d.className='sc';
  d.setAttribute('role','button');
  d.tabIndex=0;
  d.style.setProperty('--ac',e.ac);
  d.style.setProperty('--ag',e.ac+'55');
  d.style.setProperty('--bg',e.bg);
  d.innerHTML=
   '<div class="sc-in">'+
    '<div class="sc-art">'+
     (e.tag?'<span class="sc-tag">'+e.tag+'</span>':'')+
     '<div class="sc-ico">'+e.icon+'</div>'+
    '</div>'+
    '<div class="sc-info">'+
     '<div class="sc-t"></div><div class="sc-s"></div>'+
     '<div class="sc-row"><span class="sc-rtp">'+rtpText()+'</span><span class="sc-go">Играть</span></div>'+
    '</div>'+
   '</div>';
  d.querySelector('.sc-t').textContent=e.title;
  d.querySelector('.sc-s').textContent=e.sub;
  d.onclick=e.go;
  d.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();e.go()}};
  return d};

 // --- фирменные слоты ---
 const look={
  cat:{ac:'#6fe05a',bg:'linear-gradient(180deg,#7ec8f5 0,#c9ecff 42%,#6fcf5a 43%,#3b9a3a)',tag:'Хит'},
  gold:{sym:'scat',ac:'#f59e0b',bg:'linear-gradient(180deg,#ffd9a0 0,#f4a259 28%,#c0662b 29%,#7a3d1c 62%,#4a2310)'},
  pha:{sym:'wild',ac:'#fbbf24',bg:'linear-gradient(180deg,#1c5b8c 0,#52b6dc 26%,#f3d98f 27%,#dcae5c 60%,#a8742e)'},
  neon:{ac:'#22e3ff',bg:'linear-gradient(180deg,#0a0420,#1a0638 50%,#0c0324)'},
  dra:{ac:'#ff3b30',bg:'linear-gradient(180deg,#4a0c18 0,#9a1624 30%,#2e0a12 31%,#14050b)'},
  cos:{ac:'#a855f7',bg:'radial-gradient(70% 40% at 20% 20%,rgba(160,80,255,.5),transparent),radial-gradient(60% 40% at 90% 70%,rgba(34,211,238,.35),transparent),linear-gradient(180deg,#070720,#0c0c3a 60%,#05051a)'},
  pot:{ac:'#c084fc',bg:'linear-gradient(180deg,#1a0a2e 0,#3a1466 40%,#12062c)'}
 };
 const own=Object.keys(SLOTS).map(id=>{
  const G=SLOTS[id],l=look[id]||{ac:'#c19bff',bg:'linear-gradient(180deg,#3a1d6e,#1d0f3a)'};
  return{title:G.name,sub:G.sub,ac:l.ac,bg:l.bg,tag:l.tag,
   icon:'<svg class="ic"><use href="#i-'+G.ico(l.sym||G.hero)+'"/></svg>',go:()=>openSlot(id)}});
 own.push({title:"Gravedigger's Tip",sub:'1024 ways · сбор гробов',ac:'#9dff4a',tag:'Хит',
  bg:'radial-gradient(140% 70% at 50% 0%,#4b1f9e,#1a0d36 72%)',icon:em('⚰️'),go:openGravedigger});

 // --- слоты в iframe ---
 const frames=[
  {id:'abyss',title:'Abyssal Tide',sub:'Сбор сундуков',icon:'🌊',bg:'radial-gradient(140% 70% at 50% 0%,#0c4a6e,#04121f 72%)',ac:'#22e5c8',file:'ABYSSALTIDE.html'},
  {id:'pharaoh',title:"Pharaoh's Tomb",sub:'Сбор урн',icon:'🏺',bg:'radial-gradient(140% 70% at 50% 0%,#4a2f16,#160c04 72%)',ac:'#f59e0b',file:'PHARAOHSTOMB.html'},
  {id:'neonheist',title:'Neon Heist',sub:'Сбор хранилищ',icon:'💎',bg:'radial-gradient(140% 70% at 50% 0%,#2a1258,#0a0612 72%)',ac:'#ff2d95',file:'NEONHEIST.html'},
  {id:'crazymix',title:'Crazy Mix',sub:'Смешивай',icon:'🎲',bg:'radial-gradient(140% 70% at 50% 0%,#41207a,#150a2b 72%)',ac:'#ff3d81',file:'crazy-mix.html'},
  {id:'goldbandit',title:'Gold Bandit',sub:'Ветки ×24 · фриспины',icon:'💰',bg:'radial-gradient(140% 70% at 50% 0%,#8a3a14,#2a1608 72%)',ac:'#ffc61a',file:'gold-rush-bandit-slot.html',tag:'Новинка'},
  {id:'kraken',title:'Kraken Deep',sub:'Кластеры · каскады',icon:'🐙',bg:'radial-gradient(140% 70% at 50% 0%,#0e2a5c,#050a1a 72%)',ac:'#22e5c8',file:'kraken-deep-slot.html',tag:'Новинка'},
  {id:'cosmic',title:'Cosmic Candy',sub:'8+ символов · тамблы',icon:'🍬',bg:'radial-gradient(140% 70% at 50% 0%,#34177a,#1b0a3d 72%)',ac:'#ff8fd8',file:'cosmic-candy-slot.html',tag:'Новинка'},
  {id:'luckypanda',title:'Lucky Panda Bao',sub:'Панда-респины',icon:'🐼',bg:'radial-gradient(140% 70% at 50% 0%,#b3122a,#5a0a18 72%)',ac:'#ffd24d',file:'luckypanda.html',tag:'Новинка'},
  {id:'neonfruit',title:'Neon Fruit Wheel',sub:'Колесо ×500',icon:'🍒',bg:'radial-gradient(140% 70% at 50% 0%,#2a0b4d,#12001f 72%)',ac:'#ff2d95',file:'neonfruit.html',tag:'Новинка'},
  {id:'pharaohcats',title:'Pharaoh Cats',sub:'WILD до x10',icon:'🐱',bg:'radial-gradient(140% 70% at 50% 0%,#2a0f4a,#0a0612 72%)',ac:'#fde047',file:'pharaohcats.html',tag:'Новинка'},
  {id:'secret',title:'Secret Files',sub:'243 линии · секреты',icon:'🕵️',bg:'radial-gradient(140% 70% at 50% 0%,#1c2350,#070a18 72%)',ac:'#ffb703',file:'secret-files-slot.html'},
  {id:'jazz',title:'Velvet Jazz',sub:'25 линий · джаз',icon:'🎷',bg:'radial-gradient(140% 70% at 50% 0%,#d81b7a,#1a0420 72%)',ac:'#f2b01e',file:'velvet-jazz.html'},
  {id:'viking',title:'Viking Thunder',sub:'10 линий · бонус грома',icon:'⚡',bg:'radial-gradient(140% 70% at 50% 0%,#34508f,#050b22 72%)',ac:'#7fd1ff',file:'viking-thunder-slot.html'}
 ].map(s=>({title:s.title,sub:s.sub,ac:s.ac,bg:s.bg,tag:s.tag,icon:em(s.icon),go:()=>openSlotFrame(s.id,s.file)}));

 [['Слоты Velvet',own],['Ещё слоты',frames]].forEach(([name,list])=>{
  const h=document.createElement('h3');h.className='sh';h.textContent=name;L.appendChild(h);
  const g=document.createElement('div');g.className='sc-grid';
  list.forEach(e=>g.appendChild(mk(e)));
  L.appendChild(g)});
}
// обновить RTP на карточках при открытии вкладки «Слоты»
(function(){const nb=document.querySelector('nav button[data-t="s"]');
 if(nb)nb.addEventListener('click',()=>{const t='RTP '+(Number(window.S&&S.cfg&&S.cfg.slot)||85)+'%';
  document.querySelectorAll('#slobby .sc-rtp').forEach(el=>{el.textContent=t})})})();
// ==========================================================

// ===== Gravedigger iframe =====
let gdWrap=null;
function openGravedigger(){
  if(SL.busy)return;
  $('#slobby').style.display='none';
  $('#sgame').style.display='none';
  if(!gdWrap){
    gdWrap=document.createElement('div');
    gdWrap.id='gd-wrap';
    gdWrap.style.cssText='position:fixed;inset:0;z-index:9999;background:#0d0716;overflow:hidden;';
    gdWrap.innerHTML=`
      <button id="gd-close" aria-label="Закрыть" style="position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:10px;z-index:10001;width:42px;height:42px;border-radius:50%;background:linear-gradient(#ff5a7e,#b3123a);color:#fff;border:3px solid #0d0716;box-shadow:0 4px 0 #0d0716;font:900 22px system-ui;line-height:1;cursor:pointer;display:grid;place-items:center;">×</button>
      <iframe id="gd-frame" src="gravedigger.html" style="width:100%;height:100%;border:0;display:block;background:#0d0716;" allow="autoplay"></iframe>
    `;
    document.body.appendChild(gdWrap);
    const close=()=>{ gdWrap.style.display='none'; $('#slobby').style.display='block'; syncMe(); };
    document.getElementById('gd-close').onclick=close;
    window.addEventListener('message',(e)=>{ if(e.data&&e.data.type==='gd-close')close(); });
    const frame=document.getElementById('gd-frame');
    frame.addEventListener('load',()=>{
      const tg=window.Telegram&&window.Telegram.WebApp;
      try{frame.contentWindow.postMessage({type:'gd-init',initData:(tg&&tg.initData)||'',apiUrl:API_URL},'*')}catch(e){}
    });
  } else {
    gdWrap.style.display='block';
    const frame=document.getElementById('gd-frame');
    if(frame&&frame.contentWindow){
      const tg=window.Telegram&&window.Telegram.WebApp;
      try{frame.contentWindow.postMessage({type:'gd-init',initData:(tg&&tg.initData)||'',apiUrl:API_URL},'*')}catch(e){}
    }
  }
}

// ===== Универсальный iframe-слот =====
const slotWraps={};
function openSlotFrame(id,htmlFile){
  const key='w_'+id;
  if(!slotWraps[key]){
    const w=document.createElement('div');
    w.id=key;
    w.style.cssText='position:fixed;inset:0;z-index:9999;background:#0a0612;overflow:hidden;';
    w.innerHTML=`
      <button id="close-${id}" aria-label="Закрыть" style="position:absolute;top:calc(env(safe-area-inset-top) + 8px);right:10px;z-index:10001;width:42px;height:42px;border-radius:50%;background:linear-gradient(#ff5a7e,#b3123a);color:#fff;border:3px solid #0a0612;box-shadow:0 4px 0 #0a0612;font:900 22px system-ui;line-height:1;cursor:pointer;display:grid;place-items:center;">×</button>
      <iframe id="frame-${id}" src="${htmlFile}" style="width:100%;height:100%;border:0;display:block;background:#0a0612;" allow="autoplay"></iframe>
    `;
    document.body.appendChild(w);
    slotWraps[key]=w;
    document.getElementById('close-'+id).onclick=()=>{w.style.display='none';syncMe()};
    const frame=document.getElementById('frame-'+id);
    frame.addEventListener('load',()=>sendSlotInit(id));
  } else {
    slotWraps[key].style.display='block';
    sendSlotInit(id);
  }
}

function sendSlotInit(id){
  const frame=document.getElementById('frame-'+id);
  if(!frame||!frame.contentWindow)return;
  const tg=window.Telegram&&window.Telegram.WebApp;
  const msg = {type:'slot-init',initData:(tg&&tg.initData)||'',apiUrl:API_URL};
  try{frame.contentWindow.postMessage(msg,'*')}catch(e){}
  setTimeout(()=>{ try{frame.contentWindow.postMessage(msg,'*')}catch(e){} }, 200);
  setTimeout(()=>{ try{frame.contentWindow.postMessage(msg,'*')}catch(e){} }, 1000);
}

const setBet=d=>{SL.bi=Math.min(BETS.length-1,Math.max(0,SL.bi+d));$('#sbt').textContent=fmt(BETS[SL.bi])};
$('#sm1').onclick=()=>setBet(-1);
$('#sp1').onclick=()=>setBet(1);
$('#sspin').onclick=()=>slotSpin(false);
$('#sturbo').onclick=()=>{SL.turbo=!SL.turbo;$('#sturbo').classList.toggle('sel',SL.turbo)};
$('#sinfo').onclick=showPay;
$('#sback').onclick=()=>{if(SL.busy)return;$('#sgame').style.display='none';$('#slobby').style.display='block'};
SL.G=SLOTS.cat;SL.ctx={streak:0,tm:1};buildLobby();setBet(0);