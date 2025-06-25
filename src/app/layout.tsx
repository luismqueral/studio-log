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
        
        {/* CSS Files */}
        <link rel="stylesheet" href="/assets/css/tachyons-base.css" />
        <link rel="stylesheet" href="/assets/css/tachyons-ext.css" />
        <link rel="stylesheet" href="/assets/css/custom.css" />
        
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Font optimization for mobile */}
        <link rel="preload" href="/assets/css/tachyons-ext.css" as="style" />
        <link rel="preload" href="/assets/css/custom.css" as="style" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-inter bg-light-gray">
        {children}
      </body>
    </html>
  )
}
