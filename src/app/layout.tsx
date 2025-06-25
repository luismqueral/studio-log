import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Studio Queral',
  description: 'Personal website of Luis Queral - software designer, hypermedia artist, and researcher.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="stylesheet" href="/assets/css/tachyons-base.css" />
        <link rel="stylesheet" href="/assets/css/custom.css" />
      </head>
      <body className="sans-serif bg-light-gray">
        {children}
      </body>
    </html>
  )
}
