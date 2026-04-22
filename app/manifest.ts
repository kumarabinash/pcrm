import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Percurim',
    short_name: 'Percurim',
    description: 'Your Personal CRM — stay in touch with the people who matter',
    start_url: '/',
    display: 'standalone',
    background_color: '#060d1a',
    theme_color: '#060d1a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
