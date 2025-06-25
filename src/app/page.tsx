import Logo from '../components/Logo'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="mw7 center pa3 pa4-ns">
      <header className="mb3 flex justify-center">
        <nav className="flex flex-wrap justify-center">
          <Link 
            href="/studio-log" 
            className="link gray hover-near-black underline-hover f6 f4-ns ph2 ph3-ns pv1 pv2-ns br3 mr2 mr3-ns mb2"
          >
            studio log
          </Link>
          <Link 
            href="/projects" 
            className="link gray hover-near-black underline-hover f6 f4-ns ph2 ph3-ns pv1 pv2-ns br3 mr2 mr3-ns mb2"
          >
            projects
          </Link>
          <Link 
            href="/about" 
            className="link gray hover-near-black underline-hover f6 f4-ns ph2 ph3-ns pv1 pv2-ns br3 mr0 mb2"
          >
            about
          </Link>
        </nav>
      </header>
      
      <Logo variant="hero" />
      
      <main className="tc">
        <div className="measure-wide tl center">
          <p className="f6 f4-ns near-black lh-copy mb4 mb3-ns">
            This is the personal website of{' '}
            <Link href="/about" className="link gray hover-near-black underline-hover">
              Luis Queral
            </Link>
            .
          </p>

          <p className="f6 f4-ns near-black lh-copy">
            He is a{' '}
            <Link href="/projects" className="link gray hover-near-black underline-hover">
              software designer
            </Link>
            ,{' '}
            <Link href="/projects" className="link gray hover-near-black underline-hover">
              hypermedia artist
            </Link>
            , and{' '}
            <Link href="/about" className="link gray hover-near-black underline-hover">
              researcher
            </Link>
            {' '}who leads{' '}
            <Link href="#" className="link gray hover-near-black underline-hover">
              generative design
            </Link>
            {' '}at The New York Times.
          </p>
        </div>
      </main>
    </div>
  )
}
