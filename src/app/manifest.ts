import type { MetadataRoute } from 'next'

/**
 * Makes the home-screen shortcut behave like an app: its own icon and name, no
 * browser chrome, and the warm background instead of a white flash on launch.
 *
 * `start_url` is the catalogue. An anonymous visitor is sent to /login from
 * there, which is the right landing either way.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'מטבח — המתכונים של המשפחה',
    short_name: 'מטבח',
    description: 'ריכוז מתכונים ממקורות שונים, ותפריטים לחגים ולאירועים.',
    lang: 'he',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fdf9f3',
    theme_color: '#fdf9f3',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
