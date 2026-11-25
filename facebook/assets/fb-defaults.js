/* Facebook-era default profile pictures (question-mark silhouette and the 2011 blank silhouette).
   <img data-fbdefault="q"> (2006-2009) or <img data-fbdefault="s"> (2010-2011) with no src gets the default drawn here. */
(function () {
  function uri(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
  var Q = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
    '<rect width="200" height="200" fill="#f7f7f7"/>' +
    '<path d="M100 32c-27 0-44 21-44 48 0 17 7 31 17 40l-1 12c-26 6-46 20-50 46l-2 22h160l-2-22c-4-26-24-40-50-46l-1-12c10-9 17-23 17-40 0-27-17-48-44-48z" fill="#d8dfea"/>' +
    '<path d="M86 66c3-9 9-13 17-13 10 0 17 6 17 15 0 7-4 11-9 14-4 3-6 5-6 10v4h-11v-5c0-8 3-12 8-15 4-3 6-5 6-8 0-4-3-7-7-7-5 0-8 3-9 8z M95 104h12v12H95z" fill="#ffffff"/>' +
    '</svg>';
  var S = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
    '<rect width="200" height="200" fill="#c4cde0"/>' +
    '<path d="M100 40c-24 0-39 19-39 44 0 16 6 29 15 37l-1 11c-27 7-47 21-50 46l-2 22h154l-2-22c-3-25-23-39-50-46l-1-11c9-8 15-21 15-37 0-25-15-44-39-44z" fill="#ffffff"/>' +
    '</svg>';
  var MAP = { q: uri(Q), s: uri(S) };
  window.OLDTV && OLDTV.onRender(function () {
    document.querySelectorAll('img[data-fbdefault]').forEach(function (img) {
      if (img.getAttribute('src') || img.hasAttribute('data-media-key')) return;
      img.src = MAP[img.getAttribute('data-fbdefault')] || MAP.q;
    });
  });
})();
