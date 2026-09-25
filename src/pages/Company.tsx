import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useAuth } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Spinner, LoadingOverlay } from '../components/ui/Spinner'
import { PageHead } from '../components/layout/PageHead'
import { GoogleIcon } from '../components/ui/GoogleIcon'
import { extractResumeText } from '../lib/parsers'
import { rankCandidates } from '../lib/ai'
import { validateFile, formatFileSize } from '../lib/validation'
import {
  listCompanyJobs,
  getCompanyJob,
  saveCompanyJob,
  updateCompanyJob,
  deleteCompanyJob,
} from '../lib/storage'
import type { CandidateRank, CompanyJob } from '../types'

const MAX_BATCH = 25
const RANK_MESSAGES = [
  'Reading candidate resumes...',
  "Extracting each candidate's details...",
  'Comparing against the job description...',
  'Scoring and assigning priorities...',
  'Generating the shortlist...',
]

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface PendingFile {
  id: string
  file: File
}

function PriorityBadge({ priority }: { priority: number }) {
  const label = priority === 1 ? '1st' : priority === 2 ? '2nd' : priority === 3 ? '3rd' : `#${priority}`
  const style =
    priority === 1
      ? 'from-amber-400/30 to-yellow-600/30 text-amber-300 border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
      : priority === 2
        ? 'from-slate-300/20 to-slate-500/20 text-slate-300 border-slate-400/30'
        : priority === 3
          ? 'from-orange-700/25 to-amber-900/25 text-orange-300 border-orange-500/30'
          : 'from-neutral-800/40 to-neutral-700/30 text-neutral-300 border-white/10'
  return (
    <span className={`shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br border font-bold ${style}`}>
      {label}
    </span>
  )
}

