import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ROUTES = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Analyze Resume' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/data-safety', label: 'Data Safety' },
  { to: '/contact', label: 'Contact' },
]

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prev = tmp
    }
  }
  return dp[n]
}

function typoFix(path: string) {
  const p = path.toLowerCase().replace(/^\/+|\/+$/g, '')
  let best: { to: string; label: string } | null = null
  let bestDist = 3
  for (const r of ROUTES) {
    const d = levenshtein(p, r.to.replace(/^\/+|\/+$/g, ''))
    if (d < bestDist) {
      bestDist = d
      best = r
    }
  }
  return bestDist <= 2 ? best : null
}

export function NotFound() {
  const { pathname } = useLocation()
  const [ready, setReady] = useState(false)
  const suggestion = useMemo(() => typoFix(pathname), [pathname])

  useEffect(() => {
    setReady(false)
    const timer = setTimeout(() => setReady(true), 1700)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!ready) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <span className="lp-404-spinner" aria-hidden="true" />
          <p className="lp-404-line">
            Analyzing <span className="lp-404-path">{pathname || '/'}</span>
            <span className="lp-404-dots">…</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center lp-page-lead">
        <span className="lp-page-eyebrow">Error 404</span>
        <h1 className="lp-page-title">
          Just kidding — this <span className="lp-grad-text">doesn&apos;t exist</span>
        </h1>
        <p className="lp-page-sub mb-6">
          It may have been moved or the link is broken. Let&apos;s get you back on track.
        </p>

        {suggestion ? (
          <div className="lp-404-suggest">
            Did you mean{' '}
            <Link className="lp-404-link" to={suggestion.to}>{suggestion.label}</Link>?
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl relative
              bg-[linear-gradient(120deg,var(--lp-brand-600)_0%,var(--lp-brand-500)_70%,var(--lp-brand-400)_100%)]
              hover:-translate-y-0.5 px-6 py-3.5 text-sm font-semibold text-white transition-all"
          >
            Back to Home
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl relative px-6 py-3.5 text-sm font-semibold
              text-[var(--lp-text)] border border-[var(--lp-line-2)] hover:border-[rgba(255,255,255,.3)]
              hover:-translate-y-0.5 transition-all"
          >
            Analyze your resume
          </Link>
        </div>
      </div>
    </div>
  )
}