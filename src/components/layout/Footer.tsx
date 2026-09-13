import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config'
import { LogoMark } from './LogoMark'

const logo = (
  <span className="lp-logo-mark">
    <LogoMark />
  </span>
)

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 100-3.36 1.68 1.68 0 000 3.36z" />
      </svg>
    ),
  },
]

const PRODUCT_LINKS = [
  { label: 'Analyze Resume', to: '/upload' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Features', to: '/#features' },
]

const RESOURCE_LINKS = [
  { label: 'FAQ', to: '/#faq' },
  { label: 'Why it works', to: '/#how-it-works' },
  { label: 'Optimize for a job', to: '/upload' },
  { label: 'Contact', to: '/contact' },
]

export function Footer() {
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

          <div className="lp-footer-col" key="product">
            <h4>Product</h4>
            <ul>
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col" key="resources">
            <h4>Resources</h4>
            <ul>
              {RESOURCE_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
            <Link to="/upload" className="lp-footer-sec-btn">
              Analyze My Resume
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p className="lp-footer-copy">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="lp-footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <span className="lp-live-sep">·</span>
            <Link to="/terms">Terms</Link>
            <span className="lp-live-sep">·</span>
            <Link to="/data-safety">Data safety</Link>
          </div>
          <p className="lp-footer-made">
            Made by <a href="mailto:nihir12121@gmail.com">Nihir Prajapati</a>
          </p>
        </div>
      </div>
    </footer>
  )
}