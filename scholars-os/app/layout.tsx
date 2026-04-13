import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Geist, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: ['400'],
  subsets: ['latin'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Operation Scholars OS',
  description: 'Student behavioral intelligence dashboard',
  icons: {
    icon: '/IMG_0219.PNG',
    shortcut: '/IMG_0219.PNG',
    apple: '/IMG_0219.PNG',
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
