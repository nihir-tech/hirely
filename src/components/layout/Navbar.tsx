import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '../../config'
import { useSiteStats } from '../../hooks/useSiteStats'
import { useAuth } from '../../lib/auth'
import { LogoMark } from './LogoMark'

const LINKS = [
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#features', label: 'Features' },
  { to: '/#faq', label: 'FAQ' },
]

function LivePill() {
  const stats = useSiteStats()
  if (!stats) return null
  return (
    <span className="lp-live-pill" title={`${stats.totalUsers}+ people have used ${APP_NAME}`}>
      <span className="lp-live-dot" />
      {stats.liveUsers} online now
    </span>
  )
}

function MobileAuthInfo() {
  const { user, signIn, signOut } = useAuth()
  if (!user) {
    return (
      <button className="lp-auth-btn" onClick={() => { void signIn().catch(() => {}) }}>Sign in with Google</button>
    )
  }
  return (
    <button className="lp-auth-btn" onClick={() => { void signOut() }}>Sign out ({user.displayName || user.email})</button>
  )
}

function AuthArea() {
  const { user, loading, isOwner, signIn, signOut } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <button onClick={() => { void signIn().catch(() => {}) }} className="lp-auth-btn" title="Sign in with Google">
        <svg className="lp-auth-g" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15a7 7 0 0 1-6.56-4.85H1.36v3.1A11.99 11.99 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.44 14.39a7.2 7.2 0 0 1 0-4.78v-3.1H1.36a12 12 0 0 0 0 10.98l4.08-3.1z" />
          <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.96 1.18 15.24 0 12 0 7.31 0 3.25 2.69 1.36 6.51l4.08 3.1a7 7 0 0 1 6.56-4.85z" />
        </svg>
        Sign in
      </button>
    )
  }

  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase()

  return (
    <>
      {isOwner && (
        <Link to="/admin" className="lp-nav-cta lp-admin-cta">
          Admin
        </Link>
      )}
      <div className="lp-auth-chip" title={user.email ?? undefined}>
        <span className="lp-avatar">{initial}</span>
        <span className="lp-auth-name">{user.displayName?.split(' ')[0] || 'Signed in'}</span>
        <button onClick={() => { void signOut() }} className="lp-auth-out" title="Sign out">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </>
  )
}

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
            <LogoMark />
          </span>
          {APP_NAME}
        </Link>

        <div className="lp-nav-links">
          <LivePill />
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
          <AuthArea />
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
        <MobileAuthInfo />
      </div>
    </header>
  )
}