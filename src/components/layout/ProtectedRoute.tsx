import { useState, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { GoogleIcon } from '../ui/GoogleIcon'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-[80vh] relative pt-20 flex items-start justify-center py-28">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] relative pt-20">
        <div className="relative mx-auto max-w-md px-4 sm:px-6 py-14">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className="lp-page-eyebrow">Private</span>
            <h1 className="lp-page-title text-xl mb-1.5">Sign in to continue</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Resume analysis is available to signed-in users. Log in with your Google account to
              upload and get your report.
            </p>
            <Button
              onClick={async () => {
                try {
                  await signIn()
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}