function CandidateCard({ rank }: { rank: CandidateRank }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <PriorityBadge priority={rank.priority} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <h3 className="text-base font-semibold text-white truncate">{rank.name || rank.fileName || 'Candidate'}</h3>
            {rank.yearsExperience && (
              <span className="text-xs text-neutral-400">{rank.yearsExperience}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500 mb-2">
            {rank.email && <span className="truncate">{rank.email}</span>}
            {rank.phone && <span>{rank.phone}</span>}
            {rank.location && <span>{rank.location}</span>}
            {rank.linkedin && <span className="truncate">{rank.linkedin}</span>}
          </div>
          {rank.headline && <p className="text-sm text-neutral-300 mb-2">{rank.headline}</p>}
          <p className="text-sm text-neutral-400 mb-3">{rank.matchSummary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {rank.strengths.length > 0 && (
              <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {rank.strengths.map((s) => (
                    <li key={s} className="text-xs text-emerald-200/80 flex gap-1.5">
                      <span aria-hidden="true" className="text-emerald-400 shrink-0">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rank.gaps.length > 0 && (
              <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/15 p-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-1.5">Gaps</p>
                <ul className="space-y-1">
                  {rank.gaps.map((g) => (
                    <li key={g} className="text-xs text-amber-200/80 flex gap-1.5">
                      <span aria-hidden="true" className="text-amber-400 shrink-0">–</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {rank.notableProjects.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-1">Notable</p>
              <ul className="space-y-1">
                {rank.notableProjects.map((p) => (
                  <li key={p} className="text-xs text-neutral-400">{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="text-xl font-bold text-white">{rank.score}</span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">match</span>
        </div>
      </div>
    </Card>
  )
}

export function Company() {
  const { user, loading: authLoading, isCompany, signIn } = useAuth()
  const [savedJobs, setSavedJobs] = useState<CompanyJob[]>([])
  const [draftJobId, setDraftJobId] = useState<string | null>(null)
  const [positionTitle, setPositionTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [ranking, setRanking] = useState<CandidateRank[] | null>(null)
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'ranking'>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [skipped, setSkipped] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [recentlyCopied, setRecentlyCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const refreshSavedJobs = useCallback(() => {
    setSavedJobs(listCompanyJobs())
  }, [])

  useEffect(() => {
    refreshSavedJobs()
  }, [refreshSavedJobs])

  const activeSummary = useMemo(() => {
    if (!ranking || ranking.length === 0) return ''
    return ranking
      .slice(0, 5)
      .map((r) => `${ordinal(r.priority)} ${r.name || r.fileName || 'Candidate'} — ${r.score}% match${r.email ? ` · ${r.email}` : ''}`)
      .join('\n')
  }, [ranking])

  const handleAddFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming) return
      const newest: PendingFile[] = []
      const seen = new Set(files.map((f) => f.file.name))
      const problems: string[] = []

      Array.from(incoming).forEach((file) => {
        if (seen.has(file.name) || newest.some((f) => f.file.name === file.name)) {
          problems.push(`"${file.name}" is already added`)
          return
        }
        const validation = validateFile(file)
        if (validation) {
          problems.push(validation.message)
          return
        }
        newest.push({ id: makeId(), file })
      })

      if (files.length + newest.length > MAX_BATCH) {
        setError(`You can compare up to ${MAX_BATCH} resumes in one batch.`)
        return
      }

      if (problems.length > 0) {
        setNotice(problems.slice(0, 3).join(' · '))
      } else {
        setNotice(null)
      }
      if (newest.length > 0) {
        setFiles((prev) => [...prev, ...newest])
        setNotice(null)
        setError(null)
      }
    },
    [files],
  )

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleAddFiles(e.dataTransfer.files)
    },
    [handleAddFiles],
  )

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const selectJob = useCallback(
    (id: string) => {
      const job = getCompanyJob(id)
      if (!job) return
      setDraftJobId(job.id)
      setPositionTitle(job.positionTitle ?? '')
      setCompanyName(job.company ?? '')
      setJobDescription(job.jobDescription)
      setFiles([])
      setRanking(job.ranking)
      setError(null)
      setNotice(null)
      setSkipped([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [],
  )

  const startNewJob = useCallback(() => {
    setDraftJobId(null)
    setPositionTitle('')
    setCompanyName('')
    setJobDescription('')
    setFiles([])
    setRanking(null)
    setError(null)
    setNotice(null)
    setSkipped([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const runRank = useCallback(async () => {
    if (jobDescription.trim().length < 50) {
      setError('Please paste the full job description (at least 50 characters).')
      return
    }
    if (files.length === 0) {
      setError('Please add at least one resume to compare.')
      return
    }
    if (!user) return

    setPhase('parsing')
    setError(null)
    setNotice(null)
    setRanking(null)
    setSkipped([])

    const parsed: { id: string; fileName: string; text: string }[] = []
    const failed: string[] = []

    for (let i = 0; i < files.length; i++) {
      const { id, file } = files[i]
      setMessage(`Reading resume ${i + 1} of ${files.length} — ${file.name}`)
      setProgress(Math.round((i / files.length) * 55))
      const result = await extractResumeText(file)
      if (result.error || !result.text) {
        failed.push(file.name)
        continue
      }
      parsed.push({ id, fileName: file.name, text: result.text })
    }

    if (parsed.length === 0) {
      setError('None of the files could be read. Make sure each file is a valid PDF, PNG, JPG, or WebP with readable text.')
      setPhase('idle')
      return
    }
    if (failed.length > 0) {
      setSkipped(failed)
    }

    try {
      setPhase('ranking')
      setMessage(RANK_MESSAGES[2])
      setProgress(60)

      const response = await rankCandidates({
        jobTitle: positionTitle.trim() || undefined,
        company: companyName.trim() || undefined,
        jobDescription: jobDescription.trim(),
        resumes: parsed,
      })

      const sorted = [...response.ranking].sort((a, b) => a.priority - b.priority)
      setRanking(sorted)
      setProgress(100)

      const jobData = {
        positionTitle: positionTitle.trim() || undefined,
        company: companyName.trim() || undefined,
        jobDescription: jobDescription.trim(),
        files: parsed.map((p) => ({ id: p.id, fileName: p.fileName })),
        ranking: sorted,
      }

      if (draftJobId) {
        const existing = getCompanyJob(draftJobId)
        if (existing) {
          updateCompanyJob(draftJobId, jobData)
          setDraftJobId(draftJobId)
        } else {
          const job = saveCompanyJob(jobData)
          setDraftJobId(job.id)
        }
      } else {
        const job = saveCompanyJob(jobData)
        setDraftJobId(job.id)
      }
      refreshSavedJobs()
      setPhase('idle')
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : 'Failed to rank candidates. Please try again.'
      setError(messageText)
      setPhase('idle')
    }
  }, [jobDescription, files, user, draftJobId, positionTitle, companyName, refreshSavedJobs])

  const handleDeleteJob = useCallback(
    (id: string, e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      deleteCompanyJob(id)
      refreshSavedJobs()
      if (draftJobId === id) startNewJob()
    },
    [refreshSavedJobs, draftJobId, startNewJob],
  )

  const copySummary = useCallback(async () => {
    if (!activeSummary) return
    try {
      await navigator.clipboard.writeText(activeSummary)
      setRecentlyCopied(true)
      window.setTimeout(() => setRecentlyCopied(false), 2000)
    } catch {
      setNotice('Could not copy to clipboard automatically — select and copy manually.')
    }
  }, [activeSummary])

  const busy = phase !== 'idle'
  const canRank = !busy && files.length > 0 && jobDescription.trim().length >= 50

  return (
    <div className="min-h-[80vh] relative">
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
            <h1 className="lp-page-title text-xl mb-1">Company Access</h1>
            <p className="text-sm text-neutral-400 mb-6">
              This area is for company users. Sign in with the authorized Google account to
              upload candidate resumes and generate a shortlist.
            </p>
            <Button onClick={async () => {
              try {
                await signIn()
              } catch (e) {
                setError((e as Error).message)
              }
            }}>
              <GoogleIcon />
              Sign in with Google
            </Button>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          </Card>
        ) : !isCompany ? (
          <Card className="p-8 max-w-md mx-auto text-center">
            <h1 className="lp-page-title text-xl mb-1">Access Restricted</h1>
            <p className="text-sm text-neutral-400">
              Signed in as <span className="text-white">{user.email}</span> — this tool is only
              available to the authorized company account.
            </p>
          </Card>
        ) : (
          <>
            <PageHead
              eyebrow="Company"
              title={<>Candidate <span className="lp-grad-text">Shortlisting</span></>}
              sub="Upload every resume you received for a position, and get a priority-ranked shortlist of the most eligible candidates."
            />

            {busy ? (
              <Card className="p-6">
                <LoadingOverlay messages={RANK_MESSAGES} currentMessage={message} progress={progress} />
              </Card>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
                  <div className="space-y-6">
                    <Card className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h2 className="text-sm font-semibold text-white">
                          {draftJobId ? 'Edit job & re-rank' : 'New position'}
                        </h2>
                        {draftJobId && (
                          <button onClick={startNewJob} className="text-xs text-neutral-500 hover:text-white transition-colors">
                            + New position
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="cmp-position">
                            Position title
                          </label>
                          <input
                            id="cmp-position"
                            type="text"
                            value={positionTitle}
                            onChange={(e) => setPositionTitle(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="cmp-company">
                            Company
                          </label>
                          <input
                            id="cmp-company"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Inc."
                            className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="cmp-jd">
                          Job description
                        </label>
                        <textarea
                          id="cmp-jd"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the full job posting here — the shortlist is ranked against this."
                          rows={5}
                          className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all resize-y"
                        />
                        <p className="mt-1 text-[11px] text-neutral-600">
                          Rest of the batch re-ranks against this description.
                        </p>
                      </div>
                    </Card>

                    <Card className="p-5 sm:p-6">
                      <h2 className="text-sm font-semibold text-white mb-4">Candidate resumes</h2>

                      <div
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onClick={() => inputRef.current?.click()}
                        className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center cursor-pointer transition-all duration-300 hover:border-brand-500/40 hover:bg-brand-500/[0.03]"
                      >
                        <input
                          ref={inputRef}
                          type="file"
                          accept={'.pdf,.png,.jpg,.jpeg,.webp'}
                          multiple
                          onChange={(e) => { handleAddFiles(e.target.files); e.target.value = '' }}
                          className="sr-only"
                          aria-label="Upload candidate resumes"
                        />
                        <div className="mb-3 p-3 rounded-2xl bg-neutral-800/40 text-neutral-400">
                          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">Drop every resume you received here</p>
                        <p className="text-xs text-neutral-500 mb-3">or <span className="text-brand-400">browse files</span> — add multiple at once (up to {MAX_BATCH})</p>
                        <p className="text-xs text-neutral-600">PDF, PNG, JPG, or WebP — each up to 10 MB</p>
                      </div>

                      {files.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {files.map((f) => (
                            <li key={f.id} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="shrink-0 w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm text-neutral-200 truncate">{f.file.name}</p>
                                  <p className="text-xs text-neutral-500">{formatFileSize(f.file.size)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(f.id)}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                aria-label={`Remove ${f.file.name}`}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>

                    {notice && (
                      <Alert variant="info">
                        {notice}
                      </Alert>
                    )}
                    {skipped.length > 0 && !busy && (
                      <Alert variant="warning" title="Skipped files">
                        <span className="text-neutral-300">
                          {skipped.length} file(s) could not be read and were skipped: {skipped.join(', ')}
                          {' '}The shortlist was generated from the readable resumes.
                        </span>
                      </Alert>
                    )}
                    {error && (
                      <Alert variant="error" title="Something went wrong">
                        {error}
                        <div className="mt-3">
                          <Button variant="secondary" size="sm" onClick={() => setError(null)}>
                            Dismiss
                          </Button>
                        </div>
                      </Alert>
                    )}

                    <Button onClick={() => { void runRank() }} size="lg" className="w-full" disabled={!canRank}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Compare & Rank Candidates
                    </Button>
                    <p className="text-center text-xs text-neutral-600 -mt-2">
                      {files.length > 0
                        ? `${files.length} resume(s) · ${jobDescription.trim().length >= 50 ? 'job ready' : 'paste the job description to start'}`
                        : 'Add resumes and the job description to get started'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card className="p-5">
                      <h2 className="text-sm font-semibold text-white mb-3">Saved shortlists</h2>
                      {savedJobs.length === 0 ? (
                        <p className="text-xs text-neutral-500">No shortlists yet. Run your first comparison to save it here.</p>
                      ) : (
                        <ul className="space-y-2">
                          {savedJobs.map((job) => {
                            const top = job.ranking.slice(0, 1)[0]
                            return (
                              <li key={job.id}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => selectJob(job.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectJob(job.id) }}
                                  className={`group w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                                    draftJobId === job.id
                                      ? 'border-brand-500/40 bg-brand-500/[0.06]'
                                      : 'border-white/5 bg-white/[0.02] hover:border-brand-500/25 hover:bg-brand-500/[0.03]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium text-white truncate">
                                      {job.positionTitle || 'Position'}
                                      {job.company ? ` · ${job.company}` : ''}
                                    </p>
                                    <button
                                      onClick={(e) => handleDeleteJob(job.id, e)}
                                      className="p-1 rounded-md text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                                      aria-label="Delete shortlist"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                  {top && (
                                    <p className="text-xs text-neutral-500 truncate">
                                      Top: {top.name || top.fileName || 'Candidate'} · {top.score}%
                                    </p>
                                  )}
                                  <p className="text-[11px] text-neutral-600 mt-1">
                                    {job.ranking.length} candidate(s) · {new Date(job.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </Card>
                  </div>
                </div>

                {ranking && ranking.length > 0 && (
                  <div ref={resultsRef} className="mt-8">
                    <div className="glass-card p-4 sm:p-5 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h2 className="text-base font-semibold text-white">Eligible candidates — priority order</h2>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Priority 1 is the strongest fit for this job description.
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => { void copySummary() }}>
                          {recentlyCopied ? 'Copied ✓' : 'Copy top-5 summary'}
                        </Button>
                      </div>
                      {activeSummary && (
                        <pre className="text-xs text-neutral-400 whitespace-pre-wrap font-mono bg-black/20 border border-white/5 rounded-lg p-3 hidden sm:block">
                          {activeSummary}
                        </pre>
                      )}
                    </div>

                    <div className="space-y-4">
                      {ranking.map((rank) => (
                        <CandidateCard key={rank.id} rank={rank} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}