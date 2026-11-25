/* OLDTV studio: local edit / drag-drop / persistence engine shared by every page. */
(function () {
  'use strict';
  var OLDTV = (window.OLDTV = window.OLDTV || {});
  var root = document.documentElement;
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var BASE = scriptSrc.replace(/shared\/studio\.js.*$/, '');
  var readyFns = [], renderFns = [], isReady = false;
  var body, PAGE, VER, KEY, ui, bar, toastEl, history = [], saveTimer, hoverItem, dropTarget;
  var urlCache = {};
  var mode = 'edit';
  try {
    if (/[?&]film\b/.test(location.search)) sessionStorage.setItem('oldtv:mode', 'film');
    mode = sessionStorage.getItem('oldtv:mode') || 'edit';
  } catch (e) {}

  OLDTV.ready = function (fn) { isReady ? fn() : readyFns.push(fn); };
  OLDTV.onRender = function (fn) { renderFns.push(fn); if (isReady) fn(); };
  OLDTV.save = function () { scheduleSave(0); };
  OLDTV.base = BASE;

  var PAGE_CSS =
    'html:not(.studio-ready) body{visibility:hidden}' +
    'html.studio-edit body{caret-color:#ff2d95}' +
    'html.studio-edit body:focus{outline:none}' +
    'html.studio-edit [data-item]:hover{outline:1px dashed rgba(255,45,149,.75);outline-offset:1px}' +
    'html.studio-edit img:hover,html.studio-edit video:hover,html.studio-edit [data-video]:hover{outline:2px dashed rgba(0,200,255,.85);outline-offset:-2px}' +
    'html.studio-edit img,html.studio-edit video{-webkit-user-drag:none;user-select:none}' +
    'html.studio-edit a{cursor:text}' +
    '.studio-drop{outline:3px solid #ff2d95!important;outline-offset:-3px!important}' +
    'video.studio-player{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:2;cursor:pointer}' +
    'video.studio-player[data-audio]{opacity:0}' +
    'video.studio-media{object-fit:cover}';
  var st = document.createElement('style');
  st.textContent = PAGE_CSS;
  (document.head || root).appendChild(st);

  /* ---------- placeholders ---------- */
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var x = hash(seed) || 7; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; }; }
  function uri(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  var SCENES = [
    ['#ffcf9f', '#e8735a', '#7a3b5e', '#3b1f3f', '#ffe9a8'],
    ['#9fd3ff', '#dff3ff', '#6fa35d', '#3f6b39', '#fffbe0'],
    ['#7fd6f5', '#cdeefa', '#e9d3a5', '#c59d6a', '#fff6d0'],
    ['#12233a', '#2c4a6b', '#1d2b3a', '#0b1520', '#ffd27a'],
    ['#f6c1e0', '#b9c7f2', '#8a6fb8', '#4f3f78', '#fff0f6'],
    ['#ffe08a', '#ffb36b', '#c96d3b', '#7a3b1f', '#fff4cc'],
    ['#b4e1c8', '#e6f5ea', '#4f8a6e', '#2e5a46', '#ffffff']
  ];
  var TONES = ['#6d8fb3', '#b37a6d', '#7fa36b', '#9a7fb3', '#c49a4f', '#5f9ea0', '#b36d93', '#7a8899', '#c2715a', '#4f7fa3'];
  function ph(kind, seed, w, h) {
    w = Math.round(w || 200); h = Math.round(h || 200);
    var r = rng(kind + ':' + seed), s;
    if (kind === 'person') {
      var c = TONES[Math.floor(r() * TONES.length)], cx = w / 2, m = Math.min(w, h);
      s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '"/><stop offset="1" stop-color="' + c + '" stop-opacity=".75"/></linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#g)"/>' +
        '<circle cx="' + cx + '" cy="' + (h * 0.4) + '" r="' + (m * 0.2) + '" fill="#fff" fill-opacity=".55"/>' +
        '<ellipse cx="' + cx + '" cy="' + (h * 0.98) + '" rx="' + (m * 0.38) + '" ry="' + (m * 0.32) + '" fill="#fff" fill-opacity=".55"/></svg>';
    } else if (kind === 'gray') {
      s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="100%" height="100%" fill="#d6d6d6"/></svg>';
    } else {
      var p = SCENES[Math.floor(r() * SCENES.length)], sx = w * (0.2 + r() * 0.6), sy = h * (0.2 + r() * 0.25), sr = Math.min(w, h) * (0.06 + r() * 0.08);
      function hill(base, amp, fill) {
        var d = 'M0 ' + h + ' L0 ' + (h * base), n = 4 + Math.floor(r() * 3);
        for (var i = 1; i <= n; i++) d += ' L' + (w * i / n) + ' ' + (h * (base - amp * r()));
        return '<path d="' + d + ' L' + w + ' ' + h + ' Z" fill="' + fill + '"/>';
      }
      s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
        '<defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#k)"/><circle cx="' + sx + '" cy="' + sy + '" r="' + sr + '" fill="' + p[4] + '" fill-opacity=".9"/>' +
        hill(0.7, 0.25, p[2]) + hill(0.85, 0.15, p[3]) + '</svg>';
    }
    return uri(s);
  }
  OLDTV.ph = ph;

  function fillPlaceholders(scope) {
    var n = 0;
    scope.querySelectorAll('img[data-ph]').forEach(function (img) {
      if (img.getAttribute('src')) return;
      var w = +img.getAttribute('width') || img.offsetWidth || 200;
      var h = +img.getAttribute('height') || img.offsetHeight || w;
      img.src = ph(img.getAttribute('data-ph'), img.getAttribute('data-seed') || img.alt || (n++), w, h);
    });
    scope.querySelectorAll('[data-ph-bg]').forEach(function (el) {
      if (el.style.backgroundImage || el.hasAttribute('data-bg-key')) return;
      el.style.backgroundImage = 'url("' + ph(el.getAttribute('data-ph-bg'), el.getAttribute('data-seed') || (n++), el.offsetWidth || 400, el.offsetHeight || 300) + '")';
      if (!el.style.backgroundSize) el.style.backgroundSize = 'cover';
    });
  }

  /* ---------- media store (IndexedDB) ---------- */
  var dbp;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no indexedDB'));
      var r = indexedDB.open('oldtv', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('media'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function idb(modeRW, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction('media', modeRW), req = fn(t.objectStore('media'));
        t.oncomplete = function () { res(req && req.result); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function putMedia(key, blob) { return idb('readwrite', function (s) { return s.put(blob, key); }); }
  function getMedia(key) { return idb('readonly', function (s) { return s.get(key); }); }
  function delMedia(key) { return idb('readwrite', function (s) { return s.delete(key); }); }
  function urlFor(key) {
    if (urlCache[key]) return Promise.resolve(urlCache[key]);
    return getMedia(key).then(function (b) { if (!b) return null; return (urlCache[key] = URL.createObjectURL(b)); }).catch(function () { return null; });
  }

  /* ---------- state ---------- */
  function syncFormValues() {
    body.querySelectorAll('input').forEach(function (i) {
      if (i.type === 'checkbox' || i.type === 'radio') i.checked ? i.setAttribute('checked', '') : i.removeAttribute('checked');
      else if (i.type !== 'file') i.setAttribute('value', i.value);
    });
    body.querySelectorAll('textarea').forEach(function (t) { t.textContent = t.value; });
  }
  function cleanBg(el) { if (el.hasAttribute('data-bg-key')) el.style.backgroundImage = ''; }
  function serialize() {
    syncFormValues();
    var c = body.cloneNode(true);
    c.querySelectorAll('script').forEach(function (s) { s.remove(); });
    c.querySelectorAll('[contenteditable]').forEach(function (e) { e.removeAttribute('contenteditable'); });
    c.querySelectorAll('.studio-drop').forEach(function (e) { e.classList.remove('studio-drop'); });
    c.querySelectorAll('[data-media-key]').forEach(function (e) { e.removeAttribute('src'); });
    c.querySelectorAll('[data-bg-key]').forEach(cleanBg);
    cleanBg(c);
    return { v: VER, html: c.innerHTML, style: c.getAttribute('style') || '', bgKey: body.getAttribute('data-bg-key') || '', at: Date.now() };
  }
  function applyState(s) {
    body.innerHTML = s.html;
    s.style ? body.setAttribute('style', s.style) : body.removeAttribute('style');
    s.bgKey ? body.setAttribute('data-bg-key', s.bgKey) : body.removeAttribute('data-bg-key');
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === VER ? s : null; } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(serialize())); }
    catch (e) { toast('Could not save: browser storage is full'); }
  }
  function scheduleSave(ms) { clearTimeout(saveTimer); saveTimer = setTimeout(save, ms == null ? 400 : ms); }
  function snapshot() { history.push(serialize()); if (history.length > 40) history.shift(); }
  function undo() {
    var s = history.pop();
    if (!s) return toast('Nothing to undo');
    applyState(s); render(); save(); toast('Undone');
  }
  function keysIn(s) {
    var out = {}, re = /data-(?:media|bg)-key="([^"]+)"/g, m;
    while ((m = re.exec(s.html))) out[m[1]] = 1;
    if (s.bgKey) out[s.bgKey] = 1;
    return Object.keys(out);
  }

  function hydrate() {
    var els = [body].concat([].slice.call(body.querySelectorAll('[data-media-key],[data-bg-key]')));
    els.forEach(function (el) {
      var mk = el.getAttribute('data-media-key'), bk = el.getAttribute('data-bg-key');
      if (mk) urlFor(mk).then(function (u) {
        if (!u) return;
        el.src = u;
        if (el.tagName === 'VIDEO' && el.autoplay) el.play().catch(function () {});
        el.dispatchEvent(new CustomEvent('studio:media', { bubbles: true }));
      });
      if (bk) urlFor(bk).then(function (u) { if (u) el.style.backgroundImage = 'url("' + u + '")'; });
    });
  }
  function render() {
    fillPlaceholders(body);
    hydrate();
    applyMode();
    renderFns.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
  }

  /* ---------- drag & drop media ---------- */
  function isVideoName(s) { return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(s); }
  function isAudioName(s) { return /\.(mp3|m4a|aac|wav|ogg|oga|flac)(\?|#|$)/i.test(s); }
  function findTarget(el, isVideo, isAudio) {
    if (!el || el.nodeType !== 1) el = el && el.parentElement;
    if (!el || (ui && ui.host.contains(el))) return null;
    if (isAudio) return el.closest('[data-video]');
    var sel = isVideo ? '[data-video],video,img' : 'img,video,[data-video],[data-bg]';
    return el.closest(sel) || (body.hasAttribute('data-bg') && !isVideo ? body : null);
  }
  function setDrop(t) {
    if (dropTarget === t) return;
    if (dropTarget) dropTarget.classList.remove('studio-drop');
    dropTarget = t;
    if (t) t.classList.add('studio-drop');
  }
  function copyAttrs(from, to, skip) {
    [].slice.call(from.attributes).forEach(function (a) { if (skip.indexOf(a.name) < 0) to.setAttribute(a.name, a.value); });
  }
  function makeInlineVideo(from) {
    var v = document.createElement('video');
    copyAttrs(from, v, ['src', 'srcset', 'data-ph', 'alt', 'data-media-key', 'poster']);
    v.classList.add('studio-media');
    ['muted', 'loop', 'autoplay', 'playsinline'].forEach(function (a) { v.setAttribute(a, ''); });
    v.muted = true;
    return v;
  }
  function apply(t, src, key, video, audio) {
    var tag = t.tagName;
    function setKey(el) { key ? el.setAttribute('data-media-key', key) : el.removeAttribute('data-media-key'); }
    if (t.hasAttribute('data-video') && t !== body) {
      if (video) {
        var v = t.querySelector('video.studio-player');
        if (!v) { v = document.createElement('video'); v.className = 'studio-player'; v.setAttribute('playsinline', ''); t.appendChild(v); }
        if (t.hasAttribute('data-loop')) v.setAttribute('loop', '');
        audio ? v.setAttribute('data-audio', '') : v.removeAttribute('data-audio');
        if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
        setKey(v); v.src = src; t.classList.add('has-video');
        v.dispatchEvent(new CustomEvent('studio:media', { bubbles: true }));
        return;
      }
      var inner = t.querySelector('img');
      if (inner) t = inner, tag = 'IMG';
    }
    if (tag === 'IMG' || tag === 'VIDEO') {
      var el = t;
      if (video && tag === 'IMG') { el = makeInlineVideo(t); t.replaceWith(el); }
      else if (!video && tag === 'VIDEO') { el = document.createElement('img'); copyAttrs(t, el, ['src', 'muted', 'loop', 'autoplay', 'playsinline', 'data-media-key', 'class']); el.className = t.className.replace(/\bstudio-media\b/, '').trim(); t.replaceWith(el); }
      el.removeAttribute('data-ph'); el.removeAttribute('srcset');
      setKey(el); el.src = src;
      if (el.tagName === 'VIDEO') el.play().catch(function () {});
      el.dispatchEvent(new CustomEvent('studio:media', { bubbles: true }));
      return;
    }
    if (video) return toast('Drop videos onto a player or an image');
    t.style.backgroundImage = 'url("' + src + '")';
    key ? t.setAttribute('data-bg-key', key) : t.removeAttribute('data-bg-key');
    t.removeAttribute('data-ph-bg');
    if (t.getAttribute('data-bg') === 'cover') { t.style.backgroundSize = 'cover'; t.style.backgroundPosition = 'center'; }
    t.dispatchEvent(new CustomEvent('studio:media', { bubbles: true }));
  }
  function hasDrag(e) { var t = e.dataTransfer && e.dataTransfer.types; return t && [].indexOf.call(t, 'Files') > -1 || [].indexOf.call(t || [], 'text/uri-list') > -1; }
  document.addEventListener('dragover', function (e) {
    if (!hasDrag(e)) return;
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
    e.preventDefault();
    var item = e.dataTransfer.items && e.dataTransfer.items[0];
    var au = item && /^audio\//.test(item.type);
    setDrop(findTarget(e.target, au || (item && /^video\//.test(item.type)), au));
  });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) setDrop(null); });
  document.addEventListener('drop', function (e) {
    if (!hasDrag(e)) return;
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
    e.preventDefault();
    setDrop(null);
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) {
      var aud = /^audio\//.test(f.type) || isAudioName(f.name);
      var vid = aud || /^video\//.test(f.type) || isVideoName(f.name);
      if (!vid && !/^image\//.test(f.type)) return toast('Drop an image, video or audio file');
      var t = findTarget(e.target, vid, aud);
      if (!t) return toast(aud ? 'Drop songs onto a music or video player' : vid ? 'Drop videos onto a player or an image' : 'Drop images onto a picture');
      var key = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      var url = URL.createObjectURL(f);
      urlCache[key] = url;
      snapshot();
      putMedia(key, f).then(function () { apply(t, url, key, vid, aud); save(); }, function () {
        apply(t, url, null, vid, aud); toast('Shown, but this browser cannot keep the file after reload');
      });
      return;
    }
    var u = (e.dataTransfer.getData('text/uri-list') || '').split(/\r?\n/).filter(function (l) { return l && l[0] !== '#'; })[0];
    if (!u) return;
    var v2 = isVideoName(u), t2 = findTarget(e.target, v2);
    if (!t2) return toast('Drop images onto a picture');
    snapshot(); apply(t2, u, null, v2); save();
  });

  /* ---------- editing ---------- */
  function applyMode() {
    var edit = mode === 'edit';
    root.classList.toggle('studio-edit', edit);
    root.classList.toggle('studio-film', !edit);
    if (edit) { body.contentEditable = 'true'; body.spellcheck = false; }
    else body.removeAttribute('contenteditable');
    body.querySelectorAll('[data-noedit]').forEach(function (e) { edit ? e.contentEditable = 'false' : e.removeAttribute('contenteditable'); });
    if (ui) { ui.host.style.display = edit ? '' : 'none'; if (!edit) hideBar(); }
  }
  function setMode(m) {
    mode = m;
    try { sessionStorage.setItem('oldtv:mode', m); } catch (e) {}
    applyMode();
    if (m === 'film') toast('Film mode. Press Esc to edit', true);
    tellParent();
  }
  function tellParent() {
    if (window.parent === window) return;
    try { window.parent.postMessage({ oldtv: 'page', mode: mode, page: PAGE, title: document.title, url: body.getAttribute('data-url') || '', href: location.href }, '*'); } catch (e) {}
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.oldtv === 'set-mode' && (d.mode === 'edit' || d.mode === 'film') && d.mode !== mode) setMode(d.mode);
  });
  OLDTV.mode = function () { return mode; };

  document.addEventListener('click', function (e) {
    var v = e.target.closest && e.target.closest('video.studio-player');
    if (v) { v.paused ? v.play() : v.pause(); return; }
    if (mode !== 'edit') return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (ui && ui.host.contains(a))) return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) location.href = a.href;
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  document.addEventListener('input', function (e) { if (!ui || !ui.host.contains(e.target)) scheduleSave(); }, true);
  document.addEventListener('change', function () { scheduleSave(); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); setMode(mode === 'edit' ? 'film' : 'edit'); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); toast('Saved'); }
  });
  window.addEventListener('beforeunload', function () { if (body) save(); });

  /* item controls */
  function showBar(item) {
    hoverItem = item;
    var r = item.getBoundingClientRect();
    bar.style.display = 'flex';
    var top = Math.max(4, r.top - 24), left = Math.min(window.innerWidth - 150, Math.max(4, r.right - 140));
    bar.style.top = top + 'px'; bar.style.left = left + 'px';
    bar.querySelector('[data-b=outer]').style.display = item.parentElement && item.parentElement.closest('[data-item]') ? '' : 'none';
    bar.querySelector('.lbl').textContent = item.getAttribute('data-item') || 'item';
  }
  function hideBar() { hoverItem = null; if (bar) bar.style.display = 'none'; }
  document.addEventListener('mouseover', function (e) {
    if (mode !== 'edit' || !ui) return;
    if (e.target === ui.host) return;
    var it = e.target.closest && e.target.closest('[data-item]');
    if (it) { if (it !== hoverItem && !(hoverItem && hoverItem.contains(it) && bar.dataset.pinned)) showBar(it); }
  });
  window.addEventListener('scroll', function () { if (hoverItem) showBar(hoverItem); }, true);
  function itemAction(a) {
    var it = hoverItem;
    if (!it) return;
    if (a === 'outer') { var o = it.parentElement.closest('[data-item]'); if (o) { bar.dataset.pinned = '1'; showBar(o); } return; }
    snapshot();
    if (a === 'dup') { var c = it.cloneNode(true); it.after(c); showBar(c); }
    else if (a === 'del') { it.remove(); hideBar(); }
    else if (a === 'up' && it.previousElementSibling) { it.parentNode.insertBefore(it, it.previousElementSibling); showBar(it); }
    else if (a === 'down' && it.nextElementSibling) { it.parentNode.insertBefore(it.nextElementSibling, it); showBar(it); }
    delete bar.dataset.pinned;
    save();
  }

  /* ---------- export / import / reset ---------- */
  function blobToData(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  function exportPage() {
    save();
    var s = serialize(), media = {};
    Promise.all(keysIn(s).map(function (k) { return getMedia(k).then(function (b) { return b && blobToData(b).then(function (d) { media[k] = d; }); }).catch(function () {}); }))
      .then(function () {
        var blob = new Blob([JSON.stringify({ oldtv: 1, page: PAGE, state: s, media: media })], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = PAGE.replace(/[^\w-]+/g, '_') + '.oldtv.json';
        document.documentElement.appendChild(a); a.click(); a.remove();
        toast('Exported');
      });
  }
  function importPage(file) {
    file.text().then(function (txt) {
      var d = JSON.parse(txt);
      if (!d || !d.oldtv || !d.state) throw new Error('bad file');
      return Promise.all(Object.keys(d.media || {}).map(function (k) {
        return fetch(d.media[k]).then(function (r) { return r.blob(); }).then(function (b) { return putMedia(k, b); });
      })).then(function () {
        d.state.v = VER;
        localStorage.setItem(KEY, JSON.stringify(d.state));
        location.reload();
      });
    }).catch(function () { toast('That file is not an OLDTV export'); });
  }
  function resetPage() {
    if (!confirm('Reset this page to the original template? Your edits and dropped media on this page will be removed.')) return;
    var s = load();
    if (s) keysIn(s).forEach(function (k) { delMedia(k).catch(function () {}); });
    localStorage.removeItem(KEY);
    clearTimeout(saveTimer);
    body = null;
    location.reload();
  }

  /* ---------- UI (shadow DOM, outside <body>) ---------- */
  var UI_CSS =
    ':host{all:initial}' +
    '.tb{position:fixed;right:12px;bottom:12px;z-index:2147483647;display:flex;flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 24px);box-sizing:border-box;gap:2px;align-items:center;padding:4px;border-radius:9px;background:rgba(18,18,22,.92);box-shadow:0 4px 18px rgba(0,0,0,.35);font:600 11px/1 ui-monospace,Menlo,monospace;color:#eee;-webkit-font-smoothing:antialiased}' +
    '.tb b{padding:0 8px 0 6px;letter-spacing:.12em;color:#ff2d95}' +
    'button,a{all:unset;cursor:pointer;padding:6px 8px;border-radius:6px;color:#ddd;white-space:nowrap}' +
    'button:hover,a:hover{background:rgba(255,255,255,.12);color:#fff}' +
    'button.on{background:#ff2d95;color:#fff}' +
    '.sep{width:1px;height:16px;background:rgba(255,255,255,.18);margin:0 3px}' +
    '.bar{position:fixed;z-index:2147483647;display:none;gap:1px;align-items:center;padding:2px;border-radius:6px;background:#ff2d95;font:600 10px/1 ui-monospace,Menlo,monospace;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    '.bar button{padding:4px 6px;color:#fff;border-radius:4px}.bar button:hover{background:rgba(0,0,0,.2)}.bar .lbl{padding:0 6px;opacity:.85;text-transform:uppercase}' +
    '.toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;padding:9px 14px;border-radius:8px;background:rgba(18,18,22,.92);color:#fff;font:500 12px/1.3 -apple-system,Segoe UI,sans-serif;opacity:0;transition:opacity .25s;pointer-events:none}' +
    '.toast.show{opacity:1}' +
    '.help{position:fixed;right:12px;bottom:56px;z-index:2147483647;width:300px;padding:14px 16px;border-radius:10px;background:rgba(18,18,22,.96);color:#ddd;font:400 12px/1.5 -apple-system,Segoe UI,sans-serif;display:none}' +
    '.help.show{display:block}.help h4{margin:0 0 6px;color:#fff;font-size:12px}.help kbd{font:11px ui-monospace,Menlo,monospace;background:#333;border-radius:3px;padding:1px 4px;color:#fff}.help p{margin:0 0 7px}';
  function buildUI() {
    var host = document.createElement('oldtv-studio');
    var sh = host.attachShadow({ mode: 'open' });
    sh.innerHTML = '<style>' + UI_CSS + '</style>' +
      '<div class="tb"><b>OLDTV</b>' +
      '<button data-a="film" title="Hide all editing UI (Esc)">● Film mode</button><span class="sep"></span>' +
      '<button data-a="undo" title="Undo last drop, duplicate or delete">Undo</button>' +
      '<button data-a="export" title="Download this page with its media">Export</button>' +
      '<button data-a="import" title="Load an exported page">Import</button>' +
      '<button data-a="reset" title="Back to the original template">Reset</button><span class="sep"></span>' +
      '<button data-a="help">?</button><a data-a="home" href="' + BASE + 'index.html" title="All pages">⌂</a>' +
      '<input type="file" accept=".json,application/json" hidden></div>' +
      '<div class="bar"><span class="lbl"></span><button data-b="up" title="Move up">↑</button><button data-b="down" title="Move down">↓</button><button data-b="dup" title="Duplicate">⧉</button><button data-b="del" title="Delete">✕</button><button data-b="outer" title="Select the block around this">⤒</button></div>' +
      '<div class="toast"></div>' +
      '<div class="help"><h4>Editing this page</h4>' +
      '<p>Click any text and type. Everything saves automatically in this browser.</p>' +
      '<p>Drag an image or video file from Finder onto any picture, thumbnail or video player. Songs (mp3, m4a, wav) go onto music and video players. Drop onto empty page space to set the background where the page allows it.</p>' +
      '<p>Hover a post, comment or friend to get <b>↑ ↓ ⧉ ✕</b>: move, duplicate, delete.</p>' +
      '<p><kbd>Esc</kbd> toggles film mode (no outlines, no toolbar, links work). <kbd>⌘</kbd>+click follows a link while editing. <kbd>⌘S</kbd> saves now.</p>' +
      '<p>Export saves a page with its media to a file you can import on another machine.</p></div>';
    root.appendChild(host);
    ui = { host: host, sh: sh };
    bar = sh.querySelector('.bar'); toastEl = sh.querySelector('.toast');
    var input = sh.querySelector('input');
    sh.querySelector('.tb').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'film') setMode('film');
      else if (a === 'undo') undo();
      else if (a === 'export') exportPage();
      else if (a === 'import') input.click();
      else if (a === 'reset') resetPage();
      else if (a === 'help') sh.querySelector('.help').classList.toggle('show');
    });
    input.addEventListener('change', function () { if (input.files[0]) importPage(input.files[0]); input.value = ''; });
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-b]'); if (b) itemAction(b.getAttribute('data-b')); });
    if (window.top !== window) sh.querySelector('[data-a=home]').setAttribute('target', '_top');
  }
  var toastT;
  function toast(msg, quick) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, quick ? 1100 : 2200);
  }
  OLDTV.toast = toast;

  /* ---------- boot ---------- */
  function init() {
    body = document.body;
    PAGE = body.getAttribute('data-page') || location.pathname.split('/').slice(-2).join('/');
    VER = body.getAttribute('data-v') || '1';
    KEY = 'oldtv:page:' + PAGE;
    var s = load();
    if (s) applyState(s);
    buildUI();
    isReady = true;
    render();
    root.classList.add('studio-ready');
    readyFns.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
    readyFns = [];
    tellParent();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
