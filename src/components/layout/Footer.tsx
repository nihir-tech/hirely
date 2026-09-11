import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config'
import { useSiteStats } from '../../hooks/useSiteStats'

const logo = (
  <span className="lp-logo-mark">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </span>
)

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com/nihir-tech/hirely',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.76 1.05A9.4 9.4 0 0112 6.35c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.21 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.95.68 1.92v2.85c0 .27.18.6.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 100-3.36 1.68 1.68 0 000 3.36z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:nihir12121@gmail.com',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

const COLUMNS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Analyze Resume', to: '/upload' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'Features', to: '/#features' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', to: '/#faq' },
      { label: 'Why it works', to: '/#how-it-works' },
      { label: 'Optimize for a job', to: '/upload' },
      { label: 'Contact', to: 'mailto:nihir12121@gmail.com', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Data safety', to: '/data-safety' },
    ],
  },
]

export function Footer() {
  const stats = useSiteStats()
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner" style={{ paddingInline: 24 }}>
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <a href="/" className="lp-logo">{logo}{APP_NAME}</a>
            <p className="lp-footer-tagline">
              AI-powered resume analysis that gets you past the ATS — and into the interview.
            </p>
            <div className="lp-footer-social">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={s.label} title={s.label}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div className="lp-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.to} target="_blank" rel="noreferrer">{l.label}</a>
                    ) : (
                      <Link to={l.to}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lp-footer-cta">
            <div className="lp-footer-cta-glow" />
            <h4>Ready to get hired?</h4>
            <p>Free AI analysis in seconds. No signup needed.</p>
            <Link to="/upload" className="lp-footer-cta-btn">
              Get Started
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
            {stats && (
              <div className="lp-footer-stats" role="status">
                <span><strong>{stats.totalUsers.toLocaleString()}</strong> total users</span>
                <span className="lp-live-sep">·</span>
                <span className="lp-live-pill" title="Live right now">
                  <span className="lp-live-dot" /> <strong>{stats.liveUsers.toLocaleString()}</strong> online now
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p className="lp-footer-made">
            Made by <a href="mailto:nihir12121@gmail.com">Nihir Prajapati</a>
            <span className="lp-live-sep">·</span> nihir12121@gmail.com
          </p>
          <div className="lp-footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <span className="lp-live-sep">·</span>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}