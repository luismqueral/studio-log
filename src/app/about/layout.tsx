import type { Metadata } from 'next'
import Link from 'next/link'
import '../globals.css'
import { siteConfig } from '../../lib/config'
import Logo from '../../components/Logo'

export const metadata: Metadata = {
  title: 'About - Studio Queral',
  description: 'About Luis Queral - software designer, researcher, and mixed-media artist.',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="measure-wide center pa3 pa4-ns">
      <header className="mb4 tc">
        <div className="flex justify-center mb3">
          <Logo variant="nav" href="/" />
        </div>
        <nav className="flex flex-wrap justify-center mb3">
          <Link 
            href="/studio-log" 
            className="link gray hover-near-black underline-hover f6 f5-ns ph2 ph3-ns pv1 pv2-ns br3 mr2 mr3-ns mb2"
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
            className="link near-black hover-black underline-hover f6 f5-ns ph2 ph3-ns pv1 pv2-ns br3 bg-near-white mr0 mb2"
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