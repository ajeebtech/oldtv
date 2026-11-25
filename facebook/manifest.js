OLDTV.register({
  slug: 'facebook', name: 'Facebook', color: '#3b5998',
  blurb: 'From thefacebook.com to Timeline.',
  pages: [
    { year: 2004, title: 'Thefacebook profile', file: '2004-thefacebook.html',
      browser: 'ie6', url: 'http://www.thefacebook.com/profile.php?id=4113',
      note: 'Pixel-face header, [ thefacebook ] wordmark, Information, Friends in Other Schools, The Wall' },
    { year: 2006, title: 'Profile', file: '2006-profile.html',
      browser: 'firefox2', url: 'http://harvard.facebook.com/profile.php?id=4113',
      note: 'Left sidebar nav, Information, Mini-Feed, The Wall with Write something box' },
    { year: 2008, title: 'Profile (new design)', file: '2008-profile.html',
      browser: 'firefox3', url: 'http://www.new.facebook.com/profile.php?id=4113&ref=profile',
      note: 'Wall / Info / Photos / Boxes tabs (clickable), "What are you doing right now?" publisher, comments' },
    { year: 2009, title: 'Home News Feed', file: '2009-newsfeed.html',
      browser: 'firefox3', url: 'http://www.facebook.com/home.php?ref=home',
      note: '"What\'s on your mind?", Like / Comment, Requests, Suggestions, Events, Pokes, chat bar' },
    { year: 2011, title: 'Timeline', file: '2011-timeline.html',
      browser: 'chrome', url: 'https://www.facebook.com/brian.kessler',
      note: 'Cover photo (drop an image), profile picture, two-column timeline with spine, year scrubber' }
  ]
});
