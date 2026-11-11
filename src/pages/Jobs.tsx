import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAnalyses, saveApplication, updateAnalysis } from '../lib/storage'
import {
  CURATED_JOB_OPENINGS,
  SURFACED_FEED_STREAM,
  buildLinkedInSearchUrl,
  getStoredFeedOpenings,
  injectFeedOpening,
} from '../lib/jobOpenings'
import { getJobRecommendationsForResume } from '../lib/jobMatcher'
import { EXT_PENDING_MODAL_KEY } from '../lib/extensionBridge'
import type { JobMatchAlert, JobOpening } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Modal } from '../components/ui/Modal'
import { SkillGapRoadmapModal } from '../components/jobs/SkillGapRoadmapModal'
import { InterviewPrepModal } from '../components/jobs/InterviewPrepModal'
import {
  BellIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  DollarSignIcon,
  MapPinIcon,
  PuzzleIcon,
  RefreshCwIcon,
  RocketIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  UsersIcon,
  ZapIcon,
} from '../components/ui/Icons'

export function Jobs() {
  const navigate = useNavigate()
  const resumes = useMemo(() => listAnalyses(), [])
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'best-fit' | 'near-miss' | 'startups' | 'linkedin' | 'remote' | 'engineering' | 'ai'
  >('all')
  const [sortBy, setSortBy] = useState<'match' | 'newest' | 'competition'>('match')
  const [selectedJobAlert, setSelectedJobAlert] = useState<JobMatchAlert | null>(null)
  const [roadmapAlert, setRoadmapAlert] = useState<JobMatchAlert | null>(null)
  const [interviewAlert, setInterviewAlert] = useState<JobMatchAlert | null>(null)
  const [addedAlertId, setAddedAlertId] = useState<string | null>(null)
  const [customLinkedInSearch, setCustomLinkedInSearch] = useState('')

  // Continuous Live Feed Engine State
  const [openingsPool, setOpeningsPool] = useState<JobOpening[]>(() => getStoredFeedOpenings())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date())
  const [newJobNotification, setNewJobNotification] = useState<string | null>(null)
  const [displayLimit, setDisplayLimit] = useState(8)

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0] || null

  // Continuous Auto-Refresh Timer
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastRefreshedAt(new Date())

      // Occasionally surface an unadded opening from the live stream
      const currentIds = new Set(openingsPool.map((j) => j.id))
      const nextUnadded = SURFACED_FEED_STREAM.find((j) => !currentIds.has(j.id))

      if (nextUnadded) {
        injectFeedOpening(nextUnadded)
        setOpeningsPool((prev) => [nextUnadded, ...prev])
        setNewJobNotification(`New match surfaced: ${nextUnadded.title} @ ${nextUnadded.company}`)
        setTimeout(() => setNewJobNotification(null), 5000)
      }
    }, 45000) // every 45s

    return () => clearInterval(interval)
  }, [autoRefresh, openingsPool])

  // Compute matches against the active resume
  const jobAlerts = useMemo(() => {
    if (!activeResume) {
      return openingsPool.map((op) => ({
        opening: op,
        score: 75,
        fitBadge: 'Good Match' as const,
        matchReason: 'Upload or select a resume to get accurate match percentages and custom reasoning.',
        matchingSkills: op.requiredSkills.slice(0, 2),
        missingSkills: op.requiredSkills.slice(2),
        highlightedAdvantages: ['Competitive market opportunity'],
        isNearMiss: false,
        gapSummary: 'Select resume to compute gap',
      }))
    }
    return getJobRecommendationsForResume(activeResume, openingsPool)
  }, [activeResume, openingsPool])

  // Top candidate role & skills for LinkedIn search generator
  const detectedRole =
    activeResume?.jobTarget?.title ||
    activeResume?.extracted.professionalSummary?.split('.')[0] ||
    'Software Engineer'
  const topSkill = activeResume?.skills.detected[0] || 'React'

  // Filtered & Ranked jobs
  const filteredAlerts = useMemo(() => {
    const list = jobAlerts.filter((item) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        item.opening.title.toLowerCase().includes(q) ||
        item.opening.company.toLowerCase().includes(q) ||
        item.opening.requiredSkills.some((s) => s.toLowerCase().includes(q))

      let matchesCat = true
      if (categoryFilter === 'best-fit') {
        matchesCat = item.fitBadge === 'Best Fit For You'
      } else if (categoryFilter === 'near-miss') {
        matchesCat = Boolean(item.isNearMiss || (item.score >= 60 && item.score <= 84 && item.missingSkills.length > 0))
      } else if (categoryFilter === 'startups') {
        matchesCat = item.opening.companyType === 'Startup / Small Team'
      } else if (categoryFilter === 'linkedin') {
        matchesCat = item.opening.source === 'LinkedIn' || Boolean(item.opening.linkedInUrl)
      } else if (categoryFilter === 'remote') {
        matchesCat = item.opening.location.toLowerCase().includes('remote')
      } else if (categoryFilter === 'engineering') {
        matchesCat = item.opening.department.toLowerCase().includes('engineering')
      } else if (categoryFilter === 'ai') {
        matchesCat =
          item.opening.title.toLowerCase().includes('ai') ||
          item.opening.description.toLowerCase().includes('ai')
      }

      return matchesSearch && matchesCat
    })

    // Sort
    if (sortBy === 'newest') {
      return [...list].sort((a, b) => b.opening.id.localeCompare(a.opening.id))
    }
    if (sortBy === 'competition') {
      return [...list].sort((a, b) => {
        const aLow = (a.opening.applicantCount || '').includes('early') || (a.opening.applicantCount || '').includes('Be an early') ? 1 : 0
        const bLow = (b.opening.applicantCount || '').includes('early') || (b.opening.applicantCount || '').includes('Be an early') ? 1 : 0
        return bLow - aLow || b.score - a.score
      })
    }
    // Default: Sort by Match Score Descending
    return [...list].sort((a, b) => b.score - a.score)
  }, [jobAlerts, search, categoryFilter, sortBy])

  // Open Skill Gap or Interview modal if requested by Chrome Extension
  useEffect(() => {
    const checkPendingModal = () => {
      try {
        const raw = sessionStorage.getItem(EXT_PENDING_MODAL_KEY)
        if (!raw) return
        const { modalType, jobId } = JSON.parse(raw) as { modalType?: string; jobId?: string }
        if (!jobId) return

        const refreshed = getStoredFeedOpenings()
        setOpeningsPool(refreshed)
        const targetOpening = refreshed.find((o) => o.id === jobId)
        if (!targetOpening) return

        sessionStorage.removeItem(EXT_PENDING_MODAL_KEY)
        const computed = activeResume
          ? getJobRecommendationsForResume(activeResume, [targetOpening])[0]
          : {
              opening: targetOpening,
              score: 75,
              fitBadge: 'Good Match' as const,
              matchReason: 'Imported from LinkedIn via Hirely Copilot Extension.',
              matchingSkills: targetOpening.requiredSkills.slice(0, 3),
              missingSkills: targetOpening.requiredSkills.slice(3),
              highlightedAdvantages: ['Imported directly from active LinkedIn job post'],
              isNearMiss: false,
            }

        if (modalType === 'roadmap') {
          setRoadmapAlert(computed)
        } else {
          setInterviewAlert(computed)
        }
      } catch { /* ignore */ }
    }

    checkPendingModal()
    window.addEventListener('hirely:ext-modal', checkPendingModal)
    return () => window.removeEventListener('hirely:ext-modal', checkPendingModal)
  }, [activeResume])

  const topBestFit = jobAlerts.find((j) => j.fitBadge === 'Best Fit For You') || jobAlerts[0]

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastRefreshedAt(new Date())
      setIsRefreshing(false)
    }, 600)
  }

  const handleSurfaceNewJobs = () => {
    const currentIds = new Set(openingsPool.map((j) => j.id))
    const nextUnadded = SURFACED_FEED_STREAM.find((j) => !currentIds.has(j.id))

    if (nextUnadded) {
      injectFeedOpening(nextUnadded)
      setOpeningsPool((prev) => [nextUnadded, ...prev])
      setNewJobNotification(`Successfully surfaced: ${nextUnadded.title} @ ${nextUnadded.company}!`)
    } else {
      setNewJobNotification(`Your continuous feed is already up to date with all live openings.`)
    }
    setTimeout(() => setNewJobNotification(null), 4000)
  }

  const handleAddToTracker = (alert: JobMatchAlert) => {
    saveApplication({
      company: alert.opening.company,
      position: alert.opening.title,
      location: alert.opening.location,
      salary: alert.opening.salaryRange,
      url: alert.opening.linkedInUrl || alert.opening.applyUrl,
      status: 'saved',
      matchScore: alert.score,
      resumeId: activeResume?.id,
      notes: `Matched via Hirely: ${alert.fitBadge} (${alert.score}% match) · ${alert.opening.companyType || 'Company'} · ${alert.opening.source || 'Direct'}`,
    })
    setAddedAlertId(alert.opening.id)
    setTimeout(() => setAddedAlertId(null), 3000)
  }

  const handleTailorResume = (alert: JobMatchAlert) => {
    if (!activeResume) {
      navigate('/upload')
      return
    }
    // Update target job details on the active resume so optimize loads with pre-filled inputs
    updateAnalysis(activeResume.id, {
      jobTarget: {
        title: alert.opening.title,
        company: alert.opening.company,
        jobDescription: alert.opening.description,
      },
    })
    navigate(`/optimize/${activeResume.id}`)
  }

  const handleTriggerLinkedInSearch = (keywords: string) => {
    const url = buildLinkedInSearchUrl(keywords)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Counts for tabs
  const bestFitCount = jobAlerts.filter((j) => j.fitBadge === 'Best Fit For You').length
  const nearMissCount = jobAlerts.filter(
    (j) => j.isNearMiss || (j.score >= 60 && j.score <= 84 && j.missingSkills.length > 0),
  ).length
  const startupsCount = jobAlerts.filter(
    (j) => j.opening.companyType === 'Startup / Small Team',
  ).length
  const linkedInCount = jobAlerts.filter(
    (j) => j.opening.source === 'LinkedIn' || Boolean(j.opening.linkedInUrl),
  ).length

  // Paginated visible items
  const visibleAlerts = filteredAlerts.slice(0, displayLimit)

  return (
    <div className="min-h-[85vh] relative pt-20 pb-16">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8">
        
        {/* Top Header & Continuous Feed Live Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="lp-page-eyebrow">Continuous Job Match Feed</span>
              
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Auto-Matching Active
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
                LinkedIn Verified Feed
              </span>
            </div>

            <h1 className="lp-page-title">
              Jobs <span className="lp-grad-text">Ranked For You</span>
            </h1>

            <p className="text-sm text-fg-muted mt-1.5 max-w-2xl">
              Continuous live job feed automatically ranked against your resume. Explore skill gap roadmaps for near-miss roles, generate custom interview question rubrics, and apply directly on LinkedIn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {resumes.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-surface border border-line">
                <span className="text-xs text-fg-muted font-medium pl-1">Resume:</span>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="text-xs bg-surface-subtle border border-line rounded-xl px-2.5 py-1 text-fg-strong focus:outline-none focus:border-brand-500 max-w-[170px] truncate"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fileName} ({r.scores.overall} pts)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Feed Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-line w-full sm:w-auto">
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Refresh rankings & feed"
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface border border-line text-fg-strong transition-all flex items-center gap-1.5"
              >
                <RefreshCwIcon className={`w-3.5 h-3.5 text-brand-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleSurfaceNewJobs}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-brand-600/15 hover:bg-brand-600/25 text-brand-300 border border-brand-500/30 transition-all flex items-center gap-1.5"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Surface New</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  autoRefresh
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                Auto: {autoRefresh ? 'ON' : 'OFF'}
              </button>

              <Link
                to="/extension"
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 text-[#70b5f9] border border-[#0A66C2]/30 transition-all flex items-center gap-1.5"
                title="Install the Hirely Chrome Extension for LinkedIn"
              >
                <PuzzleIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chrome Extension</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Influx Notification Banner */}
        {newJobNotification && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{newJobNotification}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">Refreshed live</span>
          </div>
        )}

        {/* Highlight Banner: Best Fit For You */}
        {topBestFit && activeResume && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-brand-950/60 via-surface to-indigo-950/40 border border-brand-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1.5">
                    <StarIcon className="w-3.5 h-3.5" />
                    <span>TOP OPENING RECOMMENDED FOR YOU</span>
                  </span>
                  {topBestFit.opening.companyType && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${
                        topBestFit.opening.companyType === 'Startup / Small Team'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {topBestFit.opening.companyType === 'Startup / Small Team' && (
                        <RocketIcon className="w-3 h-3" />
                      )}
                      <span>{topBestFit.opening.companyType}</span>
                    </span>
                  )}
                  {topBestFit.opening.source === 'LinkedIn' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0A66C2]/20 text-[#70b5f9] border border-[#0A66C2]/30 flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                      Available on LinkedIn
                    </span>
                  )}
                  {topBestFit.opening.hasEasyApply && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                      <ZapIcon className="w-3 h-3" />
                      <span>Easy Apply</span>
                    </span>
                  )}
                  <span className="text-xs text-fg-muted">Posted {topBestFit.opening.postedDate}</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-fg-strong">
                  {topBestFit.opening.title} <span className="text-brand-400">@ {topBestFit.opening.company}</span>
                </h2>
                
                <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {topBestFit.matchReason}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {topBestFit.opening.applicantCount && (
                    <span className="text-[#70b5f9] font-medium inline-flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5" />
                      <span>{topBestFit.opening.applicantCount}</span>
                    </span>
                  )}
                  {topBestFit.opening.teamSize && (
                    <span className="text-fg-muted inline-flex items-center gap-1">
                      <BuildingIcon className="w-3.5 h-3.5" />
                      <span>Team: {topBestFit.opening.teamSize}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {topBestFit.matchingSkills.slice(0, 5).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                      <CheckIcon className="w-3 h-3" />
                      <span>{s}</span>
                    </span>
                  ))}
                  {topBestFit.opening.salaryRange && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface text-fg-muted text-xs border border-line">
                      <DollarSignIcon className="w-3 h-3 text-emerald-400" />
                      <span>{topBestFit.opening.salaryRange}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface text-fg-muted text-xs border border-line">
                    <MapPinIcon className="w-3 h-3 text-brand-400" />
                    <span>{topBestFit.opening.location}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center gap-2.5 shrink-0">
                <ScoreRing value={topBestFit.score} size={88} strokeWidth={6} label="Match Score" />
                
                <div className="flex flex-col gap-1.5 w-full">
                  <Button size="sm" onClick={() => handleTailorResume(topBestFit)} className="w-full">
                    Tailor My Resume
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInterviewAlert(topBestFit)}
                    className="w-full text-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <TargetIcon className="w-3.5 h-3.5 text-brand-400" />
                    <span>Mock Interview Prep</span>
                  </Button>

                  {topBestFit.opening.linkedInUrl && (
                    <a
                      href={topBestFit.opening.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                      Apply on LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live LinkedIn Custom Finder Box */}
        <div className="mb-8 p-5 rounded-2xl bg-surface border border-[#0A66C2]/30 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg-strong">
                  Live LinkedIn Search Generator
                </h3>
                <p className="text-xs text-fg-muted">
                  Instant real-time searches calibrated to your exact role and tech stack on LinkedIn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerLinkedInSearch(detectedRole)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-line text-xs font-medium text-fg-strong transition-all hover:border-[#0A66C2]/40"
              >
                <SearchIcon className="w-3.5 h-3.5 text-[#70b5f9]" />
                <span>Search "{detectedRole}" on LinkedIn ↗</span>
              </button>
              <button
                type="button"
                onClick={() => handleTriggerLinkedInSearch(`${topSkill} Developer Remote`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-line text-xs font-medium text-fg-strong transition-all hover:border-[#0A66C2]/40"
              >
                <ZapIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Remote {topSkill} Jobs ↗</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-line/60">
            <input
              type="text"
              value={customLinkedInSearch}
              onChange={(e) => setCustomLinkedInSearch(e.target.value)}
              placeholder="Or search any custom role on LinkedIn (e.g. Staff Full Stack Engineer, AI Agent Developer)..."
              className="flex-1 min-w-0 px-3.5 py-2 sm:py-1.5 text-xs bg-surface-subtle border border-line rounded-xl text-fg-strong focus:outline-none focus:border-[#0A66C2]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customLinkedInSearch.trim()) {
                  handleTriggerLinkedInSearch(customLinkedInSearch.trim())
                }
              }}
            />
            <button
              type="button"
              disabled={!customLinkedInSearch.trim()}
              onClick={() => handleTriggerLinkedInSearch(customLinkedInSearch.trim())}
              className="px-4 py-2 sm:py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] disabled:opacity-40 text-white text-xs font-semibold transition-colors shrink-0"
            >
              Search LinkedIn ↗
            </button>
          </div>
        </div>

        {/* Dedicated Filter Tabs, Sort & Search */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter feed by role, skill, or company..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500 shrink-0"
            >
              <option value="match">Rank: Highest Match %</option>
              <option value="newest">Rank: Newest Postings First</option>
              <option value="competition">Rank: Low Competition First</option>
            </select>
          </div>

          {/* Filter Tabs with horizontal smooth scroll on mobile */}
          <div className="flex gap-1.5 bg-surface border border-line p-1.5 rounded-xl text-xs overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-fg-muted hover:text-fg-strong'
              }`}
            >
              All ({jobAlerts.length})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('best-fit')}
              className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap ${
                categoryFilter === 'best-fit'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-amber-400 hover:bg-amber-500/15'
              }`}
            >
              <StarIcon className="w-3.5 h-3.5" />
              <span>Best Fit ({bestFitCount})</span>
            </button>

            {/* Near-Miss & Roadmaps Filter Tab */}
            <button
              type="button"
              onClick={() => setCategoryFilter('near-miss')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
                categoryFilter === 'near-miss'
                  ? 'bg-amber-500 text-black font-bold shadow-xs'
                  : 'text-amber-300 hover:bg-amber-500/15'
              }`}
            >
              <TargetIcon className="w-3.5 h-3.5" />
              <span>Near-Miss & Roadmaps ({nearMissCount})</span>
            </button>

            {/* Startups & Small Teams Tab */}
            <button
              type="button"
              onClick={() => setCategoryFilter('startups')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap ${
                categoryFilter === 'startups'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-emerald-400 hover:bg-emerald-500/15'
              }`}
            >
              <RocketIcon className="w-3.5 h-3.5" />
              <span>Startups ({startupsCount})</span>
            </button>

            {/* Dedicated LinkedIn Openings Tab */}
            <button
              type="button"
              onClick={() => setCategoryFilter('linkedin')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                categoryFilter === 'linkedin'
                  ? 'bg-[#0A66C2] text-white font-semibold shadow-xs'
                  : 'text-[#70b5f9] hover:bg-[#0A66C2]/15'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
              LinkedIn ({linkedInCount})
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('remote')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === 'remote'
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-fg-muted hover:text-fg-strong'
              }`}
            >
              Remote
            </button>
          </div>
        </div>

        {/* Near-Miss Specific Banner */}
        {categoryFilter === 'near-miss' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-fg-muted animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <TargetIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Showing <strong>{filteredAlerts.length} Near-Miss Opportunities (60–84% match)</strong>. You meet the primary core requirements! Click <strong>"Skill Gap & Roadmap"</strong> on any opening to see your exact 1–2 week action plan to close the gap.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="text-amber-300 hover:underline shrink-0 font-medium sm:ml-4"
            >
              Show all
            </button>
          </div>
        )}

        {/* Startups Specific Banner */}
        {categoryFilter === 'startups' && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-fg-muted animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <RocketIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Showing <strong>{filteredAlerts.length} openings at early-stage startups & boutique small teams</strong>.
                These roles feature direct founder contact, high ownership, fast interview loops, and lower competition on LinkedIn.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="text-emerald-400 hover:underline shrink-0 font-medium sm:ml-4"
            >
              Show all sources
            </button>
          </div>
        )}

        {/* LinkedIn Specific Banner */}
        {categoryFilter === 'linkedin' && (
          <div className="mb-6 p-4 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-fg-muted animate-fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <BriefcaseIcon className="w-4 h-4 text-[#70b5f9] shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Showing <strong>{filteredAlerts.length} active openings available on LinkedIn</strong> with direct apply links, Easy Apply indicators, and applicant insights.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="text-[#70b5f9] hover:underline shrink-0 font-medium sm:ml-4"
            >
              Show all sources
            </button>
          </div>
        )}

        {/* Continuous Jobs Feed List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-fg-muted text-sm">No matching job openings found for these filters.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('all')
                }}
                className="mt-3"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            visibleAlerts.map((alert) => {
              const isBest = alert.fitBadge === 'Best Fit For You'
              const isHigh = alert.fitBadge === 'High Match'
              const isNearMiss = alert.isNearMiss || (alert.score >= 60 && alert.score <= 84 && alert.missingSkills.length > 0)
              const wasAdded = addedAlertId === alert.opening.id
              const isLinkedIn = alert.opening.source === 'LinkedIn' || Boolean(alert.opening.linkedInUrl)

              return (
                <div
                  key={alert.opening.id}
                  className={`glass-card p-5 sm:p-6 transition-all border ${
                    isBest
                      ? 'border-amber-400/30 bg-amber-950/10 hover:border-amber-400/50'
                      : isNearMiss
                      ? 'border-amber-500/25 bg-amber-950/5 hover:border-amber-500/40'
                      : isLinkedIn
                      ? 'border-[#0A66C2]/20 hover:border-[#0A66C2]/40'
                      : 'hover:border-brand-500/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Left Details */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base sm:text-lg text-fg-strong">
                          {alert.opening.title}
                        </span>
                        <span className="text-sm font-semibold text-brand-400">
                          @ {alert.opening.company}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isBest
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : isNearMiss
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isHigh
                              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                              : 'bg-surface text-fg-muted border border-line'
                          }`}
                        >
                          {isNearMiss ? 'Near-Miss Match' : alert.fitBadge}
                        </span>

                        {alert.opening.companyType && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-flex items-center gap-1 ${
                              alert.opening.companyType === 'Startup / Small Team'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : alert.opening.companyType === 'Mid-Size'
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : 'bg-surface text-fg-muted border-line'
                            }`}
                          >
                            {alert.opening.companyType === 'Startup / Small Team' && (
                              <RocketIcon className="w-3 h-3" />
                            )}
                            <span>{alert.opening.companyType}</span>
                          </span>
                        )}

                        {isLinkedIn && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                            <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                            </svg>
                            LinkedIn
                          </span>
                        )}

                        {alert.opening.hasEasyApply && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <ZapIcon className="w-3 h-3" />
                            <span>Easy Apply</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                        {alert.opening.description}
                      </p>

                      {/* Matching vs Missing Skills Breakdown */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {alert.opening.requiredSkills.map((skill) => {
                          const matched = alert.matchingSkills.includes(skill)
                          return (
                            <span
                              key={skill}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                matched
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300/90 border-amber-500/20'
                              }`}
                            >
                              {matched ? (
                                <CheckIcon className="w-3 h-3" />
                              ) : (
                                <ZapIcon className="w-3 h-3" />
                              )}
                              <span>{skill}</span>
                            </span>
                          )
                        })}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-fg-muted pt-1 items-center">
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5 text-brand-400" />
                          <span>{alert.opening.location}</span>
                        </span>
                        {alert.opening.salaryRange && (
                          <span className="inline-flex items-center gap-1">
                            <DollarSignIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{alert.opening.salaryRange}</span>
                          </span>
                        )}
                        {alert.opening.teamSize && (
                          <span className="text-fg-muted inline-flex items-center gap-1">
                            <BuildingIcon className="w-3.5 h-3.5" />
                            <span>Team: {alert.opening.teamSize}</span>
                          </span>
                        )}
                        {alert.opening.applicantCount && (
                          <span className="text-[#70b5f9] font-medium inline-flex items-center gap-1">
                            <UsersIcon className="w-3.5 h-3.5" />
                            <span>{alert.opening.applicantCount}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{alert.opening.type}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right Match Ring & Comprehensive Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-line">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div className="text-left sm:text-right lg:text-right">
                          <p className="text-xs font-semibold text-fg-strong">{isNearMiss ? 'Near-Miss' : alert.fitBadge}</p>
                          <p className="text-[10px] text-fg-muted">Fit Rating</p>
                        </div>
                        <ScoreRing value={alert.score} size={54} strokeWidth={5} />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-end w-full lg:w-auto">
                        
                        {/* 1. Skill Gap & Learning Roadmap Action */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRoadmapAlert(alert)}
                          className="text-xs text-amber-300 border-amber-500/30 hover:border-amber-500/50 inline-flex items-center gap-1.5"
                        >
                          <BookOpenIcon className="w-3.5 h-3.5" />
                          <span>Skill Gap & Roadmap</span>
                        </Button>

                        {/* 2. Interview Prep Generator Action */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setInterviewAlert(alert)}
                          className="text-xs text-brand-300 border-brand-500/30 hover:border-brand-500/50 inline-flex items-center gap-1.5"
                        >
                          <TargetIcon className="w-3.5 h-3.5" />
                          <span>Interview Prep</span>
                        </Button>

                        {/* 3. Track Job in Pipeline */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddToTracker(alert)}
                          className={`text-xs inline-flex items-center gap-1 ${wasAdded ? 'text-emerald-400 border-emerald-500/40' : ''}`}
                        >
                          {wasAdded ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            '+ Track'
                          )}
                        </Button>

                        {/* 4. Tailor Resume */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTailorResume(alert)}
                          className="text-xs"
                        >
                          Tailor
                        </Button>

                        {/* 5. Direct LinkedIn Apply */}
                        {isLinkedIn ? (
                          <a
                            href={alert.opening.linkedInUrl || buildLinkedInSearchUrl(`${alert.opening.title} ${alert.opening.company}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-xl bg-[#0A66C2] hover:bg-[#084e96] transition-colors shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                            </svg>
                            LinkedIn
                          </a>
                        ) : (
                          <a
                            href={alert.opening.applyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-button inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-fg-strong rounded-xl hover:text-brand-300"
                          >
                            Apply ↗
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Continuous Feed Scroll Trigger */}
        {filteredAlerts.length > displayLimit && (
          <div className="pt-6 text-center">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDisplayLimit((prev) => prev + 6)}
              className="px-6 py-2.5 rounded-2xl text-xs font-semibold"
            >
              Load More Openings (Showing {displayLimit} of {filteredAlerts.length}) ↓
            </Button>
          </div>
        )}

        {filteredAlerts.length <= displayLimit && filteredAlerts.length > 0 && (
          <div className="pt-8 text-center text-xs text-fg-muted flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>All {filteredAlerts.length} ranked openings loaded for your profile · Feed is continuously listening for new openings</span>
          </div>
        )}

      </div>

      {/* ─── MODALS ────────────────────────────────────────── */}

      {/* 1. Skill Gap & Learning Roadmap Modal */}
      <SkillGapRoadmapModal
        open={Boolean(roadmapAlert)}
        onClose={() => setRoadmapAlert(null)}
        alert={roadmapAlert}
        resume={activeResume}
        onTailorResume={handleTailorResume}
        onAddToTracker={handleAddToTracker}
      />

      {/* 2. Interview Prep Generator Modal */}
      <InterviewPrepModal
        open={Boolean(interviewAlert)}
        onClose={() => setInterviewAlert(null)}
        alert={interviewAlert}
        resume={activeResume}
      />

      {/* 3. Match Details Modal */}
      {selectedJobAlert && (
        <Modal
          open={Boolean(selectedJobAlert)}
          onClose={() => setSelectedJobAlert(null)}
          title={`${selectedJobAlert.opening.title} @ ${selectedJobAlert.opening.company}`}
          size="lg"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button variant="secondary" onClick={() => setSelectedJobAlert(null)}>
                Close
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => handleAddToTracker(selectedJobAlert)}>
                  Save to Pipeline
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRoadmapAlert(selectedJobAlert)
                    setSelectedJobAlert(null)
                  }}
                  className="text-amber-300"
                >
                  Skill Gap & Roadmap
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInterviewAlert(selectedJobAlert)
                    setSelectedJobAlert(null)
                  }}
                  className="text-brand-300"
                >
                  Interview Prep
                </Button>
                {selectedJobAlert.opening.linkedInUrl && (
                  <a
                    href={selectedJobAlert.opening.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl bg-[#0A66C2] hover:bg-[#084e96] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                    </svg>
                    Apply on LinkedIn
                  </a>
                )}
                <Button onClick={() => handleTailorResume(selectedJobAlert)}>
                  Optimize Resume For This
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-surface-subtle border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-fg-muted uppercase tracking-wider font-semibold">Match Score</span>
                <h3 className="text-xl font-bold text-fg-strong mt-0.5">{selectedJobAlert.score}% Match</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-brand-400 font-semibold">{selectedJobAlert.fitBadge}</p>
                  {selectedJobAlert.opening.companyType && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {selectedJobAlert.opening.companyType === 'Startup / Small Team' && (
                        <RocketIcon className="w-3 h-3" />
                      )}
                      <span>{selectedJobAlert.opening.companyType}</span>
                    </span>
                  )}
                  {selectedJobAlert.opening.source === 'LinkedIn' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                      LinkedIn Listing
                    </span>
                  )}
                  {selectedJobAlert.opening.hasEasyApply && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                      <ZapIcon className="w-3 h-3" />
                      <span>Easy Apply Available</span>
                    </span>
                  )}
                </div>
              </div>
              <ScoreRing value={selectedJobAlert.score} size={64} strokeWidth={6} />
            </div>

            {selectedJobAlert.opening.teamSize && (
              <div className="p-3 rounded-xl bg-surface border border-line text-xs text-fg-muted flex items-center gap-2">
                <BuildingIcon className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Company Structure: <strong className="text-fg-strong">{selectedJobAlert.opening.teamSize}</strong></span>
              </div>
            )}

            {selectedJobAlert.opening.applicantCount && (
              <div className="p-3 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-xs text-[#70b5f9] flex items-center gap-2">
                <UsersIcon className="w-4 h-4 shrink-0" />
                <span>{selectedJobAlert.opening.applicantCount}</span>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-fg-strong uppercase tracking-wider mb-2">Why This Is Your Best Fit</h4>
              <p className="text-xs text-fg-muted leading-relaxed bg-surface p-3.5 rounded-xl border border-line">
                {selectedJobAlert.matchReason}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  Matching Skills ({selectedJobAlert.matchingSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobAlert.matchingSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Missing / Recommended Keywords ({selectedJobAlert.missingSkills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobAlert.missingSkills.length ? (
                    selectedJobAlert.missingSkills.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
                        + {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-fg-muted">None! You meet all required keywords.</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-fg-strong uppercase tracking-wider mb-2">Job Description</h4>
              <p className="text-xs text-fg-muted leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto p-3.5 rounded-xl bg-surface border border-line">
                {selectedJobAlert.opening.description}
              </p>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
