/* OLDTV frame: wraps an OLDTV page in a period browser window. Talks to shared/studio.js over postMessage only. */
(function () {
  'use strict';
  var root = document.documentElement;
  var Q = new URLSearchParams(location.search);
  var SKINS = [['ie6', 'IE6'], ['ie7', 'IE7'], ['firefox2', 'FX2'], ['firefox3', 'FX3'], ['safari3', 'SAF3'], ['chrome', 'CHROME'], ['iphone', 'IPHONE'], ['iphone-safari', 'IPHONE+SAFARI'], ['none', 'NONE']];
  var OS = { ie6: 'xp', ie7: 'xp', firefox2: 'xp', firefox3: 'xp', safari3: 'mac', chrome: 'win7' };
  var SUFFIX = { ie6: ' - Microsoft Internet Explorer', ie7: ' - Windows Internet Explorer', firefox2: ' - Mozilla Firefox', firefox3: ' - Mozilla Firefox' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var BGS = ['dark', 'green', 'white'];
  var skin = pickSkin(Q.get('browser'));
  var initPath = Q.get('page') || '';
  var initDef = { url: Q.get('url') || '', title: Q.get('title') || '' };
  var DIR = location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  var cur = { path: initPath, title: '', url: '', href: '' };
  var mode = 'edit';
  var osOn = Q.has('os') ? Q.get('os') !== '0' : ls('oldtv:frame:os') !== '0';
  var phoneBg = ls('oldtv:frame:phonebg') || 'dark';
  var frameEl;

  function pickSkin(s) { return SKINS.some(function (k) { return k[0] === s; }) ? s : 'ie6'; }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return [].slice.call(document.querySelectorAll(s)); }
  function ls(k, v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- icons (inline SVG, no external files) ---------- */
  var FLAG = '<path d="M1.6 2.6Q4.4 1.3 7.6 2.8L6.9 7Q3.9 5.6.9 6.8Z" fill="#f65314"/><path d="M8.4 3.1Q11.4 4.5 14.9 3.1L14.2 7.4Q10.9 8.8 7.7 7.4Z" fill="#7cbb00"/><path d="M.8 7.6Q3.8 6.4 6.8 7.8L6.1 12.1Q3.1 10.6.1 11.9Z" fill="#00a1f1"/><path d="M7.6 8.2Q10.8 9.6 14.1 8.2L13.4 12.5Q10.1 13.9 6.9 12.5Z" fill="#ffbb00"/>';
  var GRAD = '<svg width="0" height="0" style="position:absolute"><defs>' +
    '<linearGradient id="g-ie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff"/><stop offset="1" stop-color="#0a4bbb"/></linearGradient>' +
    '<radialGradient id="g-gr" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d4f7b0"/><stop offset=".45" stop-color="#5cc12e"/><stop offset="1" stop-color="#1f7a0b"/></radialGradient>' +
    '<radialGradient id="g-rd" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb4a0"/><stop offset=".5" stop-color="#e5482a"/><stop offset="1" stop-color="#a81e08"/></radialGradient>' +
    '<radialGradient id="g-bl" cx=".35" cy=".25" r=".85"><stop offset="0" stop-color="#e2f1ff"/><stop offset=".45" stop-color="#5aa0f0"/><stop offset="1" stop-color="#1a4fb8"/></radialGradient>' +
    '<linearGradient id="g-st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd21e"/><stop offset="1" stop-color="#ee9c00"/></linearGradient>' +
    '<linearGradient id="g-fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2f39a"/><stop offset=".5" stop-color="#5cc22e"/><stop offset="1" stop-color="#2a8a10"/></linearGradient>' +
    '<linearGradient id="g-go" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ee072"/><stop offset="1" stop-color="#329414"/></linearGradient>' +
    '<linearGradient id="g-kh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9e9e9"/><stop offset="1" stop-color="#c4c4c4"/></linearGradient>' +
    '<radialGradient id="g-ff" cx=".55" cy=".45" r=".6"><stop offset="0" stop-color="#9fdcff"/><stop offset="1" stop-color="#1f4fae"/></radialGradient>' +
    '<linearGradient id="g-fx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd23a"/><stop offset=".6" stop-color="#f27a12"/><stop offset="1" stop-color="#c83a08"/></linearGradient>' +
    '<radialGradient id="g-orb" cx=".5" cy=".38" r=".62"><stop offset="0" stop-color="#6aa8ea"/><stop offset=".6" stop-color="#1b4d8f"/><stop offset="1" stop-color="#081a3a"/></radialGradient>' +
    '<linearGradient id="g-orbh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient>' +
    '<radialGradient id="g-wmp" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd27a"/><stop offset=".55" stop-color="#f08a12"/><stop offset="1" stop-color="#b85000"/></radialGradient>' +
    '<radialGradient id="g-cb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#8cc4ff"/><stop offset="1" stop-color="#1a5cc8"/></radialGradient>' +
    '<linearGradient id="g-gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3ff"/><stop offset="1" stop-color="#3d86e0"/></linearGradient>' +
    '<linearGradient id="g-ctab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3f6fa"/></linearGradient>' +
    '<linearGradient id="g-ctab2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e4f2" stop-opacity=".75"/><stop offset="1" stop-color="#b3c7e0" stop-opacity=".6"/></linearGradient>' +
    '</defs></svg>';
  var I = {
    ie: '<svg class="ic" viewBox="0 0 16 16"><path d="M4.1 9h7.2A3.7 3.7 0 1 0 10.2 11.9" fill="none" stroke="url(#g-ie)" stroke-width="2.5"/><path d="M1.5 12.6C.5 10.8 3.8 7.1 8.5 4.7c4-2 6.4-2.2 6.1-.9" fill="none" stroke="#f0b400" stroke-width="1.5" stroke-linecap="round"/></svg>',
    flag: '<svg class="flag" viewBox="0 0 15 15">' + FLAG + '</svg>',
    back: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.6" fill="url(#g-gr)" stroke="#2c7414"/><path d="M5.4 12l6.2-6.2v3.7h6.6v5h-6.6v3.7z" fill="#fff" stroke="#2c7414" stroke-width=".5"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><path d="M4.5 1.5h10l4.5 4.5v16H4.5z" fill="#fff" stroke="#7d8ca8"/><path d="M14.5 1.5V6H19" fill="#dfe6f2" stroke="#7d8ca8"/><circle cx="14.5" cy="15.5" r="6.6" fill="url(#g-rd)" stroke="#a31f0a"/><path d="M11.8 12.8l5.4 5.4m0-5.4l-5.4 5.4" stroke="#fff" stroke-width="2.1"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M4.5 1.5h10l4.5 4.5v16H4.5z" fill="#fff" stroke="#7d8ca8"/><path d="M14.5 1.5V6H19" fill="#dfe6f2" stroke="#7d8ca8"/><path d="M8.2 15a4.6 4.6 0 0 1 7.9-3.2" fill="none" stroke="#2f9a1a" stroke-width="2.4"/><path d="M18.6 9.2l-.4 4.9-4.6-1.7z" fill="#2f9a1a"/><path d="M17 16a4.6 4.6 0 0 1-7.9 3.2" fill="none" stroke="#2f9a1a" stroke-width="2.4"/><path d="M6.6 21.8l.4-4.9 4.6 1.7z" fill="#2f9a1a"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M5 11.5V21.5h14v-10" fill="#fdf5de" stroke="#8a6a3a"/><path d="M10 21.5v-6h4v6" fill="#c0702c" stroke="#7a4a1a" stroke-width=".8"/><rect x="15.4" y="4" width="2.6" height="5" fill="#a05a36" stroke="#6a3a1a" stroke-width=".6"/><path d="M1.8 12.8L12 3.4l10.2 9.4-1.6 1.7L12 6.6l-8.6 7.9z" fill="#e2482c" stroke="#8c2410" stroke-width=".8" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.6" fill="#dcefff" stroke="#3d5578" stroke-width="2.2"/><path d="M6.6 9a3.6 3.6 0 0 1 3.4-2.6" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M15 15l6 6" stroke="#6a4a2a" stroke-width="3.4" stroke-linecap="round"/></svg>',
    fav: '<svg viewBox="0 0 24 24"><path d="M12 1.8l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.4l-6.3 3.5 1.5-7L2 9.1l7-.8z" fill="url(#g-st)" stroke="#bf7600" stroke-linejoin="round"/></svg>',
    favAdd: '<svg viewBox="0 0 24 24"><path d="M10 1.8l2.6 5.7 6.1.7-4.5 4.2 1.3 6.1L10 15.4l-5.5 3.1 1.3-6.1-4.5-4.2 6.1-.7z" fill="url(#g-st)" stroke="#bf7600" stroke-linejoin="round"/><circle cx="17.5" cy="17.5" r="5" fill="url(#g-gr)" stroke="#2c7414" stroke-width=".8"/><path d="M17.5 14.6v5.8M14.6 17.5h5.8" stroke="#fff" stroke-width="1.8"/></svg>',
    hist: '<svg viewBox="0 0 24 24"><circle cx="13" cy="12.5" r="8.4" fill="#fff" stroke="#3a6fc4" stroke-width="2"/><path d="M13 7v5.5l3.6 2.4" stroke="#333" stroke-width="1.5" fill="none"/><path d="M.8 13.5l3.6-4.2 3.6 4.2z" fill="#2f9a1a"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13.5" rx="1" fill="#fffbe6" stroke="#8a7a4a"/><path d="M2.8 6l9.2 7.4L21.2 6" fill="none" stroke="#8a7a4a"/><path d="M3 18.6l7-6.2m11 6.2l-7-6.2" stroke="#b3a57a" fill="none"/></svg>',
    print: '<svg viewBox="0 0 24 24"><path d="M6.5 2.5h9l2 2v6.5h-11z" fill="#fff" stroke="#8a8a8a"/><rect x="2.5" y="10" width="19" height="8" rx="1.5" fill="#cfd2d8" stroke="#666"/><rect x="5.5" y="15" width="13" height="6.5" fill="#fff" stroke="#8a8a8a"/><circle cx="18.5" cy="12.6" r="1" fill="#2ab02a"/></svg>',
    globe: '<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.8" fill="url(#g-gl)" stroke="#2f62b8" stroke-width=".8"/><path d="M3.6 4.4c1.4.4 2 1.4 1.6 2.6-.5 1.2-1.9 1-2.2 2.4-.2 1 .7 1.6.5 2.8M9.2 2.2c-.6 1 .2 1.8 1.4 1.8s1.6 1 1 2c-.7 1-.4 2.2.8 2.6 1 .3 1.6-.2 2-.8M8.5 9.5c1.3.2 1.8 1.3 1.2 2.5-.4.8-.1 1.6.3 2.2" fill="none" stroke="#2e9a24" stroke-width="1.7"/></svg>',
    go: '<svg class="ic" viewBox="0 0 16 16"><rect x=".5" y=".5" width="15" height="15" rx="2" fill="url(#g-go)" stroke="#2d7a12"/><path d="M3.4 6.6h5.2V3.8L13 8l-4.4 4.2V9.4H3.4z" fill="#fff"/></svg>',
    page: '<svg class="ic" viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#8c8c8c"/><path d="M9.5 1.5v3h3" fill="#e8e8e8" stroke="#8c8c8c"/></svg>',
    ffpage: '<svg class="ic" viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#9a9a9a" stroke-dasharray="1 1"/></svg>',
    iepage: '<svg class="ic" viewBox="0 0 16 16"><path d="M2.5 .5h8l3 3v12h-11z" fill="#fff" stroke="#7d8ca8"/><text x="7.6" y="13" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="11" fill="url(#g-ie)">e</text><path d="M3 11.8c-.4-1.4 2-3.8 5.2-5.2 2.6-1.1 4.1-1.1 3.9-.3" fill="none" stroke="#f0b400" stroke-width="1"/></svg>',
    ff: '<svg class="ic" viewBox="0 0 16 16"><circle cx="8.4" cy="8.2" r="6.4" fill="url(#g-ff)"/><path d="M2.4 4.6C.9 8.3 2.8 14 8.4 15c4.9.6 7.6-3.6 7-7.6-.4 3.2-3.2 5.4-6.2 4.8-3-.6-4.5-3.4-3.3-5.8-1 .2-1.6 1-1.8 1.6-.4-1-.2-2.2.8-3.4-1-.2-1.9.3-2.5 1zM5 2.2C7.4.5 12 .9 14.2 3.9 12.2 2.5 9.6 2.3 7.6 3.3z" fill="url(#g-fx)"/></svg>',
    ffback: '<svg viewBox="0 0 24 24"><path d="M1.6 12l9.6-9v5.6h11.2v6.8H11.2V21z" fill="url(#g-fa)" stroke="#29660f" stroke-linejoin="round"/><path d="M4 12l6-5.6M12 9.6h9.4" stroke="#fff" stroke-opacity=".55" stroke-width="1"/></svg>',
    ffreload: '<svg viewBox="0 0 24 24"><path d="M19.2 13a7.2 7.2 0 1 1-2.3-5.6" fill="none" stroke="#164fb0" stroke-width="3.8" stroke-linecap="round"/><path d="M19.2 13a7.2 7.2 0 1 1-2.3-5.6" fill="none" stroke="#5f9bff" stroke-width="1.6" stroke-linecap="round"/><path d="M13.6 2.8l7.4-.6-1 7.4z" fill="#164fb0"/></svg>',
    ffstop: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.4" fill="url(#g-rd)" stroke="#a31f0a"/><path d="M8.2 8.2l7.6 7.6m0-7.6l-7.6 7.6" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>',
    ffgo: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="url(#g-gr)" stroke="#2c7414"/><path d="M14.8 10l-5.2-5v3H5.2v4h4.4v3z" fill="#fff"/></svg>',
    ff3reload: '<svg viewBox="0 0 24 24"><path d="M18.8 13a6.8 6.8 0 1 1-2.1-5.3" fill="none" stroke="#1d63d8" stroke-width="3.2" stroke-linecap="round"/><path d="M14.4 3.6l6.6-.4-.8 6.6z" fill="#1d63d8"/></svg>',
    ff3stop: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12m0-12L6 18" stroke="#a9a9a9" stroke-width="3.6" stroke-linecap="round"/></svg>',
    keyhole: '<svg class="kh" width="56" height="30" viewBox="0 0 56 30"><path d="M26 5.5h19.5a9.5 9.5 0 0 1 0 19H26z" fill="url(#g-kh)" stroke="#8a8a8a"/><circle cx="15" cy="15" r="14" fill="url(#g-kh)" stroke="#7f7f7f"/><path d="M7.4 15l6.6-6.6v4.3h8v4.6h-8v4.3z" fill="#56606e"/><path d="M47.2 15l-5-5v3.3h-6.4v3.4h6.4V20z" fill="#b4b4b4"/></svg>',
    rss: '<svg class="ic" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#f68a1f"/><circle cx="4.4" cy="11.6" r="1.7" fill="#fff"/><path d="M2.7 6.7a6.6 6.6 0 0 1 6.6 6.6M2.7 2.9a10.4 10.4 0 0 1 10.4 10.4" fill="none" stroke="#fff" stroke-width="2"/></svg>',
    g: '<svg class="ic" viewBox="0 0 16 16"><rect x=".5" y=".5" width="15" height="15" fill="#fff" stroke="#9aa7bd"/><text x="8" y="12.6" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="12" fill="#2955c6">G</text></svg>',
    mag: '<svg class="ic" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.3" fill="#eef6ff" stroke="#46566e" stroke-width="1.6"/><path d="M9.8 9.8l4.6 4.6" stroke="#46566e" stroke-width="2.4" stroke-linecap="round"/></svg>',
    star: '<svg class="ic" viewBox="0 0 16 16"><path d="M8 1.6l1.9 4.2 4.6.5-3.4 3.1 1 4.6L8 11.7 3.9 14l1-4.6-3.4-3.1 4.6-.5z" fill="none" stroke="#8c8c8c" stroke-linejoin="round"/></svg>',
    x: '<svg class="ic" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    gear: '<svg class="ic" viewBox="0 0 16 16"><path d="M8 1.2l1.2.2.4 1.8 1.2.6 1.6-1 1.6 1.6-1 1.6.5 1.2 1.9.4v2.4l-1.9.4-.5 1.2 1 1.6-1.6 1.6-1.6-1-1.2.5-.4 1.9H6.8l-.4-1.9-1.2-.5-1.6 1-1.6-1.6 1-1.6-.5-1.2-1.9-.4V6.8l1.9-.4.5-1.2-1-1.6 1.6-1.6 1.6 1 1.2-.6.4-1.8z" fill="#9aa3ae" stroke="#5d6672" stroke-width=".7"/><circle cx="8" cy="8" r="2.3" fill="#fff" stroke="#5d6672" stroke-width=".7"/></svg>',
    pagecmd: '<svg class="ic" viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#6d7c96"/><path d="M5.5 7h5M5.5 9h5M5.5 11h4" stroke="#8aa0c4"/></svg>',
    help: '<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.8" fill="url(#g-cb)" stroke="#2050a8"/><text x="8" y="12" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="10" fill="#fff">?</text></svg>',
    chrome: '<svg class="ic" viewBox="0 0 16 16"><path d="M8 8L1.94 4.5A7 7 0 0 1 14.06 4.5z" fill="#e23a2e"/><path d="M8 8l6.06-3.5A7 7 0 0 1 8 15z" fill="#fcd116"/><path d="M8 8v7a7 7 0 0 1-6.06-10.5z" fill="#2ea84c"/><circle cx="8" cy="8" r="3.5" fill="#fff"/><circle cx="8" cy="8" r="2.7" fill="url(#g-cb)"/></svg>',
    apple: '<svg class="apple" viewBox="0 0 24 24"><path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zM15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.71-.69 3.56-1.7"/></svg>',
    wifi: '<svg class="mi" viewBox="0 0 18 14"><path d="M9 13.2l-2.4-2.8a3.6 3.6 0 0 1 4.8 0zM4.6 8a6.8 6.8 0 0 1 8.8 0l-1.3 1.5a4.9 4.9 0 0 0-6.2 0zM2.1 5.1a10.5 10.5 0 0 1 13.8 0l-1.3 1.5a8.6 8.6 0 0 0-11.2 0z"/></svg>',
    vol: '<svg class="mi" viewBox="0 0 18 14"><path d="M1.5 4.8h3l4-3.6v11.6l-4-3.6h-3z"/><path d="M11 4.5a3.4 3.4 0 0 1 0 5M13 2.7a6 6 0 0 1 0 8.6M15 1a8.6 8.6 0 0 1 0 12" fill="none" stroke="#000" stroke-width="1.3"/></svg>',
    bt: '<svg class="mi" viewBox="0 0 12 16"><path d="M2 4.5l7 6.5-3.5 3.2V1.8L9 5 2 11.5" fill="none" stroke="#000" stroke-width="1.4"/></svg>',
    spot: '<svg viewBox="0 0 16 16"><circle cx="6.6" cy="6.6" r="4.2" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M9.8 9.8l4 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    tri: '<svg viewBox="0 0 10 10"><path d="M1.6 5l6.4-4.4v8.8z"/></svg>',
    safReload: '<svg class="ic" viewBox="0 0 16 16"><path d="M12.6 8.6a4.6 4.6 0 1 1-1.4-3.6" fill="none" stroke="#5a5a5a" stroke-width="1.7"/><path d="M9.4 2.4l4.3-.2-.4 4.3z" fill="#5a5a5a"/></svg>',
    book: '<svg class="ic" viewBox="0 0 18 14"><path d="M9 3C7 1.4 4 1 1 1.6v10.6c3-.6 6-.2 8 1.4 2-1.6 5-2 8-1.4V1.6C14 1 11 1.4 9 3z" fill="#f4f4f4" stroke="#5c5c5c"/><path d="M9 3v10.4" stroke="#5c5c5c"/></svg>',
    cback: '<svg viewBox="0 0 16 16"><path d="M1.5 8L8 1.6v4h6.5v4.8H8v4z" fill="#4d5967"/></svg>',
    creload: '<svg viewBox="0 0 16 16"><path d="M13.2 9a5.2 5.2 0 1 1-1.6-4.2" fill="none" stroke="#4d5967" stroke-width="2.4"/><path d="M9.4 1.6l5.4-.4-.6 5.4z" fill="#4d5967"/></svg>',
    cstar: '<svg class="ic" viewBox="0 0 16 16"><path d="M8 1.4l2 4.4 4.8.5-3.6 3.3 1 4.7L8 11.9l-4.2 2.4 1-4.7-3.6-3.3L6 5.8z" fill="#fff" stroke="#7b8694" stroke-linejoin="round"/></svg>',
    wrench: '<svg viewBox="0 0 16 16"><path d="M11.4 1a3.8 3.8 0 0 0-3.6 5.1L1.6 12.3a1.5 1.5 0 0 0 2.1 2.1l6.2-6.2A3.8 3.8 0 0 0 15 4.6l-2.2 2.2-2.2-.6-.6-2.2L12.2 1.8z" fill="#4d5967"/></svg>',
    cdoc: '<svg class="ic" viewBox="0 0 16 16"><path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#7b8694"/><path d="M9.5 1.5v3h3" fill="none" stroke="#7b8694"/></svg>',
    folder: '<svg viewBox="0 0 32 32"><path d="M3 7.5h9l2.2 2.6H29V26H3z" fill="#d9a632" stroke="#9a6f12"/><path d="M3.5 12.5h25.5V26H3.5z" fill="#f6d77a" stroke="#b88a2a"/><path d="M4 13.5h24" stroke="#fff3c4"/></svg>',
    wmp: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12.5" fill="url(#g-wmp)" stroke="#1f4f9a" stroke-width="2.4"/><path d="M12.6 9.8v12.4L22.4 16z" fill="#fff"/></svg>',
    net: '<svg class="ti2" viewBox="0 0 16 16"><rect x="1.5" y="10" width="2.4" height="4.5" fill="#fff"/><rect x="5" y="7.5" width="2.4" height="7" fill="#fff"/><rect x="8.5" y="5" width="2.4" height="9.5" fill="#fff"/><rect x="12" y="2.5" width="2.4" height="12" fill="#fff"/></svg>',
    spk: '<svg class="ti2" viewBox="0 0 16 16"><path d="M1.5 5.5h3l4-3.5v12l-4-3.5h-3z" fill="#e8e8e8" stroke="#3a3a3a" stroke-width=".6"/><path d="M10.5 5a3.6 3.6 0 0 1 0 6M12.4 3.2a6 6 0 0 1 0 9.6" fill="none" stroke="#e8e8e8" stroke-width="1.2"/></svg>',
    xpnet: '<svg class="ti2" viewBox="0 0 16 16"><rect x="1" y="2" width="8" height="6" fill="#bfe0ff" stroke="#1d3e78"/><rect x="6" y="7" width="8" height="6" fill="#bfe0ff" stroke="#1d3e78"/><path d="M3 9v2h3" stroke="#1d3e78" fill="none"/></svg>',
    shield: '<svg class="ti2" viewBox="0 0 16 16"><path d="M8 1l5.5 2v4.4c0 3.6-2.6 6-5.5 7.6C5.1 13.4 2.5 11 2.5 7.4V3z" fill="#e33a1e" stroke="#7a1a0a" stroke-width=".7"/><path d="M8 4v5M8 10.6v1.4" stroke="#fff" stroke-width="1.8"/></svg>',
    msflag: '<svg class="ti2" viewBox="0 0 16 16"><path d="M3 1.5v13" stroke="#ddd" stroke-width="1.4"/><path d="M3.6 2.4c3-1.4 5.6 1.2 9 0v6c-3.4 1.2-6-1.4-9 0z" fill="#ececec"/></svg>'
  };
  I.tray = function (sz) { return I[sz]; };
  var ORB = '<svg class="orb" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17.5" fill="url(#g-orb)" stroke="#06152e"/><circle cx="20" cy="20" r="16.4" fill="none" stroke="#7fb4ef" stroke-opacity=".55"/><g transform="translate(10.6 10.6) scale(1.27)">' + FLAG + '</g><path d="M5 18.5a15 13 0 0 1 30 0c-4.5-2.6-9.5-3.6-15-3.6S9.5 15.9 5 18.5z" fill="url(#g-orbh)"/></svg>';
  var FAV = {
    facebook: '<svg class="ic" viewBox="0 0 16 16"><rect width="16" height="16" rx="1.5" fill="#3b5998"/><path d="M11 16V9.9h2l.3-2.4H11V6.1c0-.7.2-1.2 1.2-1.2h1.3V2.8c-.2 0-1-.1-1.9-.1-1.8 0-3.1 1.1-3.1 3.2v1.7h-2v2.4h2V16z" fill="#fff"/></svg>',
    yahoo: '<svg class="ic" viewBox="0 0 16 16"><rect x=".5" y=".5" width="15" height="15" fill="#fff" stroke="#ddd"/><text x="8" y="12.5" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="11" fill="#ff0033">Y!</text></svg>',
    google: I.g,
    wikipedia: '<svg class="ic" viewBox="0 0 16 16"><rect x=".5" y=".5" width="15" height="15" fill="#fff" stroke="#ccc"/><text x="8" y="12.5" text-anchor="middle" font-family="Times New Roman,serif" font-size="12" fill="#000">W</text></svg>'
  };

  /* ---------- small builders ---------- */
  function ed(f, cls) { return '<span class="ed ' + (cls || '') + '" data-f="' + f + '"></span>'; }
  function ro(f) { return '<span class="ed ro" data-f="' + f + '"></span>'; }
  function favi(gen) { return '<i class="favi" data-favi="' + gen + '"></i>'; }
  function act(a) { return a ? ' data-act="' + a + '"' : ''; }
  function menu(items, underline) {
    return '<div class="menu">' + items.map(function (m) {
      var i = typeof m === 'string' ? 0 : m[1], t = typeof m === 'string' ? m : m[0];
      return '<span>' + (underline ? esc(t.slice(0, i)) + '<u>' + esc(t[i]) + '</u>' + esc(t.slice(i + 1)) : esc(t)) + '</span>';
    }).join('') + '</div>';
  }
  var FFMENU = ['File', 'Edit', 'View', ['History', 1], 'Bookmarks', 'Tools', 'Help'];
  function xpTitle(icon) {
    return '<div class="xp-title">' + icon + '<div class="xp-cap">' + ed('title') + esc(SUFFIX[skin]) + '</div>' +
      '<div class="xp-btns"><b class="xb min"></b><b class="xb max"></b><b class="xb cls"></b></div></div>';
  }
  function tbb(icon, label, a, drop, cls) {
    return '<span class="tbb ' + (cls || '') + '"' + act(a) + '><i class="ti">' + icon + '</i>' + (label ? '<span class="tl">' + label + '</span>' : '') + (drop ? '<i class="dd"></i>' : '') + '</span>';
  }
  var VSEP = '<i class="vsep"></i>';
  function chrTab(on, inner) {
    var W = 214;
    var d = 'M0 28C7 28 9.5 26 11 21L16.5 5C17.7 1.6 19.5 0 23 0H' + (W - 23) + 'C' + (W - 19.5) + ' 0 ' + (W - 17.7) + ' 1.6 ' + (W - 16.5) + ' 5L' + (W - 11) + ' 21C' + (W - 9.5) + ' 26 ' + (W - 7) + ' 28 ' + W + ' 28';
    return '<span class="chr-tab' + (on ? ' on' : '') + '"><svg class="shape" viewBox="0 0 ' + W + ' 28" preserveAspectRatio="none"><path d="' + d + '" fill="url(#' + (on ? 'g-ctab' : 'g-ctab2') + ')" stroke="' + (on ? 'rgba(40,60,90,.55)' : 'rgba(30,50,80,.55)') + '"/></svg>' + inner + '<i class="x">' + I.x + '</i></span>';
  }
  function bars(n) { var s = ''; for (var i = 0; i < 5; i++) s += '<i style="height:' + (4 + i * 2) + 'px"' + (i >= n ? ' class="off"' : '') + '></i>'; return '<span class="sig">' + s + '</span>'; }

  /* ---------- skins ---------- */
  var T = {
    ie6: {
      top: function () {
        return xpTitle(I.ie) +
          '<div class="band ie6-menu">' + menu(['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help']) + '<span class="throb">' + I.flag + '</span></div>' +
          '<div class="band ie6-tools">' + tbb(I.back, 'Back', 'back', true) + tbb(I.back, '', 'fwd', true, 'flip dis') + tbb(I.stop) + tbb(I.refresh, '', 'reload') + tbb(I.home, '', 'home') + VSEP +
          tbb(I.search, 'Search') + tbb(I.fav, 'Favorites') + tbb(I.hist) + VSEP + tbb(I.mail, '', null, true) + tbb(I.print) + '</div>' +
          '<div class="band ie6-addr"><span class="lbl">A<u>d</u>dress</span><div class="combo">' + favi('ie') + ed('url', 'url') + '<i class="xpdrop"></i></div>' +
          '<span class="go"' + act('reload') + '>' + I.go + 'Go</span><i class="vsep"></i><span class="links">Links <b>&raquo;</b></span></div>';
      },
      bot: function () {
        return '<div class="xpstat"><span class="p1">' + I.iepage + ed('status') + '</span><span class="p"></span><span class="p"></span><span class="p"></span><span class="pz">' + I.globe + ed('zone') + '</span></div>';
      }
    },
    ie7: {
      top: function () {
        return xpTitle(I.ie) +
          '<div class="ie7-nav"><span class="ie7-bf"><b class="ie7-r"' + act('back') + '>' + I.cback + '</b><b class="ie7-r dis"' + act('fwd') + '>' + I.cback + '</b><i class="ie7-dd"></i></span>' +
          '<div class="ie7-addr">' + favi('ie') + ed('url', 'url') + '<i class="ie7-ad"></i><b class="ie7-btn"' + act('reload') + '>' + I.ffreload + '</b><b class="ie7-btn">' + I.ffstop + '</b></div>' +
          '<div class="ie7-search"><span class="ph">Live Search</span><b>' + I.mag + '</b><i class="ie7-dd"></i></div></div>' +
          '<div class="ie7-row"><b class="ie7-fav">' + I.fav + '</b><b class="ie7-fav">' + I.favAdd + '</b><i class="ie7-sep"></i>' +
          '<span class="ie7-tab on">' + favi('ie') + ed('title') + '<i class="x">' + I.x + '</i></span><span class="ie7-tab new"></span>' +
          '<span class="ie7-cmd"><span' + act('home') + '>' + I.home + '<i class="dd"></i></span><span class="dis">' + I.rss + '<i class="dd"></i></span><span>' + I.print + '<i class="dd"></i></span>' +
          '<span>' + I.pagecmd + '<em>Page</em><i class="dd"></i></span><span>' + I.gear + '<em>Tools</em><i class="dd"></i></span><span>' + I.help + '<i class="dd"></i></span></span></div>';
      },
      bot: function () {
        return '<div class="xpstat ie7"><span class="p1">' + ed('status') + '</span><span class="pz">' + I.globe + ed('zone') + '</span><span class="pzoom">' + I.mag + '100%<i class="dd"></i></span></div>';
      }
    },
    firefox2: {
      top: function () {
        return xpTitle(I.ff) +
          '<div class="band ff-menu">' + menu(FFMENU, true) + '<i class="ff2-throb"></i></div>' +
          '<div class="band ff-nav">' + tbb(I.ffback, '', 'back', true) + tbb(I.ffback, '', 'fwd', true, 'flip dis') + tbb(I.ffreload, '', 'reload') + tbb(I.ffstop, '', null, false, 'dis') + tbb(I.home, '', 'home') +
          '<div class="ff-url">' + favi('ff') + ed('url', 'url') + '<i class="xpdrop"></i></div><b class="ff2-go"' + act('reload') + '>' + I.ffgo + '</b>' +
          '<div class="ff-search"><span class="eng">' + I.g + '<i class="mdd"></i></span><span class="ph">Google</span><b>' + I.mag + '</b></div></div>' +
          '<div class="band ff-bm"><span>' + I.ffpage + 'Getting Started</span><span>' + I.rss + 'Latest Headlines</span></div>' +
          '<div class="ff2-tabs"><span class="ff2-tab on">' + favi('ff') + ed('title') + '<i class="x red">' + I.x + '</i></span><span class="ff2-tab">' + I.g + ed('tab2') + '<i class="x">' + I.x + '</i></span><i class="ff2-all"></i></div>';
      },
      bot: function () { return '<div class="ffstat">' + ed('status') + '</div>'; }
    },
    firefox3: {
      top: function () {
        return xpTitle(I.ff) +
          '<div class="band ff-menu">' + menu(FFMENU, true) + '<i class="ff3-throb"></i></div>' +
          '<div class="band ff-nav ff3"><span class="ff3-kh"><b' + act('back') + '></b><b' + act('fwd') + '></b>' + I.keyhole + '</span><i class="mdd"></i>' +
          tbb(I.ff3reload, '', 'reload') + tbb(I.ff3stop, '', null, false, 'dis') + tbb(I.home, '', 'home') +
          '<div class="ff-url ff3"><span class="idb">' + favi('ff') + '</span>' + ed('url', 'url') + '<span class="star">' + I.star + '</span><i class="mdd"></i></div>' +
          '<div class="ff-search ff3"><span class="eng">' + I.g + '<i class="mdd"></i></span><span class="ph">Google</span><b>' + I.mag + '</b></div></div>' +
          '<div class="band ff-bm"><span>' + I.star + 'Most Visited<i class="mdd"></i></span><span>' + I.ffpage + 'Getting Started</span><span>' + I.rss + 'Latest Headlines<i class="mdd"></i></span></div>' +
          '<div class="ff3-tabs"><span class="ff3-tab on">' + favi('ff') + ed('title') + '<i class="x">' + I.x + '</i></span><span class="ff3-tab">' + I.g + ed('tab2') + '<i class="x">' + I.x + '</i></span><i class="ff3-all"></i></div>';
      },
      bot: function () { return '<div class="ffstat">' + ed('status') + '</div>'; }
    },
    safari3: {
      top: function () {
        return '<div class="saf-head"><div class="saf-title"><span class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></span>' + ed('title') + '<i class="pill"></i></div>' +
          '<div class="saf-tool"><span class="seg"><b' + act('back') + '>' + I.tri + '</b><b class="dis flip"' + act('fwd') + '>' + I.tri + '</b></span><span class="seg"><b class="plus">+</b></span>' +
          '<div class="saf-url"><i class="prog"></i>' + favi('doc') + ed('url', 'url') + '<b' + act('reload') + '>' + I.safReload + '</b></div>' +
          '<div class="saf-search">' + I.mag + '<i class="mdd"></i><span class="ph">Google</span></div></div></div>' +
          '<div class="saf-bm">' + I.book + '<span>Apple</span><span>Yahoo!</span><span>Google Maps</span><span>YouTube</span><span>Wikipedia</span><span>News<i class="mdd"></i></span><span>Popular<i class="mdd"></i></span></div>';
      }
    },
    chrome: {
      top: function () {
        return '<div class="chr-strip">' + chrTab(true, favi('doc') + ed('title')) + chrTab(false, I.cdoc + ed('tab2')) + '<i class="chr-new"><svg viewBox="0 0 26 16"><path d="M1 15.5L5 2C5.4.8 6 .5 7 .5h17.5c.8 0 1.2.5 1 1.3L21.5 15.5z" fill="url(#g-ctab2)" stroke="rgba(30,50,80,.55)"/></svg></i>' +
          '<span class="w7caps"><b class="min"></b><b class="max"></b><b class="cls"></b></span></div>' +
          '<div class="chr-tool"><b' + act('back') + '>' + I.cback + '</b><b class="flip dis"' + act('fwd') + '>' + I.cback + '</b><b' + act('reload') + '>' + I.creload + '</b>' +
          '<div class="chr-omni">' + favi('cdoc') + ed('url', 'url') + '<span class="star">' + I.cstar + '</span></div><b class="wr">' + I.wrench + '</b></div>';
      }
    },
    iphone: {
      top: function () { return statusBar('black'); },
      deco: phoneDeco
    },
    'iphone-safari': {
      top: function () {
        return statusBar('gray') + '<div class="ms-top"><div class="ms-title">' + ed('title') + '</div><div class="ms-row"><div class="ms-url">' + ed('url', 'url') + '<b' + act('reload') + '>' + I.safReload + '</b></div><div class="ms-search">Google</div></div></div>';
      },
      bot: function () {
        return '<div class="ms-bot"><b' + act('back') + '>' + I.tri + '</b><b class="flip dis"' + act('fwd') + '>' + I.tri + '</b>' +
          '<b><svg viewBox="0 0 20 20"><path d="M10 3v14M3 10h14" stroke="#fff" stroke-width="3.2"/></svg></b>' +
          '<b><svg viewBox="0 0 24 20"><path d="M12 4C9.5 2 6 1.6 2 2.4v14c4-.8 7.5-.4 10 1.6 2.5-2 6-2.4 10-1.6v-14C18 1.6 14.5 2 12 4z" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 4v14" stroke="#fff" stroke-width="2"/></svg></b>' +
          '<b><svg viewBox="0 0 22 20"><rect x="2" y="5" width="13" height="13" rx="1.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M6 2h12.5a1.5 1.5 0 0 1 1.5 1.5V15" fill="none" stroke="#fff" stroke-width="2"/></svg></b></div>';
      },
      deco: phoneDeco
    },
    none: {}
  };
  function statusBar(style) {
    if (ls('oldtv:frame:nosb:' + cur.path)) return '';
    return '<div class="ios-sb ' + style + '"><span class="l">' + bars(5) + ed('carrier') + ed('net', 'net') + '</span>' + ed('clock', 'c') +
      '<span class="r"><i class="batt"><i></i></i></span></div>';
  }
  function phoneDeco() { return '<i class="ear"></i><i class="cam"></i><i class="home"></i>'; }
  var OSBAR = {
    xp: function () {
      return '<div class="xp-task"><span class="xp-start">' + I.flag + '<i>start</i></span>' +
        '<span class="xp-tb">' + (skin.indexOf('fire') === 0 ? I.ff : I.ie) + '<span class="t">' + ro('title') + esc(SUFFIX[skin]) + '</span></span>' +
        '<span class="xp-tray"><i class="tchev"></i>' + I.shield + I.xpnet + I.spk + ed('clock') + '</span></div>';
    },
    win7: function () {
      return '<div class="w7-task"><span class="w7-orb">' + ORB + '</span>' +
        '<span class="w7-pin">' + I.ie.replace('class="ic"', '') + '</span><span class="w7-pin">' + I.folder + '</span><span class="w7-pin">' + I.wmp + '</span><span class="w7-pin on">' + I.chrome.replace('class="ic"', '') + '</span>' +
        '<span class="w7-tray"><i class="up"></i>' + I.msflag + I.net + I.spk + '<span class="w7-clock">' + ed('clock') + ed('date') + '</span><i class="w7-show"></i></span></div>';
    },
    mac: function () {
      return '<div class="mac-bar">' + I.apple + '<b>Safari</b><span>File</span><span>Edit</span><span>View</span><span>History</span><span>Bookmarks</span><span>Window</span><span>Help</span>' +
        '<span class="r">' + I.bt + I.wifi + I.vol + ed('clock') + '<i class="spot">' + I.spot + '</i></span></div>';
    }
  };

  /* ---------- values ---------- */
  var PAGE_FIELDS = { title: 1, url: 1 };
  function year() { var m = (cur.path || '').match(/(?:^|\D)((?:19|20)\d\d)(?=\D|$)/); return m ? +m[1] : ({ ie6: 2006, ie7: 2007, firefox2: 2007, firefox3: 2008, safari3: 2008, chrome: 2010 }[skin] || 2010); }
  function when() { var d = new Date(); d.setFullYear(year()); return d; }
  function hm(d) { var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function pkey() { return 'oldtv:frame:' + cur.path + ':' + skin; }
  function gkey() { return 'oldtv:frame:@' + skin; }
  function def(f) {
    var init = cur.path === initPath, d = when();
    switch (f) {
      case 'title': return (init && initDef.title) || cur.title || (cur.path.split('/').pop() || 'Untitled');
      case 'url': var u = (init && initDef.url) || cur.url || ''; return skin === 'chrome' ? u.replace(/^http:\/\//, '') : u;
      case 'status': return 'Done';
      case 'zone': return 'Internet';
      case 'tab2': return skin === 'chrome' ? 'New Tab' : 'Google';
      case 'clock': return (skin === 'safari3' ? DAYS[d.getDay()] + ' ' : '') + hm(d);
      case 'date': return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
      case 'carrier': return 'AT&T';
      case 'net': return '3G';
    }
    return '';
  }
  function val(f) { var s = ls(PAGE_FIELDS[f] ? pkey() : gkey()) || {}; return s[f] != null ? s[f] : def(f); }
  function setVal(f, v) {
    var k = PAGE_FIELDS[f] ? pkey() : gkey(), s = ls(k) || {};
    v = String(v).replace(/\s+/g, ' ').trim();
    if (v) s[f] = v; else delete s[f];
    ls(k, Object.keys(s).length ? s : null);
  }
  function faviFor(gen) {
    var host = (val('url').match(/^(?:\w+:\/\/)?([^\/?#]+)/) || [])[1] || '';
    for (var k in FAV) if (host.indexOf(k) > -1) return FAV[k];
    return { ie: I.iepage, ff: I.ffpage, doc: I.page, cdoc: I.cdoc }[gen] || I.page;
  }
  function fill() {
    $$('[data-f]').forEach(function (el) {
      if (el === document.activeElement) return;
      var f = el.getAttribute('data-f'), v = val(f);
      if (f === 'url' && skin === 'chrome') {
        var m = v.match(/^((?:\w+:\/\/)?[^\/?#]*)(.*)$/);
        el.innerHTML = '<span class="host"></span><span class="path"></span>';
        el.firstChild.textContent = m[1]; el.lastChild.textContent = m[2];
      } else el.textContent = v;
    });
    $$('.favi').forEach(function (el) { el.innerHTML = faviFor(el.getAttribute('data-favi')); });
    document.title = val('title');
  }

  /* ---------- render ---------- */
  function render() {
    var os = osOn && OS[skin];
    root.className = root.className.replace(/\b(skin|os|bg)-\S+/g, '').replace(/\s+/g, ' ').trim();
    root.classList.add('skin-' + skin);
    if (os) root.classList.add('os-' + os);
    if (/^iphone/.test(skin)) root.classList.add('phone', 'bg-' + phoneBg); else root.classList.remove('phone');
    var t = T[skin];
    $('#os-top').innerHTML = os === 'mac' ? OSBAR.mac() : '';
    $('#os-bot').innerHTML = os === 'xp' ? OSBAR.xp() : os === 'win7' ? OSBAR.win7() : '';
    $('#ctop').innerHTML = t.top ? t.top() : '';
    $('#cbot').innerHTML = t.bot ? t.bot() : '';
    $('#deco').innerHTML = t.deco ? t.deco() : '';
    controls();
    fill();
    setEditable();
    fit();
  }
  function fit() {
    var w = $('#win');
    if (!/^iphone/.test(skin)) { w.style.transform = ''; return; }
    var k = Math.min((innerHeight - 28) / 754, (innerWidth - 28) / 394);
    w.style.transform = 'scale(' + k.toFixed(4) + ')';
  }
  function controls() {
    var c = $('#ctl');
    c.innerHTML = '<b>OLDTV</b>' + SKINS.map(function (s) { return '<button data-skin="' + s[0] + '"' + (s[0] === skin ? ' class="on"' : '') + '>' + s[1] + '</button>'; }).join('') +
      '<span class="sep"></span>' +
      (OS[skin] ? '<button data-c="os" title="Show the ' + { xp: 'Windows XP taskbar', win7: 'Windows 7 taskbar', mac: 'Mac OS X menu bar' }[OS[skin]] + '"' + (osOn ? ' class="on"' : '') + '>OS</button>' : '') +
      (/^iphone/.test(skin) ? '<button data-c="sb" title="Hide the frame status bar when the page draws its own"' + (ls('oldtv:frame:nosb:' + cur.path) ? '' : ' class="on"') + '>Status bar</button>' : '') +
      (/^iphone/.test(skin) ? '<button data-c="bg" title="Backdrop behind the phone">BG: ' + phoneBg + '</button>' : '') +
      '<button data-c="reset" title="Restore the default title, address, clock and status text">Reset text</button>' +
      '<button data-c="film" title="Hide all editing UI (Esc)">&#9679; Film</button><span class="sep"></span>' +
      '<a href="index.html" title="All pages">&#8962;</a>';
  }
  function setEditable() {
    $$('[data-f]').forEach(function (el) {
      if (mode === 'edit' && !el.classList.contains('ro')) {
        try { el.contentEditable = 'plaintext-only'; } catch (e) { el.contentEditable = 'true'; }
        el.spellcheck = false;
      } else el.removeAttribute('contenteditable');
    });
  }
  function setMode(m, tell) {
    mode = m;
    root.classList.toggle('f-edit', m === 'edit');
    root.classList.toggle('f-film', m !== 'edit');
    setEditable();
    if (tell && frameEl && frameEl.contentWindow) frameEl.contentWindow.postMessage({ oldtv: 'set-mode', mode: m }, '*');
  }
  function syncQuery() { try { history.replaceState(history.state, '', '?' + Q.toString()); } catch (e) {} }
  function rel(href) {
    var h = String(href || '').replace(/[?#].*$/, '');
    if (h.indexOf(DIR) !== 0) return null;
    try { return decodeURI(h.slice(DIR.length)); } catch (e) { return h.slice(DIR.length); }
  }
  function progress() {
    var p = $('.saf-url .prog');
    if (!p) return;
    p.className = 'prog'; void p.offsetWidth; p.className = 'prog run';
  }

  /* ---------- events ---------- */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!frameEl || e.source !== frameEl.contentWindow || !d || d.oldtv !== 'page') return;
    var path = rel(d.href);
    if (path == null) path = cur.path;
    cur = { path: path, title: d.title || '', url: d.url || '', href: d.href || '' };
    if (path && path !== Q.get('page')) { Q.set('page', path); Q.delete('url'); Q.delete('title'); syncQuery(); }
    if ((d.mode === 'edit' || d.mode === 'film') && d.mode !== mode) setMode(d.mode, false);
    if (/^iphone/.test(skin)) render(); else fill();
  });
  document.addEventListener('input', function (e) {
    var el = e.target.closest && e.target.closest('[data-f]');
    if (!el) return;
    var f = el.getAttribute('data-f'), v = el.textContent;
    setVal(f, v);
    $$('[data-f="' + f + '"]').forEach(function (o) { if (o !== el) o.textContent = v; });
    if (f === 'title') document.title = v;
    if (f === 'url') $$('.favi').forEach(function (x) { x.innerHTML = faviFor(x.getAttribute('data-favi')); });
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.closest && e.target.closest('[data-f]')) { getSelection().removeAllRanges(); setTimeout(fill, 0); }
  });
  document.addEventListener('paste', function (e) {
    var el = e.target.closest && e.target.closest('[data-f]');
    if (!el) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' '));
  });
  document.addEventListener('keydown', function (e) {
    var field = e.target.closest && e.target.closest('[data-f]');
    if (e.key === 'Escape') {
      e.preventDefault();
      if (field) field.blur();
      setMode(mode === 'edit' ? 'film' : 'edit', true);
    } else if (e.key === 'Enter' && field) { e.preventDefault(); field.blur(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-skin]');
    if (b) { skin = pickSkin(b.getAttribute('data-skin')); Q.set('browser', skin); syncQuery(); render(); return; }
    var c = e.target.closest('[data-c]');
    if (c) {
      var a = c.getAttribute('data-c');
      if (a === 'os') { osOn = !osOn; ls('oldtv:frame:os', osOn ? '1' : '0'); Q.set('os', osOn ? '1' : '0'); syncQuery(); render(); }
      else if (a === 'bg') { phoneBg = BGS[(BGS.indexOf(phoneBg) + 1) % BGS.length]; ls('oldtv:frame:phonebg', phoneBg); render(); }
      else if (a === 'sb') { ls('oldtv:frame:nosb:' + cur.path, ls('oldtv:frame:nosb:' + cur.path) ? null : 1); render(); }
      else if (a === 'reset') { ls(pkey(), null); ls(gkey(), null); fill(); }
      else if (a === 'film') setMode('film', true);
      return;
    }
    var n = e.target.closest('[data-act]');
    if (!n || n.classList.contains('dis')) return;
    var w = n.getAttribute('data-act');
    if (w === 'back') history.back();
    else if (w === 'fwd') history.forward();
    else if (w === 'reload') { frameEl.src = cur.href || initPath; progress(); }
    else if (w === 'home') frameEl.src = initPath;
  });
  window.addEventListener('resize', fit);
  setInterval(function () { $$('[data-f=clock]').forEach(function (el) { if (el !== document.activeElement) el.textContent = val('clock'); }); }, 15000);

  /* ---------- boot ---------- */
  function boot() {
    document.body.insertAdjacentHTML('afterbegin', GRAD);
    frameEl = $('#page');
    render();
    setMode('edit', false);
    frameEl.addEventListener('load', progress);
    frameEl.src = initPath || 'index.html';
    progress();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
