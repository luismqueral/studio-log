import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { siteConfig } from '../lib/config'

export const metadata: Metadata = {
  title: siteConfig.siteName,
  description: 'Notes on software making, generative art, assorted projects, and the things that inspire me.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/tachyons-base.css" />
        <link rel="stylesheet" href="/assets/css/custom.css" />
      </head>
      <body className="sans-serif">
        <div className="mw7 center pa4">
          <header className="mb5">
            <h1 className="f2 ma0">
              <Link href="/" className="link black hover-blue">
                {siteConfig.siteName}
              </Link>
            </h1>
            <p className="f5 gray mt2 mb0">
              Notes on software making, generative art, assorted projects, and the things that inspire me.
            </p>
          </header>
          
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
