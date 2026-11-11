import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  listAnalyses,
  deleteAnalysis,
  listVersions,
  saveVersion,
  updateVersion,
  deleteVersion,
  duplicateVersion,
  listApplications,
  saveApplication,
  updateApplication,
  deleteApplication,
} from '../lib/storage'
import type {
  AnalysisResult,
  ResumeVersion,
  JobApplication,
  ApplicationStatus,
} from '../types'
import { generatePdfResume, printResumePreview } from '../lib/pdfGenerator'
import { getJobRecommendationsForResume } from '../lib/jobMatcher'
import { CURATED_JOB_OPENINGS } from '../lib/jobOpenings'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { LinkedInImportModal } from '../components/upload/LinkedInImportModal'
import {
  AwardIcon,
  BookmarkIcon,
  DollarSignIcon,
  FolderIcon,
  MessageSquareIcon,
  SendIcon,
  StarIcon,
  TargetIcon,
} from '../components/ui/Icons'

const MAIN_TABS = [
  { id: 'resumes', label: 'Resumes & Analyses' },
  { id: 'versions', label: 'Saved Versions' },
  { id: 'progress', label: 'Progress & Pipeline' },
]

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'job-matched', label: 'Job Matched' },
  { id: 'no-job', label: 'No Job Target' },
]

