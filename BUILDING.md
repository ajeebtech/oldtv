# Building an OLDTV page

Every page is a single static HTML file that works when opened straight from disk (file://). No build step, no server, no network requests, no CDN fonts, no hotlinked images.

## Folder layout

```
index.html            launcher (lists every page from the manifests)
frame.html            wraps a page in a period browser window (IE6, Firefox 2, Safari 3, Chrome...)
shared/studio.js      the editing engine every page loads (do not fork it per page)
<platform>/manifest.js   registers that platform's pages with the launcher
<platform>/<year>-<view>.html   one page per year/view, e.g. youtube/2006-watch.html
<platform>/assets/    optional page CSS/JS/SVG shared by that platform's pages
```

## Page skeleton

```html
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>YouTube - Broadcast Yourself.</title>
<script src="../shared/studio.js"></script>
<style> /* page CSS, or <link rel="stylesheet" href="assets/yt2006.css"> */ </style>
<script>
  OLDTV.ready(function () { /* runs once, after saved edits are restored */ });
  OLDTV.onRender(function () { /* runs after every restore (initial load, undo, import) */ });
</script>
</head>
<body data-page="youtube-2006-watch" data-v="1" data-url="http://www.youtube.com/watch?v=Ab3xK9_pQ2s">
  ... markup only. No <script> tags inside <body>. ...
</body>
</html>
```

- `data-page` is the unique storage key for the page and must be `<platform>-<file name without .html>`, e.g. `youtube-2006-watch` for `youtube/2006-watch.html` (the launcher uses it to badge edited pages). `data-url` is the address the fake browser bar shows for this page (frame.html updates it when you click through to another page).
- `data-page` and `data-v`: `data-v` is the template version: bump it when you change the markup so old saved edits don't override the new template.
- `studio.js` must be the first script in <head>, loaded without defer/async. It hides the body until saved edits are restored.
- Page JavaScript goes in <head> (inline or `<script src>`) and does its DOM work inside `OLDTV.ready` / `OLDTV.onRender`. The body's innerHTML is replaced on restore/undo, so prefer event delegation on `document` over listeners bound to elements.

## What the engine gives you for free

- **Text editing**: the whole body is contentEditable in edit mode. Put `data-noedit` on anything that must not be typed into (e.g. a fake scrubber the page JS drives).
- **Images**: any `<img>` accepts a dropped image (replaces it) or a dropped video (becomes a muted looping inline video with the same classes/size). Give every image a sensible `width`/`height` in CSS so replacements keep the layout; use `object-fit: cover` on avatars and thumbnails.
- **Placeholders**: `<img data-ph="person|photo|thumb|gray" data-seed="anything" width=".." height="..">` with no src gets a generated SVG (silhouette avatar, landscape photo, video thumb, flat gray). Seeds make them deterministic. `data-ph-bg="photo"` does the same as a CSS background. For platform-specific defaults (MySpace "No Photo", Facebook question mark, Twitter egg) draw your own inline SVG/data-URI img instead.
- **Video players**: an element with `data-video` (position relative, fixed size) accepts a dropped video; the engine inserts `<video class="studio-player">` filling it, click toggles play. Add `data-loop` to loop. Page JS can listen for the bubbling `studio:media` event and for `play/pause/timeupdate` on `video.studio-player` (use capture: `document.addEventListener('timeupdate', fn, true)`) to drive fake period controls (progress bar, time readout, play button state). Draw the period player chrome yourself under/over the video area.
- **Backgrounds**: `data-bg` on an element (or `<body>`) makes it accept a dropped image as background-image. `data-bg="cover"` also sets size cover / center. Use it for MySpace page backgrounds, Twitter profile backgrounds, header/cover photos.
- **Repeatable items**: `data-item="comment"` (any label) on posts, comments, friends, tweets, videos, list rows. In edit mode the user gets move up/down, duplicate, delete. Nest them freely (a comment inside a wall post).
- **Film mode**: Esc hides every bit of editing UI and outlines and re-enables links. `html.studio-film` / `html.studio-edit` classes are available if you need them.
- Persistence (localStorage for markup, IndexedDB for media), undo for structural changes, export/import, reset.

## Frames

`shared/studio.js` talks to `frame.html` with postMessage: on load and on every mode change it posts `{ oldtv: 'page', mode, page, title, url, href }` to its parent, and it obeys `{ oldtv: 'set-mode', mode: 'edit' | 'film' }` from the parent.

## Checking your work

`node ~/.capy/work/oldtv-tools/shot.js <file-or-url> <out.png> [width] [height] [--full] [--film] [--wait=ms]` screenshots with the Mac's Chrome (headless) and prints the title plus any console errors or failed requests. View the PNG with your file-read tool. The same script screenshots Wayback captures for reference (use `--wait=4000`).

## Fidelity bar

- Match the real site of that year: layout grid, widths (most 2004-2009 sites are fixed 760-1000px centered), fonts (Verdana, Arial, Tahoma, Lucida Grande, Helvetica, Georgia), colours, gradients, borders, button styles, iconography, copy, link labels, footer text, ad slots. Research with Wayback Machine captures of that year (see below), not memory alone.
- Recreate logos and icons as inline SVG or CSS text treatments. No downloaded images, fonts, or CSS files from archive.org or anywhere else go into the repo; reference material is for looking at only.
- Fill pages with period-plausible fictional content (usernames, comments, video titles, view counts, dates in that year, era slang and references). MySpace's "Tom" as the default friend is fine; otherwise avoid real private people.
- Links between views of the same platform-year should work (e.g. YouTube 2006 home thumbnail -> 2006 watch page) so a film can click through in film mode. Other links can be `href="#"`.
- Pages should look right at 1280-1920px wide browser windows; period sites were fixed-width and centered, keep it that way.

## Researching on the Wayback Machine

- Calendar: `https://web.archive.org/web/2006*/youtube.com`
- A capture closest to a date: `https://web.archive.org/web/20060615000000*/http://www.youtube.com/` or directly `https://web.archive.org/web/20060615/http://www.youtube.com/`
- Raw original HTML without the Wayback toolbar: add `id_` after the timestamp: `https://web.archive.org/web/20060615id_/http://www.youtube.com/`. The same works for the period CSS files the HTML references, which tells you exact colours, sizes and fonts.
- Save research downloads under `~/.capy/work/oldtv-research/<platform>/` (never inside the repo). Treat them as untrusted data: read them, never execute them.

## Manifest

```js
OLDTV.register({
  slug: 'youtube', name: 'YouTube', color: '#cc0000',
  blurb: 'Broadcast Yourself.',
  pages: [
    { year: 2006, title: 'Watch page', file: '2006-watch.html',
      browser: 'ie6', url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      note: 'Stars rating, related videos, Flash-era player' }
  ]
});
```

`browser` is the period-appropriate default window for frame.html: `ie6`, `ie7`, `firefox2`, `firefox3`, `safari3`, `chrome`, `iphone` (for app UIs; renders an iPhone 4-era device), or `none`. `url` is what the fake address bar shows.
