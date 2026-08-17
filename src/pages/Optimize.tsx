import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAnalysis, updateAnalysis, deleteAnalysis } from '../lib/storage'
import { matchJob } from '../lib/ai'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Alert } from '../components/ui/Alert'
import { LoadingOverlay } from '../components/ui/Spinner'
import { LOADING_MESSAGES } from '../config'
import type { AnalysisResult } from '../types'

export function Optimize() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => (id ? getAnalysis(id) : null),
  )
  const [jobDescription, setJobDescription] = useState(analysis?.jobTarget?.jobDescription || '')
  const [jobTitle, setJobTitle] = useState(analysis?.jobTarget?.title || '')
  const [company, setCompany] = useState(analysis?.jobTarget?.company || '')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleClearJobTarget = useCallback(() => {
    if (!analysis) return
    const updated = updateAnalysis(analysis.id, {
      jobTarget: undefined,
      jobMatch: undefined,
    })
    if (updated) setAnalysis(updated)
    setJobDescription('')
    setJobTitle('')
    setCompany('')
  }, [analysis])

  const handleAnalyze = useCallback(async () => {
    if (!analysis || !jobDescription.trim()) return
    setLoading(true)
    setError(null)

    try {
      setLoadingMsg(LOADING_MESSAGES[0])
      setLoadingProgress(10)

      const response = await matchJob({
        resumeText: analysis.resumeText,
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
      })

      setLoadingProgress(80)
      setLoadingMsg(LOADING_MESSAGES[5])

      const updated = updateAnalysis(analysis.id, {
        jobMatch: response.jobMatch,
        jobTarget: {
          jobDescription: jobDescription.trim(),
          title: jobTitle.trim() || undefined,
          company: company.trim() || undefined,
        },
      })

      setAnalysis(updated)
      setLoadingProgress(100)
      navigate(`/analyze/${analysis.id}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [analysis, jobDescription, jobTitle, company, navigate])

  if (!analysis) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <EmptyState
          title="Analysis not found"
          description="Upload and analyze a resume first, then optimize it."
          action={{ label: 'Upload Resume', onClick: () => navigate('/upload') }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            to={`/analyze/${analysis.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analysis
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Optimize for a Job</h1>
          <p className="mt-3 text-lg text-neutral-400">
            Paste a job description to get a match score and targeted improvements.
          </p>
        </div>

        {loading ? (
          <Card className="p-6">
            <LoadingOverlay
              messages={LOADING_MESSAGES}
              currentMessage={loadingMsg}
              progress={loadingProgress}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="error" title="Analysis Failed">
                {error}
              </Alert>
            )}

            <Card className="p-6 space-y-4">
              {analysis.jobTarget?.jobDescription && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-white/[0.05]">
                  <span className="text-sm text-neutral-400">Current job target: <span className="text-white">{analysis.jobTarget.title || 'Untitled'}</span>{analysis.jobTarget.company ? ` at ${analysis.jobTarget.company}` : ''}</span>
                  <Button variant="danger" size="sm" onClick={handleClearJobTarget}>Remove</Button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Job Title <span className="text-neutral-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Company <span className="text-neutral-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, Coinbase"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Job Description <span className="text-brand-400">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description here..."
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent resize-y transition-all"
                />
              </div>
            </Card>

            <Button
              onClick={handleAnalyze}
              disabled={!jobDescription.trim()}
              size="lg"
              className="w-full"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run Job Match Analysis
            </Button>

            {analysis.jobTarget?.jobDescription && (
              <div className="text-center">
                <p className="text-xs text-neutral-600">
                  This will update the existing job match results.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
