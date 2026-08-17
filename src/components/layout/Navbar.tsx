import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAME } from '../../config'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav-scrolled' : 'glass-nav'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">{APP_NAME}</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          <a href="/#how-it-works" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="/#features" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            Features
          </a>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/upload"
            className="glass-button inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/30"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="sm:hidden border-t border-white/5 animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            <a href="/#how-it-works" className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/30">
              How It Works
            </a>
            <a href="/#features" className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/30">
              Features
            </a>
            <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/30">
              Dashboard
            </Link>
            <Link to="/upload" className="block px-3 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 text-center">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
