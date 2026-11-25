/* YouTube period player chrome driver: binds every [data-ytp] wrapper to the studio video dropped into its [data-video] area. */
(function () {
  'use strict';
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    t = Math.floor(t);
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function pad(t) { var s = fmt(t); return s.length < 5 ? '0' + s : s; }
  function wrapOf(el) { return el && el.closest && el.closest('[data-ytp]'); }
  function videoOf(w) { return w && w.querySelector('video.studio-player'); }
  function set(w, sel, fn) { w.querySelectorAll(sel).forEach(fn); }
  function sync(w) {
    var v = videoOf(w);
    w.classList.toggle('ytp-has-video', !!v);
    if (!v) return;
    var d = v.duration, c = v.currentTime, p = d ? Math.min(100, c / d * 100) : 0, b = 0;
    try { if (v.buffered.length) b = v.buffered.end(v.buffered.length - 1) / d * 100; } catch (e) {}
    if (!isFinite(b)) b = 0;
    var style = w.getAttribute('data-ytp') === 'pad' ? pad : fmt;
    w.classList.toggle('ytp-playing', !v.paused && !v.ended);
    w.classList.toggle('ytp-started', c > 0 || !v.paused);
    w.classList.toggle('ytp-ended', !!v.ended);
    set(w, '[data-ytp-fill]', function (e) { e.style.width = p + '%'; });
    set(w, '[data-ytp-load]', function (e) { e.style.width = Math.max(b, p) + '%'; });
    set(w, '[data-ytp-knob]', function (e) { e.style.left = p + '%'; });
    set(w, '[data-ytp-cur]', function (e) { e.textContent = style(c); });
    if (isFinite(d) && d > 0) set(w, '[data-ytp-dur]', function (e) { e.textContent = style(d); });
  }
  function syncAll() { document.querySelectorAll('[data-ytp]').forEach(sync); }
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'progress', 'ended', 'seeked', 'emptied'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (e.target && e.target.classList && e.target.classList.contains('studio-player')) sync(wrapOf(e.target)); }, true);
  });
  document.addEventListener('studio:media', function (e) { var w = wrapOf(e.target); if (w) setTimeout(function () { sync(w); }, 0); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-ytp-toggle],[data-ytp-seek]');
    if (!t) return;
    var w = wrapOf(t), v = videoOf(w);
    if (!v) return;
    e.preventDefault();
    if (t.hasAttribute('data-ytp-toggle')) { if (v.paused) v.play().catch(function () {}); else v.pause(); return; }
    var r = t.getBoundingClientRect();
    if (v.duration) v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  });
  OLDTV.onRender(syncAll);
})();
