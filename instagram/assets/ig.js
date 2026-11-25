/* OLDTV Instagram helpers: filter chips (edit mode only) and phone-screen scaling for app pages. */
(function () {
  var ERAS = {
    2010: ['Normal', 'X-Pro II', 'Lomo-fi', 'Earlybird', 'Sutro', 'Toaster', 'Brannan', 'Inkwell', 'Walden', 'Hefe', 'Apollo', 'Poprocket', 'Nashville', 'Gotham', '1977', 'Lord Kelvin'],
    2011: ['Normal', 'Amaro', 'Rise', 'Hudson', 'X-Pro II', 'Lomo-fi', 'Earlybird', 'Sutro', 'Toaster', 'Brannan', 'Inkwell', 'Walden', 'Hefe', 'Nashville', '1977', 'Lord Kelvin'],
    2012: ['Normal', 'Amaro', 'Rise', 'Hudson', 'X-Pro II', 'Lo-Fi', 'Earlybird', 'Sutro', 'Toaster', 'Brannan', 'Inkwell', 'Walden', 'Hefe', 'Valencia', 'Nashville', '1977', 'Kelvin'],
    2014: ['Normal', 'Amaro', 'Mayfair', 'Rise', 'Hudson', 'Valencia', 'X-Pro II', 'Sierra', 'Willow', 'Lo-Fi', 'Earlybird', 'Sutro', 'Toaster', 'Brannan', 'Inkwell', 'Walden', 'Hefe', 'Nashville', '1977', 'Kelvin'],
    2016: ['Normal', 'Clarendon', 'Gingham', 'Moon', 'Lark', 'Reyes', 'Juno', 'Slumber', 'Crema', 'Ludwig', 'Aden', 'Perpetua', 'Amaro', 'Mayfair', 'Rise', 'Hudson', 'Valencia', 'X-Pro II', 'Sierra', 'Willow', 'Lo-Fi', 'Inkwell', 'Hefe', 'Nashville']
  };
  var ALIAS = { 'lo-fi': 'lofi', 'kelvin': 'lordkelvin' };
  function cls(name) { var k = name.toLowerCase(); return 'f-' + (ALIAS[k] || k.replace(/[^a-z0-9]/g, '')); }
  function list() {
    var y = +(document.body.getAttribute('data-ig-era') || 2016), best = 2010;
    Object.keys(ERAS).forEach(function (k) { if (+k <= y) best = k; });
    return ERAS[best];
  }
  function chips() {
    document.querySelectorAll('.igf').forEach(function (f) {
      if (f.querySelector('.ig-fchip')) return;
      var c = document.createElement('span');
      c.className = 'ig-fchip';
      c.setAttribute('data-noedit', '');
      c.contentEditable = 'false';
      c.title = 'Instagram filter look (edit mode only). Click to change it.';
      c.textContent = f.getAttribute('data-filter') || 'Normal';
      f.appendChild(c);
    });
  }
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest && e.target.closest('.ig-fchip')) e.preventDefault();
  }, true);
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.ig-fchip');
    if (!c) return;
    e.preventDefault(); e.stopPropagation();
    var f = c.parentNode, names = list(), cur = f.getAttribute('data-filter') || 'Normal';
    var next = names[(names.indexOf(cur) + 1) % names.length];
    f.className = f.className.replace(/\bf-[\w-]+/g, '').replace(/\s+/g, ' ').trim() + ' ' + cls(next);
    f.setAttribute('data-filter', next);
    c.textContent = next;
    if (window.OLDTV && OLDTV.save) OLDTV.save();
    if (window.OLDTV && OLDTV.toast) OLDTV.toast('Filter: ' + next);
  }, true);

  /* App screens are designed at 320x480 (iPhone 3GS/4 points) and scaled to fit the window.
     Inside frame.html's iPhone the frame draws the status bar and gives the page 320x460, so the page drops its own. */
  var zoomStyle;
  function fit() {
    if (!document.querySelector('.ig-screen')) return;
    if (!zoomStyle) { zoomStyle = document.createElement('style'); document.head.appendChild(zoomStyle); }
    var framedSb = window.parent !== window && Math.abs(window.innerHeight / window.innerWidth - 460 / 320) < 0.03;
    document.documentElement.classList.toggle('ig-nosb', framedSb);
    var s = Math.min(window.innerWidth / 320, window.innerHeight / (framedSb ? 460 : 480));
    zoomStyle.textContent = '.ig-screen{zoom:' + s.toFixed(4) + '}';
  }
  window.addEventListener('resize', fit);
  if (window.OLDTV) { OLDTV.ready(fit); OLDTV.onRender(function () { chips(); fit(); }); }
})();
