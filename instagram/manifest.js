OLDTV.register({
  slug: 'instagram', name: 'Instagram', color: '#3f729b',
  blurb: 'Fast, beautiful photo sharing. iPhone app screens (2010-2012) and instagram.com (2013-2016). Photos are square drop targets; dropped videos loop like 2013+ video posts. In edit mode the chip on each photo cycles through that year\'s filters.',
  pages: [
    { year: 2010, title: 'App feed (Instagram 1.0)', file: '2010-feed.html',
      browser: 'iphone', url: 'Instagram',
      note: 'Launch-month iPhone feed: glossy blue nav bar, X-Pro II / Earlybird frames, Feed / Popular / Share / News / profile tab bar' },
    { year: 2011, title: 'App profile', file: '2011-profile.html',
      browser: 'iphone', url: 'Instagram',
      note: 'Profile with photos / followers / following boxes, Following button, grid / list toggle, 32-photo grid' },
    { year: 2012, title: 'App single photo', file: '2012-photo.html',
      browser: 'iphone', url: 'Instagram',
      note: 'Blue nav bar era photo view: \u2665 128 likes, caption, hashtags and a long comment thread' },
    { year: 2013, title: 'Web profile', file: '2013-web-profile.html',
      browser: 'chrome', url: 'http://instagram.com/jo.alvarez',
      note: 'instagram.com "bluebar" profile: photo mosaic header, framed avatar with Follow, stats box, month-by-month grid with video posts' },
    { year: 2014, title: 'Web photo page', file: '2014-web-photo.html',
      browser: 'chrome', url: 'http://instagram.com/p/rZx4kQhQ7m/',
      note: 'Large photo left, likes and comments right, Add a comment bar (Hyperlapse / ice bucket summer)' },
    { year: 2016, title: 'Web feed', file: '2016-web-feed.html',
      browser: 'chrome', url: 'https://www.instagram.com/',
      note: 'White minimalist feed after the May 2016 logo change: outline glyph, search, 612px cards, views on video posts' }
  ]
});
