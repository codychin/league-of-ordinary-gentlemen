export default function manifest() {
  return {
    id: '/',
    name: 'The Brief of Ordinary Gentleman',
    short_name: 'The Brief',
    description: 'Fantasy football, personal grievances and other matters of irrelevance.',
    lang: 'en-US',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f3efe5',
    theme_color: '#11100e',
    categories: ['sports', 'news', 'entertainment'],
    icons: [
      {
        src: '/icons/ordinary-brief-v2-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/ordinary-brief-v2-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    shortcuts: [
      { name: 'Home', short_name: 'Home', url: '/' },
      { name: 'Franchises', short_name: 'Teams', url: '/teams' },
      { name: 'Culture Desk', short_name: 'Culture', url: '/#culture' },
    ],
  }
}
