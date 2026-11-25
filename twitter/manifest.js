OLDTV.register({
  slug: 'twitter', name: 'Twitter', color: '#33ccff',
  blurb: 'What are you doing?',
  pages: [
    { year: 2007, title: 'Profile', file: '2007-profile.html',
      browser: 'firefox2', url: 'http://twitter.com/kristenf',
      note: 'Original bubbly logo, big latest update, green sidebar with friends grid' },
    { year: 2009, title: 'Home timeline', file: '2009-home.html',
      browser: 'firefox3', url: 'http://twitter.com/home',
      note: 'What are you doing? box with live 140 counter, Update posts a tweet, Trending Topics' },
    { year: 2009, title: 'Profile (custom theme)', file: '2009-profile.html',
      browser: 'firefox3', url: 'http://twitter.com/brookeandthebeat',
      note: 'Tiled custom background: drop an image on empty page space to replace it' },
    { year: 2010, title: '#NewTwitter home', file: '2010-home.html',
      browser: 'chrome', url: 'http://twitter.com/#!/',
      note: 'Two-pane layout; in film mode click a tweet to open it in the details pane' },
    { year: 2012, title: 'Profile with header', file: '2012-profile.html',
      browser: 'chrome', url: 'https://twitter.com/avawhitfield',
      note: 'Header photo card (drop to replace), egg avatars, expanded photo tweet' },
    { year: 2014, title: 'Profile redesign', file: '2014-profile.html',
      browser: 'chrome', url: 'https://twitter.com/theomarchetti',
      note: 'Full-width header, 200px avatar, pinned tweet; film mode toggles favorite/retweet' }
  ]
});
