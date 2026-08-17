import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Make Your Resume Hire-Ready.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/upload" className="text-sm text-neutral-500 hover:text-brand-400 transition-colors">Analyze Resume</Link></li>
              <li><Link to="/dashboard" className="text-sm text-neutral-500 hover:text-brand-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Privacy</h4>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Your resume data is processed securely. Files are not stored permanently unless you choose to save them. No data is shared with third parties.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600">
            Made by <span className="text-neutral-400">Nihir Prajapati</span> · <a href="mailto:nihir12121@gmail.com" className="text-neutral-400 hover:text-brand-400 transition-colors">nihir12121@gmail.com</a>
          </p>
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
