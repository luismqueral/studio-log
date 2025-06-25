import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'
import { siteConfig } from '../../lib/config'
import Logo from '../../components/Logo'

export const metadata: Metadata = {
  title: siteConfig.siteName,
  description: 'Notes on software making, generative art, assorted projects, and the things that inspire me.',
}

export default function PostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mw7 center pa3 pa4-ns">
      <header className="mb3 tc">
        <div className="flex justify-center mb3">
          <Logo variant="nav" href="/" />
        </div>
        <nav className="flex flex-wrap justify-center mb3">
          <Link 
            href="/studio-log" 
            className="link near-black hover-black underline-hover f6 f5-ns ph2 ph3-ns pv1 pv2-ns br3 bg-near-white mr2 mr3-ns mb2"
          >
            studio log
          </Link>
          <Link 
            href="/projects" 
            className="link gray hover-near-black underline-hover f6 f5-ns ph2 ph3-ns pv1 pv2-ns br3 mr2 mr3-ns mb2"
          >
            projects
          </Link>
          <Link 
            href="/about" 
            className="link gray hover-near-black underline-hover f6 f5-ns ph2 ph3-ns pv1 pv2-ns br3 mr0 mb2"
          >
            about
          </Link>
        </nav>
      </header>
      
      <main>
        {children}
      </main>
    </div>
  )
} 