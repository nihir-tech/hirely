import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center lp-page-lead">
        <span className="lp-page-eyebrow">Error 404</span>
        <h1 className="lp-page-title">
          This page <span className="lp-grad-text">doesn&apos;t exist</span>
        </h1>
        <p className="lp-page-sub mb-8">
          It may have been moved or the link is broken. Let&apos;s get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl relative
            bg-[linear-gradient(120deg,var(--lp-brand-600)_0%,var(--lp-brand-500)_70%,var(--lp-brand-400)_100%)]
            hover:-translate-y-0.5 px-6 py-3.5 text-sm font-semibold text-white transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}