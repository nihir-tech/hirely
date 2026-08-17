import { useState, useMemo, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAnalysis, updateAnalysis, deleteAnalysis } from '../lib/storage'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Tabs } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Alert } from '../components/ui/Alert'
import { OverviewTab } from '../components/analysis/OverviewTab'
import { StrengthsTab } from '../components/analysis/StrengthsTab'
import { ImprovementsTab } from '../components/analysis/ImprovementsTab'
import { AtsTab } from '../components/analysis/AtsTab'
import { SkillsTab } from '../components/analysis/SkillsTab'
import { JobMatchTab } from '../components/analysis/JobMatchTab'
import { ChangesTab } from '../components/analysis/ChangesTab'
import { rewriteResume as callRewrite } from '../lib/ai'
import type { AnalysisResult } from '../types'
import { REWRITE_LOADING_MESSAGES } from '../config'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'improvements', label: 'Improvements' },
  { id: 'ats', label: 'ATS' },
  { id: 'skills', label: 'Skills' },
  { id: 'job-match', label: 'Job Match' },
  { id: 'changes', label: 'Suggested Changes' },
]

export function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => (id ? getAnalysis(id) : null),
  )
  const [rewriteModal, setRewriteModal] = useState(false)
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewriteMsg, setRewriteMsg] = useState('')
  const [rewriteContent, setRewriteContent] = useState('')
  const [rewriteNotes, setRewriteNotes] = useState<string[]>([])

  const tabBadges = useMemo(() => {
    if (!analysis) return {}
    return {
      strengths: analysis.strengths.length || undefined,
      improvements: analysis.problems.length || undefined,
      'job-match': analysis.jobMatch?.score != null ? `${analysis.jobMatch.score}%` : undefined,
    }
  }, [analysis])

  const handleDelete = useCallback(() => {
    if (!analysis) return
    deleteAnalysis(analysis.id)
    navigate('/dashboard')
  }, [analysis, navigate])

  const handleClearJobTarget = useCallback(() => {
    if (!analysis) return
    const updated = updateAnalysis(analysis.id, {
      jobTarget: undefined,
      jobMatch: undefined,
    })
    if (updated) setAnalysis(updated)
  }, [analysis])

  const handleChangeUpdate = useCallback(
    (changeId: string, accepted: boolean | null) => {
      if (!analysis?.jobMatch) return
      const changes = analysis.jobMatch.changes.map((c) =>
        c.id === changeId ? { ...c, accepted } : c,
      )
      const updated = { ...analysis.jobMatch, changes }
      updateAnalysis(analysis.id, { jobMatch: updated })
      setAnalysis({ ...analysis, jobMatch: updated })
    },
    [analysis],
  )

  const handleEditChange = useCallback(
    (changeId: string, suggested: string) => {
      if (!analysis?.jobMatch) return
      const changes = analysis.jobMatch.changes.map((c) =>
        c.id === changeId ? { ...c, suggested, accepted: true } : c,
      )
      const updated = { ...analysis.jobMatch, changes }
      updateAnalysis(analysis.id, { jobMatch: updated })
      setAnalysis({ ...analysis, jobMatch: updated })
    },
    [analysis],
  )

  const handleRewrite = useCallback(
    async (focus: 'general' | 'job') => {
      if (!analysis) return
      setRewriteLoading(true)
      setRewriteModal(true)
      setRewriteContent('')
      setRewriteNotes([])
      try {
        setRewriteMsg(REWRITE_LOADING_MESSAGES[0])
        const res = await callRewrite({
          resumeText: analysis.resumeText,
          focus,
          jobDescription: analysis.jobTarget?.jobDescription,
          company: analysis.jobTarget?.company,
          jobTitle: analysis.jobTarget?.title,
        })
        setRewriteContent(res.rewritten.markdown)
        setRewriteNotes(res.rewritten.notes)
      } catch (err) {
        setRewriteNotes([err instanceof Error ? err.message : 'Failed to generate improved resume.'])
      } finally {
        setRewriteLoading(false)
      }
    },
    [analysis],
  )

  const handleSaveRewrite = useCallback(() => {
    if (!analysis) return
    const rewritten = {
      markdown: rewriteContent,
      notes: rewriteNotes,
      createdAt: new Date().toISOString(),
    }
    updateAnalysis(analysis.id, { rewritten })
    setAnalysis({ ...analysis, rewritten })
    setRewriteModal(false)
  }, [analysis, rewriteContent, rewriteNotes])

  const handleDownload = useCallback(() => {
    if (!analysis?.rewritten) return
    const blob = new Blob([analysis.rewritten.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.fileName.replace(/\.[^.]+$/, '')}-improved.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [analysis])

  if (!analysis) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <EmptyState
          title="Analysis not found"
          description="This analysis may have been deleted or the link is invalid."
          action={{ label: 'Go to Dashboard', onClick: () => navigate('/dashboard') }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] relative pt-20">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
              {analysis.fileName}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Analyzed {new Date(analysis.createdAt).toLocaleDateString()} ·{' '}
              {analysis.extracted.detectedSections.length} sections detected
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/optimize/${analysis.id}`}
              className="glass-button inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Optimize for Job
            </Link>
            {analysis.jobTarget?.jobDescription && (
              <Button variant="secondary" size="sm" onClick={handleClearJobTarget}>
                Clear Job Target
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRewrite(analysis.jobTarget?.jobDescription ? 'job' : 'general')}
            >
              Generate Improved Resume
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 flex flex-col items-center">
            <ScoreRing value={analysis.scores.overall} size={100} strokeWidth={7} label="Overall Score" />
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <ScoreRing value={analysis.ats.score} size={100} strokeWidth={7} label="ATS Score" sublabel="AI estimate" />
          </Card>
          {analysis.jobMatch ? (
            <Card className="p-6 flex flex-col items-center">
              <ScoreRing
                value={analysis.jobMatch.score}
                size={100}
                strokeWidth={7}
                label="Job Match"
                sublabel={analysis.jobTarget?.title || ''}
              />
            </Card>
          ) : (
            <Card className="p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-neutral-500 text-center">No job target yet</p>
              <Link
                to={`/optimize/${analysis.id}`}
                className="mt-2 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Add one →
              </Link>
            </Card>
          )}
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} badges={tabBadges} />

        <div className="mt-8">
          {tab === 'overview' && <OverviewTab analysis={analysis} />}
          {tab === 'strengths' && <StrengthsTab analysis={analysis} />}
          {tab === 'improvements' && <ImprovementsTab analysis={analysis} />}
          {tab === 'ats' && <AtsTab analysis={analysis} />}
          {tab === 'skills' && <SkillsTab analysis={analysis} />}
          {tab === 'job-match' && <JobMatchTab analysis={analysis} />}
          {tab === 'changes' && (
            <ChangesTab
              analysis={analysis}
              onUpdate={handleChangeUpdate}
              onEdit={handleEditChange}
            />
          )}
        </div>
      </div>

      {/* Rewrite Modal */}
      <Modal
        open={rewriteModal}
        onClose={() => !rewriteLoading && setRewriteModal(false)}
        title="Improved Resume"
        size="xl"
        footer={
          rewriteContent && !rewriteLoading ? (
            <>
              <Button variant="secondary" onClick={() => setRewriteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownload}>Download</Button>
              <Button onClick={handleSaveRewrite}>Save Version</Button>
            </>
          ) : undefined
        }
      >
        {rewriteLoading ? (
          <div className="py-8 text-center">
            <Spinner size="lg" label={rewriteMsg || 'Generating...'} />
            <p className="mt-4 text-sm text-neutral-500">This may take up to a minute.</p>
          </div>
        ) : rewriteContent ? (
          <div className="space-y-4">
            <Alert variant="warning" title="Review for accuracy">
              This AI-generated content preserves your original facts. Please review it for accuracy
              before using.
            </Alert>
            <textarea
              value={rewriteContent}
              onChange={(e) => setRewriteContent(e.target.value)}
              className="w-full h-[50vh] p-4 text-sm font-mono text-white bg-surface border border-white/[0.08] rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent"
              spellCheck={false}
            />
            {rewriteNotes.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-subtle border border-white/[0.05]">
                <p className="text-xs font-medium text-neutral-400 mb-2">Notes:</p>
                <ul className="space-y-1">
                  {rewriteNotes.map((n, i) => (
                    <li key={i} className="text-xs text-neutral-500">
                      • {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : rewriteNotes.length > 0 && !rewriteContent ? (
          <div className="py-8 text-center">
            <p className="text-red-400 mb-4">{rewriteNotes[0]}</p>
            <Button variant="secondary" onClick={() => handleRewrite(analysis.jobTarget?.jobDescription ? 'job' : 'general')}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-neutral-500">Failed to generate improved resume. Please try again.</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
