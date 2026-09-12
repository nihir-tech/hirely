import { useEffect, useMemo, useState } from 'react'
import { onValue, ref, remove } from 'firebase/database'
import { db, firebaseConfigured } from '../lib/firebase'
import { useAuth } from '../lib/auth'
import type { Submission } from '../lib/feed'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Spinner } from '../components/ui/Spinner'
import { GoogleIcon } from '../components/ui/GoogleIcon'

export function Admin() {
  const { user, loading: authLoading, isOwner, signIn } = useAuth()
  const [subs, setSubs] = useState<Submission[]>([])
  const [denied, setDenied] = useState<string | null>(null)

  useEffect(() => {
    if (!db || !firebaseConfigured) return
    const subRef = ref(db, 'submissions')
    const unsub = onValue(
      subRef,
      (snap) => {
        const val = snap.val() as Record<string, Omit<Submission, 'key'>> | null
        if (!val) {
          setSubs([])
          return
        }
        const list = Object.entries(val).map(([key, data]) => ({ key, ...data }))
        list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        setSubs(list)
      },
      (err) => setDenied(err.message),
    )
    return unsub
  }, [])

  const stats = useMemo(() => {
    if (!subs.length) return null
    const avg = Math.round(subs.reduce((s, x) => s + x.overallScore, 0) / subs.length)
    return { count: subs.length, avg }
  }, [subs])

  const handleDelete = (key: string) => {
    if (!db) return
    void remove(ref(db, `submissions/${key}`)).catch(() => {})
  }

  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {authLoading ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : !user ? (
          <Card className="p-8 max-w-md mx-auto text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="lp-page-title text-xl mb-1">Owner Access</h1>
            <p className="text-sm text-neutral-400 mb-6">
              This area is private. Sign in with the authorized Google account to continue.
            </p>
            <Button onClick={async () => {
              try {
                await signIn()
              } catch (e) {
                setDenied((e as Error).message)
              }
            }}>
              <GoogleIcon />
              Sign in with Google
            </Button>
            {denied && <p className="text-xs text-red-400 mt-3">{denied}</p>}
          </Card>
        ) : !isOwner ? (
          <Card className="p-8 max-w-md mx-auto text-center">
            <h1 className="lp-page-title text-xl mb-1">Access Restricted</h1>
            <p className="text-sm text-neutral-400">
              Signed in as <span className="text-white">{user.email}</span> — this area is only
              available to the site owner.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
              <div className="lp-head-left min-w-0">
                <span className="lp-page-eyebrow">Owner</span>
                <h1 className="lp-page-title">Submissions</h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Live feed of analyzed resumes from signed-in users
                </p>
              </div>
              {stats && (
                <div className="flex gap-3">
                  <div className="glass-card px-4 py-2.5 rounded-xl">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">Total</p>
                    <p className="text-lg font-bold text-white">{stats.count}</p>
                  </div>
                  <div className="glass-card px-4 py-2.5 rounded-xl">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">Avg score</p>
                    <p className="text-lg font-bold text-brand-400">{stats.avg}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {denied && (
                <div className="glass-card p-4 rounded-xl border border-amber-500/25">
                  <p className="text-xs text-amber-300 font-medium mb-1">Read failed — check database rules</p>
                  <p className="text-xs text-neutral-400 break-words">{denied}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    Firebase Realtime Database → Rules mein <code className="text-amber-200">firebase.rules.json</code> ka content
                    paste karke Publish karo (submissions node ko owner emails read kar sakein).
                  </p>
                </div>
              )}
              {subs.map((s) => (
                <div key={s.key} className="glass-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="hidden sm:block shrink-0">
                        <ScoreRing value={s.overallScore} size={56} strokeWidth={5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">{s.fileName}</h3>
                        <p className="text-xs text-neutral-500">
                          {s.displayName || 'Hirely user'} · {s.email}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {new Date(s.createdAt).toLocaleString()} · {s.sections} sections
                          {s.jobMatchScore != null && <> · <span className="text-brand-400">Job match {s.jobMatchScore}%</span></>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:ml-4">
                      <div className="sm:hidden">
                        <ScoreRing value={s.overallScore} size={48} strokeWidth={4} />
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">Score</p>
                        <p className="text-lg font-bold text-white">{s.overallScore}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">ATS</p>
                        <p className="text-sm font-medium text-neutral-300">{s.atsScore}</p>
                      </div>
                      {s.jobCompany && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-neutral-500">Target</p>
                          <p className="text-sm font-medium text-neutral-300">{s.jobCompany}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(s.key)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                        title="Delete submission"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {subs.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <p className="text-sm text-neutral-500">
                    No submissions yet. Resumes analyzed by signed-in users will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}