const PIPELINE_COLUMNS: Array<{
  status: ApplicationStatus
  label: string
  icon: typeof BookmarkIcon
  color: string
}> = [
  { status: 'saved', label: 'Saved', icon: BookmarkIcon, color: 'border-slate-500/30' },
  { status: 'applied', label: 'Applied', icon: SendIcon, color: 'border-blue-500/30' },
  { status: 'interviewing', label: 'Interviewing', icon: MessageSquareIcon, color: 'border-amber-500/30' },
  { status: 'offer', label: 'Offer Received', icon: AwardIcon, color: 'border-emerald-500/30' },
  { status: 'rejected', label: 'Archived', icon: FolderIcon, color: 'border-rose-500/30' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [activeMainTab, setActiveMainTab] = useState(
    initialTab && ['resumes', 'versions', 'progress'].includes(initialTab) ? initialTab : 'resumes',
  )

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['resumes', 'versions', 'progress'].includes(tabParam)) {
      setActiveMainTab(tabParam)
    }
  }, [searchParams])
  
  // Analyses state
  const [allAnalyses, setAllAnalyses] = useState<AnalysisResult[]>(() => listAnalyses())
  const [analysisFilter, setAnalysisFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [confirmDeleteAnalysis, setConfirmDeleteAnalysis] = useState<string | null>(null)
  const [linkedinModal, setLinkedinModal] = useState(false)

  // Versions state
  const [versions, setVersions] = useState<ResumeVersion[]>(() => listVersions())
  const [editingVersion, setEditingVersion] = useState<ResumeVersion | null>(null)
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionFormName, setVersionFormName] = useState('')
  const [versionFormMarkdown, setVersionFormMarkdown] = useState('')

  // Applications / Progress state
  const [applications, setApplications] = useState<JobApplication[]>(() => listApplications())

  useEffect(() => {
    const syncApps = () => setApplications(listApplications())
    window.addEventListener('hirely:applications-changed', syncApps)
    return () => window.removeEventListener('hirely:applications-changed', syncApps)
  }, [])
  const [appModalOpen, setAppModalOpen] = useState(false)
  const [appForm, setAppForm] = useState<{
    company: string
    position: string
    location: string
    salary: string
    url: string
    status: ApplicationStatus
    notes: string
  }>({
    company: '',
    position: '',
    location: '',
    salary: '',
    url: '',
    status: 'saved',
    notes: '',
  })

  // Top best fit job alert
  const topJobAlert = useMemo(() => {
    if (!allAnalyses.length) return null
    const topResume = allAnalyses[0]
    const recs = getJobRecommendationsForResume(topResume, CURATED_JOB_OPENINGS)
    return recs.find((r) => r.fitBadge === 'Best Fit For You') || recs[0] || null
  }, [allAnalyses])

  // Filtered analyses
  const filteredAnalyses = useMemo(() => {
    let list = [...allAnalyses]
    if (analysisFilter === 'job-matched') {
      list = list.filter((r) => r.jobMatch)
    } else if (analysisFilter === 'no-job') {
      list = list.filter((r) => !r.jobMatch)
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.scores.overall ?? 0) - (a.scores.overall ?? 0))
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  }, [allAnalyses, analysisFilter, sortBy])

  // Career Readiness & Milestones
  const progressMetrics = useMemo(() => {
    const hasBase = allAnalyses.length > 0
    const hasHighAts = allAnalyses.some((a) => a.ats.score >= 75)
    const hasJobMatch = allAnalyses.some((a) => Boolean(a.jobMatch))
    const hasVersions = versions.length > 0
    const hasApplications = applications.length > 0
    const hasInterview = applications.some((a) => a.status === 'interviewing' || a.status === 'offer')

    const milestones = [
      { id: '1', title: 'Base Resume Analyzed', desc: 'Uploaded and extracted full work experience', done: hasBase },
      { id: '2', title: 'ATS Score ≥ 75', desc: 'Achieved strong ATS compliance score', done: hasHighAts },
      { id: '3', title: 'Job-Tailored Optimization', desc: 'Ran AI match against target position', done: hasJobMatch },
      { id: '4', title: 'Saved Custom Versions', desc: 'Created specialized role variants', done: hasVersions },
      { id: '5', title: 'Pipeline Applications', desc: 'Tracked job applications in pipeline', done: hasApplications },
      { id: '6', title: 'Interview Stage Reached', desc: 'Advanced to interview or offer stage', done: hasInterview },
    ]

    const completedCount = milestones.filter((m) => m.done).length
    const scorePct = Math.round((completedCount / milestones.length) * 100)

    return { milestones, completedCount, scorePct }
  }, [allAnalyses, versions, applications])

  // Analysis Delete
  const handleDeleteAnalysis = (id: string) => {
    deleteAnalysis(id)
    setAllAnalyses(listAnalyses())
    setConfirmDeleteAnalysis(null)
  }

  // Version Handlers
  const handleSaveVersionForm = () => {
    if (!versionFormName.trim() || !versionFormMarkdown.trim()) return
    if (editingVersion) {
      updateVersion(editingVersion.id, {
        name: versionFormName.trim(),
        markdown: versionFormMarkdown,
      })
    } else {
      saveVersion({
        name: versionFormName.trim(),
        markdown: versionFormMarkdown,
        sourceAnalysisId: allAnalyses[0]?.id || 'custom',
      })
    }
    setVersions(listVersions())
    setVersionModalOpen(false)
    setEditingVersion(null)
  }

  const handleDuplicateVersion = (id: string) => {
    duplicateVersion(id)
    setVersions(listVersions())
  }

  const handleDeleteVersion = (id: string) => {
    deleteVersion(id)
    setVersions(listVersions())
  }

  const handleDownloadVersionPdf = (v: ResumeVersion) => {
    generatePdfResume(v.markdown, `${v.name.replace(/\s+/g, '_')}.pdf`, v.name)
  }

  const handleOpenEditVersion = (v: ResumeVersion) => {
    setEditingVersion(v)
    setVersionFormName(v.name)
    setVersionFormMarkdown(v.markdown)
    setVersionModalOpen(true)
  }

  const handleCreateNewVersion = () => {
    setEditingVersion(null)
    setVersionFormName(`Custom Resume v${versions.length + 1}`)
    const starter = allAnalyses[0]?.rewritten?.markdown || allAnalyses[0]?.resumeText || '# Candidate Name\n\n## Experience\n'
    setVersionFormMarkdown(starter)
    setVersionModalOpen(true)
  }

  // Application Handlers
  const handleSaveApplication = () => {
    if (!appForm.company.trim() || !appForm.position.trim()) return
    saveApplication({
      company: appForm.company.trim(),
      position: appForm.position.trim(),
      location: appForm.location.trim() || undefined,
      salary: appForm.salary.trim() || undefined,
      url: appForm.url.trim() || undefined,
      status: appForm.status,
      notes: appForm.notes.trim() || undefined,
      resumeId: allAnalyses[0]?.id,
    })
    setApplications(listApplications())
    setAppModalOpen(false)
    setAppForm({
      company: '',
      position: '',
      location: '',
      salary: '',
      url: '',
      status: 'saved',
      notes: '',
    })
  }

  const handleUpdateAppStatus = (id: string, nextStatus: ApplicationStatus) => {
    updateApplication(id, { status: nextStatus })
    setApplications(listApplications())
  }

  const handleDeleteApp = (id: string) => {
    deleteApplication(id)
    setApplications(listApplications())
  }

  return (
    <div className="min-h-[85vh] relative pt-20 pb-16">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8">
        
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="lp-head-left min-w-0">
            <span className="lp-page-eyebrow">Dashboard</span>
            <h1 className="lp-page-title">Career Workspace</h1>
            <p className="text-sm text-fg-muted mt-1">
              Manage your resumes, track optimization progress, and monitor job applications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLinkedinModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-xs font-semibold text-fg-strong transition-all hover:border-[#0A66C2]/50 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
              Import LinkedIn
            </button>
            <Link
              to="/jobs"
              className="glass-button inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-fg-strong rounded-xl hover:text-brand-300"
            >
              <StarIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Matched Jobs</span>
            </Link>
            <Link
              to="/upload"
              className="glass-button inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-fg-strong rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </Link>
          </div>
        </div>

        {/* Most Important Alert: Best Fit Opening Notification */}
        {topJobAlert && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-surface to-brand-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <TargetIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    New Opening Alert · Best Fit For You
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                    {topJobAlert.score}% Match
                  </span>
                  {topJobAlert.opening.source === 'LinkedIn' && (
                    <span className="px-2 py-0.2 rounded-md bg-[#0A66C2]/20 text-[#70b5f9] text-[10px] font-bold flex items-center gap-1">
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                      LinkedIn
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-fg-strong truncate mt-0.5">
                  {topJobAlert.opening.title} @ {topJobAlert.opening.company}
                </p>
                <p className="text-xs text-fg-muted truncate">
                  {topJobAlert.matchReason}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/jobs"
                className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-semibold transition-colors"
              >
                View Matches →
              </Link>
            </div>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex border-b border-line gap-4 sm:gap-6 mb-7 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          {MAIN_TABS.map((tab) => {
            const isActive = activeMainTab === tab.id
            const badgeCount =
              tab.id === 'resumes'
                ? allAnalyses.length
                : tab.id === 'versions'
                ? versions.length
                : applications.length
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveMainTab(tab.id)
                  setSearchParams({ tab: tab.id })
                }}
                className={`pb-3.5 transition-all flex items-center gap-2 text-sm ${
                  isActive
                    ? 'text-brand-400 border-b-2 border-brand-500 font-bold'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                {tab.label}
                {badgeCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-subtle text-fg-muted'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── TAB 1: RESUMES & ANALYSES ── */}
        {activeMainTab === 'resumes' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex gap-1.5 bg-surface border border-line p-1 rounded-xl text-xs overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAnalysisFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      analysisFilter === f.id
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-fg-muted hover:text-fg-strong'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'date' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                >
                  Sort by Date
                </Button>
                <Button
                  variant={sortBy === 'score' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSortBy('score')}
                >
                  Sort by Score
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredAnalyses.map((r) => (
                <div key={r.id} className="group">
                  <div className="glass-card p-4 sm:p-5 hover:border-brand-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link to={`/analyze/${r.id}`} className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                        <div className="shrink-0">
                          <ScoreRing value={r.scores.overall} size={48} strokeWidth={5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-fg-strong truncate group-hover:text-brand-400 transition-colors">
                            {r.fileName}
                          </h3>
                          <p className="text-xs text-fg-muted mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                            {r.extracted.detectedSections.length} sections · ATS Score: {r.ats.score}/100
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.extracted.detectedSections.slice(0, 4).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full bg-chip text-[10px] text-fg-muted">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>

                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-line">
                        {r.jobMatch && (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] text-fg-muted">Job Match</p>
                            <p className="text-base font-bold text-brand-400">{r.jobMatch.score}%</p>
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => generatePdfResume(r.resumeText, `${r.fileName}-hirely.pdf`, r.extracted.name)}
                          title="Direct Download PDF"
                        >
                          Download PDF
                        </Button>
                        <Link
                          to={`/analyze/${r.id}`}
                          className="glass-button inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-fg-strong rounded-xl hover:text-brand-300"
                        >
                          View Report →
                        </Link>
                        <button
                          onClick={() => setConfirmDeleteAnalysis(r.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-fg-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAnalyses.length === 0 && (
                <EmptyState
                  title="No analyses found"
                  description="Upload a resume or import from LinkedIn to get started."
                  action={{ label: 'Upload Resume', onClick: () => navigate('/upload') }}
                />
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: SAVED RESUME VERSIONS ── */}
        {activeMainTab === 'versions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-fg-strong">Multiple Tailored Resume Versions</h3>
                <p className="text-xs text-fg-muted">
                  Keep specialized resume versions for different roles, industries, or companies.
                </p>
              </div>
              <Button size="sm" onClick={handleCreateNewVersion}>
                + Create New Version
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {versions.map((ver) => (
                <div key={ver.id} className="glass-card p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-fg-strong truncate">{ver.name}</h4>
                      <span className="text-[10px] text-fg-muted bg-surface-subtle px-2 py-0.5 rounded-md border border-line">
                        Updated {new Date(ver.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-fg-muted mt-2 line-clamp-3 bg-surface p-2.5 rounded-xl border border-line">
                      {ver.markdown.slice(0, 200)}...
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
                    <div className="flex items-center gap-1.5">
                      <Button variant="secondary" size="sm" onClick={() => handleDownloadVersionPdf(ver)}>
                        Download PDF
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => printResumePreview(ver.markdown, ver.name)}>
                        Preview
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEditVersion(ver)}>
                        Edit
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateVersion(ver.id)}
                        className="p-1.5 text-xs text-fg-muted hover:text-fg-strong rounded-lg hover:bg-surface-subtle"
                        title="Duplicate Version"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVersion(ver.id)}
                        className="p-1.5 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10"
                        title="Delete Version"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {versions.length === 0 && (
              <EmptyState
                title="No saved versions yet"
                description="Save different versions of your resume tailored for Frontend, Backend, Full-Stack, or specific companies."
                action={{ label: 'Create First Version', onClick: handleCreateNewVersion }}
              />
            )}
          </div>
        )}

        {/* ── TAB 3: PROGRESS TRACKING & APPLICATION PIPELINE ── */}
        {activeMainTab === 'progress' && (
          <div className="space-y-8">
            
            {/* Career Readiness Progress Overview */}
            <div className="p-6 rounded-3xl bg-surface border border-line grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-5">
                <ScoreRing value={progressMetrics.scorePct} size={84} strokeWidth={6} />
                <div>
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wider">Career Readiness</span>
                  <h3 className="text-2xl font-bold text-fg-strong mt-0.5">{progressMetrics.scorePct}% Ready</h3>
                  <p className="text-xs text-brand-400">
                    {progressMetrics.completedCount} of {progressMetrics.milestones.length} milestones complete
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {progressMetrics.milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${
                      m.done
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-surface-subtle border-line text-fg-muted'
                    }`}
                  >
                    <span className="text-base font-bold">{m.done ? '✓' : '○'}</span>
                    <div>
                      <p className="font-semibold text-fg-strong">{m.title}</p>
                      <p className="text-[11px] text-fg-muted">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Pipeline Kanban */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-fg-strong">Job Application Pipeline</h3>
                  <p className="text-xs text-fg-muted">
                    Track your submissions across stages from Saved to Interview and Offer.
                  </p>
                </div>
                <Button size="sm" onClick={() => setAppModalOpen(true)} className="w-fit shrink-0">
                  + Track Application
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {PIPELINE_COLUMNS.map((col) => {
                  const ColIcon = col.icon
                  const items = applications.filter((a) => a.status === col.status)
                  return (
                    <div
                      key={col.status}
                      className={`p-3.5 rounded-2xl bg-surface/60 border ${col.color} flex flex-col min-h-[160px] sm:min-h-[260px] xl:min-h-[320px]`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                        <span className="text-xs font-bold text-fg-strong flex items-center gap-1.5">
                          <ColIcon className="w-3.5 h-3.5 text-brand-400" />
                          <span>{col.label}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-line text-fg-muted">
                          {items.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto">
                        {items.map((app) => (
                          <div
                            key={app.id}
                            className="p-3 rounded-xl bg-surface border border-line shadow-xs space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h5 className="font-bold text-fg-strong truncate">{app.position}</h5>
                                <p className="text-[11px] text-brand-400 font-semibold truncate">@{app.company}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteApp(app.id)}
                                className="text-fg-faint hover:text-red-400 p-1"
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>

                            {app.salary && (
                              <p className="text-[10px] text-fg-muted inline-flex items-center gap-1">
                                <DollarSignIcon className="w-3 h-3 text-emerald-400" />
                                <span>{app.salary}</span>
                              </p>
                            )}

                            {app.notes && (
                              <p className="text-[11px] text-fg-muted line-clamp-2 bg-surface-subtle p-1.5 rounded-md">
                                {app.notes}
                              </p>
                            )}

                            {/* Move status picker */}
                            <div className="pt-1.5 border-t border-line/60 flex items-center justify-between">
                              <span className="text-[10px] text-fg-faint">Move to:</span>
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value as ApplicationStatus)}
                                className="text-[10px] bg-surface-subtle border border-line rounded px-1.5 py-0.5 text-fg-strong focus:outline-none"
                              >
                                {PIPELINE_COLUMNS.map((c) => (
                                  <option key={c.status} value={c.status}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}

                        {items.length === 0 && (
                          <div className="h-24 flex items-center justify-center text-center text-[11px] text-fg-faint border border-dashed border-line/50 rounded-xl">
                            Empty
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Delete Analysis Modal */}
      <Modal
        open={Boolean(confirmDeleteAnalysis)}
        onClose={() => setConfirmDeleteAnalysis(null)}
        title="Delete Analysis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDeleteAnalysis(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteAnalysis && handleDeleteAnalysis(confirmDeleteAnalysis)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">
          Are you sure you want to delete this analysis? This action cannot be undone.
        </p>
      </Modal>

      {/* Resume Version Edit / Create Modal */}
      <Modal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title={editingVersion ? `Edit: ${editingVersion.name}` : 'Create New Resume Version'}
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button variant="secondary" onClick={() => setVersionModalOpen(false)}>
              Cancel
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => printResumePreview(versionFormMarkdown, versionFormName)}
              >
                Print / Preview
              </Button>
              <Button onClick={handleSaveVersionForm}>
                Save Version
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Version Name</label>
            <input
              type="text"
              value={versionFormName}
              onChange={(e) => setVersionFormName(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer (Target: Stripe)"
              className="w-full px-3.5 py-2 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">
              Resume Markdown Content
            </label>
            <textarea
              value={versionFormMarkdown}
              onChange={(e) => setVersionFormMarkdown(e.target.value)}
              rows={16}
              className="w-full p-4 text-xs font-mono bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500 resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      </Modal>

      {/* Add Job Application Modal */}
      <Modal
        open={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        title="Track Job Application"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setAppModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApplication}>
              Save Application
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Company *</label>
            <input
              type="text"
              value={appForm.company}
              onChange={(e) => setAppForm({ ...appForm, company: e.target.value })}
              placeholder="e.g. Stripe, Linear, Vercel"
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Position Title *</label>
            <input
              type="text"
              value={appForm.position}
              onChange={(e) => setAppForm({ ...appForm, position: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-strong mb-1">Location</label>
              <input
                type="text"
                value={appForm.location}
                onChange={(e) => setAppForm({ ...appForm, location: e.target.value })}
                placeholder="e.g. Remote, SF"
                className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg-strong mb-1">Salary Range</label>
              <input
                type="text"
                value={appForm.salary}
                onChange={(e) => setAppForm({ ...appForm, salary: e.target.value })}
                placeholder="e.g. $150k - $180k"
                className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Pipeline Stage</label>
            <select
              value={appForm.status}
              onChange={(e) => setAppForm({ ...appForm, status: e.target.value as ApplicationStatus })}
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong"
            >
              {PIPELINE_COLUMNS.map((col) => (
                <option key={col.status} value={col.status}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Application URL</label>
            <input
              type="text"
              value={appForm.url}
              onChange={(e) => setAppForm({ ...appForm, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-strong mb-1">Notes / Next Steps</label>
            <textarea
              value={appForm.notes}
              onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
              placeholder="Referral name, interview round date, or key discussion points..."
              rows={3}
              className="w-full px-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg-strong"
            />
          </div>
        </div>
      </Modal>

      {/* LinkedIn Import Modal */}
      <LinkedInImportModal
        open={linkedinModal}
        onClose={() => setLinkedinModal(false)}
      />

    </div>
  )
}
