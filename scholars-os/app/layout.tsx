import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Geist, IBM_Plex_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: 'Operation Scholars OS',
  description: 'Student behavioral intelligence dashboard',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '48x48' },
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
    shortcut: '/icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${dmSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
              fontSize: '13px',
            },
            classNames: {
              success: 'border-l-4 border-l-olive-600',
              error: 'border-l-4 border-l-red-500',
            },
          }}
        />
      </body>
    </html>
  )
}
