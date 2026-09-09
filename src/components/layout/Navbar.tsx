import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '../../config'

const LINKS = [
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#features', label: 'Features' },
  { to: '/#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const onLanding = location.pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <Link to="/" className="lp-logo">
          <span className="lp-logo-mark">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          {APP_NAME}
        </Link>

        <div className="lp-nav-links">
          {LINKS.map((l) => (
            <a key={l.label} href={l.to} onClick={(e) => {
              if (onLanding) {
                e.preventDefault()
                document.querySelector(l.to.slice(1))?.scrollIntoView({ behavior: 'smooth' })
              }
            }}>
              {l.label}
            </a>
          ))}
          <Link to="/dashboard" className="lp-nav-cta" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.12)', boxShadow: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
            Dashboard
          </Link>
          <Link to="/upload" className="lp-nav-cta">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Get Started
          </Link>
        </div>

        <button className="lp-burger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      <div className={`lp-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {LINKS.map((l) => (
          <a key={l.label} href={l.to} onClick={() => setMobileOpen(false)}>{l.label}</a>
        ))}
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
        <Link to="/upload" className="lp-nav-cta" onClick={() => setMobileOpen(false)}>Get Started</Link>
      </div>
    </header>
  )
}