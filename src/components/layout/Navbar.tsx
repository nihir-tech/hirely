import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { smoothScrollTo } from '../../lib/smoothScroll'
import { APP_NAME } from '../../config'
import { useSiteStats } from '../../hooks/useSiteStats'
import { useAuth } from '../../lib/auth'
import { useSidebar } from './SidebarContext'
import { LogoMark } from './LogoMark'
import { ThemeToggle } from './ThemeToggle'
import { BotIcon, PanelLeftIcon, PuzzleIcon } from '../ui/Icons'

const PUBLIC_LINKS = [
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
      {stats.liveUsers} online
    </span>
  )
}

function MobileAuthInfo({ closeMenu }: { closeMenu: () => void }) {
  const { user, signIn, signOut } = useAuth()
  if (!user) {
    return (
      <button
        className="lp-auth-btn"
        onClick={() => {
          closeMenu()
          void signIn().catch(() => {})
        }}
      >
        Sign in with Google
      </button>
    )
  }
  return (
    <button
      className="lp-auth-btn"
      onClick={() => {
        closeMenu()
        void signOut()
      }}
    >
      Sign out ({user.displayName || user.email})
    </button>
  )
}

function AuthArea() {
  const { user, loading, isOwner, isCompany, signIn, signOut } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <button onClick={() => { void signIn().catch(() => {}) }} className="lp-auth-btn whitespace-nowrap" title="Sign in with Google">
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
        <Link to="/admin" className="lp-nav-cta lp-admin-cta whitespace-nowrap">
          Admin
        </Link>
      )}
      {isCompany && (
        <Link to="/company" className="lp-nav-cta lp-admin-cta whitespace-nowrap">
          Company
        </Link>
      )}
      <div className="lp-auth-chip whitespace-nowrap" title={user.email ?? undefined}>
        <span className="lp-avatar">{initial}</span>
        <span className="lp-auth-name">{user.displayName?.split(' ')[0] || 'Account'}</span>
        <button onClick={() => { void signOut() }} className="lp-auth-out" title="Sign out" aria-label="Sign out">
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
  const [condensed, setCondensed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lastScrollY = useRef(0)
  const location = useLocation()
  const { user, loading, isOwner, isCompany } = useAuth()
  const { toggleSidebar, openCoachAgent } = useSidebar()
  const onLanding = location.pathname === '/'
  const loggedIn = Boolean(!loading && user)
  const isCondensed = onLanding && !loggedIn && condensed && !mobileOpen

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      setScrolled(y > 24)
      const prev = lastScrollY.current
      if (y > 120 && y > prev + 4) {
        setCondensed(true)
      } else if (y < prev - 4 || y <= 80) {
        setCondensed(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header className={`lp-nav ${scrolled || mobileOpen || loggedIn ? 'scrolled' : ''} ${isCondensed ? 'lp-nav-condensed' : ''}`}>
        <div className="lp-nav-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            {loggedIn && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-fg-muted hover:text-fg-strong transition-colors shrink-0"
                title="Toggle workspace sidebar"
                aria-label="Toggle workspace sidebar"
              >
                <PanelLeftIcon className="w-4 h-4" />
              </button>
            )}
            <Link to="/" className="lp-logo whitespace-nowrap">
              <span className="lp-logo-mark">
                <LogoMark />
              </span>
              {APP_NAME}
            </Link>
            <div className="hidden xl:flex">
              <LivePill />
            </div>
          </div>

          <div className="lp-nav-links">
            <ThemeToggle />

            {loggedIn ? (
              <>
                <Link
                  to="/dashboard?tab=progress"
                  className={location.pathname === '/dashboard' && location.search.includes('tab=progress') ? 'active' : ''}
                >
                  Applications
                </Link>
                <Link
                  to="/jobs"
                  className={location.pathname === '/jobs' ? 'active' : ''}
                >
                  Find Jobs
                </Link>
                <button
                  type="button"
                  onClick={openCoachAgent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-300 bg-brand-600/15 border border-brand-500/30 hover:bg-brand-600/25 transition-colors whitespace-nowrap"
                >
                  <BotIcon className="w-3.5 h-3.5" />
                  <span>AI Coach</span>
                </button>
                <Link
                  to="/extension"
                  className={`inline-flex items-center gap-1.5 ${location.pathname === '/extension' ? 'active' : ''}`}
                >
                  <PuzzleIcon className="w-3.5 h-3.5" />
                  <span>Extension</span>
                </Link>
                <AuthArea />
                <Link to="/upload" className="lp-nav-cta whitespace-nowrap">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Upload Resume
                </Link>
              </>
            ) : (
              <>
                {PUBLIC_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.to}
                    className="lp-nav-mid"
                    onClick={(e) => {
                      if (onLanding) {
                        e.preventDefault()
                        smoothScrollTo(l.to.slice(1), { offset: -86 })
                      }
                    }}
                  >
                    {l.label}
                  </a>
                ))}
                <Link to="/jobs" className={`lp-nav-mid ${location.pathname === '/jobs' ? 'active' : ''}`}>
                  Jobs
                </Link>
                <Link to="/extension" className={`lp-nav-mid ${location.pathname === '/extension' ? 'active' : ''}`}>
                  Extension
                </Link>
                <Link
                  to="/dashboard"
                  className="lp-nav-cta whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', boxShadow: 'none' }}
                >
                  Dashboard
                </Link>
                <AuthArea />
                <Link to="/upload" className="lp-nav-cta whitespace-nowrap">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="lp-mobile-controls">
            <ThemeToggle />
            {loggedIn && (
              <Link
                to="/upload"
                className="lp-mobile-quick-cta"
                aria-label="Upload Resume"
                title="Upload Resume"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            )}
            <button className="lp-burger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className={`lp-mobile-menu ${mobileOpen ? 'open' : ''}`} data-lenis-prevent>
        <div className="lp-mobile-live">
          <LivePill />
        </div>
        {loggedIn ? (
          <>
            <Link to="/dashboard?tab=resumes" onClick={() => setMobileOpen(false)}>My Resumes</Link>
            <Link to="/dashboard?tab=progress" onClick={() => setMobileOpen(false)}>Application Tracker</Link>
            <Link to="/jobs" onClick={() => setMobileOpen(false)}>Find &amp; Apply Jobs</Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                openCoachAgent()
              }}
              className="text-left px-3 py-4 rounded-xl text-lg font-semibold text-brand-500 dark:text-brand-300 border-b border-line"
            >
              AI Coach Agent
            </button>
            <Link to="/extension" onClick={() => setMobileOpen(false)}>Chrome Extension</Link>
            {isCompany && <Link to="/company" onClick={() => setMobileOpen(false)}>Company</Link>}
            {isOwner && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>}
            <Link to="/upload" className="lp-nav-cta" onClick={() => setMobileOpen(false)}>Upload Resume</Link>
          </>
        ) : (
          <>
            {PUBLIC_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.to}
                onClick={(e) => {
                  setMobileOpen(false)
                  if (onLanding) {
                    e.preventDefault()
                    smoothScrollTo(l.to.slice(1), { offset: -70 })
                  }
                }}
              >
                {l.label}
              </a>
            ))}
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <Link to="/jobs" onClick={() => setMobileOpen(false)}>Matched Jobs</Link>
            <Link to="/extension" onClick={() => setMobileOpen(false)}>Chrome Extension</Link>
            <Link to="/upload" className="lp-nav-cta" onClick={() => setMobileOpen(false)}>Get Started</Link>
          </>
        )}
        <div className="mt-2 flex justify-stretch">
          <MobileAuthInfo closeMenu={() => setMobileOpen(false)} />
        </div>
      </div>
    </>
  )
}
