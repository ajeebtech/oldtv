# OLDTV

The old web, rebuilt page by page from Wayback Machine captures, for filmmaking. 43 recreations of MySpace, YouTube, Twitter, Instagram, Facebook, Friendster, orkut, Bebo, hi5, Tumblr, reddit, Digg, Google and Yahoo! from 2004 to 2016, plus period browser windows (IE6, IE7, Firefox 2/3, Safari 3, Chrome, iPhone) to frame them.

Everything runs offline from this folder. Open `index.html` in Chrome (or Safari) by double-clicking it. There's no server, build step or internet needed.

## On set

- **Open** shows the bare page. **In browser** wraps it in the period browser window, with an address bar and window title you can retype.
- Click any text to rewrite it. Hover a post, comment, friend or video for move / duplicate / delete.
- Drag images or videos from Finder onto any avatar, photo, thumbnail or player. Songs (mp3/m4a/wav) go onto music and video players. On pages with custom backgrounds (MySpace 2007, Twitter 2009, Tumblr), drop onto empty space to replace the background.
- **Esc** toggles film mode: no toolbar, no outlines, and links click through between pages of the same site (YouTube home → watch, Facebook feed → profile, Google search → results).
- Edits and media save automatically in that browser on that machine. **Export** on a page saves it with its media to a file you can **Import** elsewhere, and **Reset** restores the original.
- For a full-frame take, open an **In browser** page and go full screen (⌃⌘F).

## Adding pages

See [BUILDING.md](BUILDING.md). Each platform is a folder with `manifest.js` and one HTML file per year/view; every page loads `shared/studio.js`, which provides the editing, drag-and-drop, persistence and film mode.
