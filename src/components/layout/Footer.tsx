import { APP_NAME } from '../../config'

const logo = (
  <span className="lp-logo-mark">
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </span>
)

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container" style={{ paddingInline: 24 }}>
        <div className="lp-footer-grid">
          <div>
            <a href="/" className="lp-logo" style={{ marginBottom: 14 }}>{logo}{APP_NAME}</a>
            <p style={{ marginBottom: 0 }}>Make Your Resume Hire-Ready.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#cta">Analyze Resume</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#faq">FAQ</a>
            <a href="#story">Proof</a>
          </div>
          <div>
            <h4>Privacy</h4>
            <p style={{ marginBottom: 0, lineHeight: 1.6 }}>Your resume data is processed securely. Files are not stored permanently unless you choose to save them. No data is shared with third parties.</p>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p style={{ margin: 0 }}>Made by <a href="mailto:nihir12121@gmail.com">Nihir Prajapati</a> · nihir12121@gmail.com</p>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}