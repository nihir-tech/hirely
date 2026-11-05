import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listAnalyses, saveApplication } from '../lib/storage'
import { CURATED_JOB_OPENINGS, buildLinkedInSearchUrl } from '../lib/jobOpenings'
import { getJobRecommendationsForResume } from '../lib/jobMatcher'
import type { JobMatchAlert } from '../types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Modal } from '../components/ui/Modal'

export function Jobs() {
  const navigate = useNavigate()
  const resumes = useMemo(() => listAnalyses(), [])
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'linkedin' | 'remote' | 'engineering' | 'ai'>('all')
  const [onlyBestFit, setOnlyBestFit] = useState(false)
  const [selectedJobAlert, setSelectedJobAlert] = useState<JobMatchAlert | null>(null)
  const [addedAlertId, setAddedAlertId] = useState<string | null>(null)
  const [customLinkedInSearch, setCustomLinkedInSearch] = useState('')

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0] || null

  // Compute matches
  const jobAlerts = useMemo(() => {
    if (!activeResume) {
      return CURATED_JOB_OPENINGS.map((op) => ({
        opening: op,
        score: 75,
        fitBadge: 'Good Match' as const,
        matchReason: 'Upload or select a resume to get accurate match percentages and custom reasoning.',
        matchingSkills: op.requiredSkills.slice(0, 2),
        missingSkills: op.requiredSkills.slice(2),
        highlightedAdvantages: ['Competitive market opportunity'],
      }))
    }
    return getJobRecommendationsForResume(activeResume, CURATED_JOB_OPENINGS)
  }, [activeResume])

  // Top candidate role & skills for LinkedIn search generator
  const detectedRole =
    activeResume?.jobTarget?.title ||
    activeResume?.extracted.professionalSummary?.split('.')[0] ||
    'Software Engineer'
  const topSkill = activeResume?.skills.detected[0] || 'React'

  // Filtered jobs
  const filteredAlerts = useMemo(() => {
    return jobAlerts.filter((item) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        item.opening.title.toLowerCase().includes(q) ||
        item.opening.company.toLowerCase().includes(q) ||
        item.opening.requiredSkills.some((s) => s.toLowerCase().includes(q))

      let matchesCat = true
      if (categoryFilter === 'linkedin') {
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

      const matchesFit = !onlyBestFit || item.fitBadge === 'Best Fit For You'

      return matchesSearch && matchesCat && matchesFit
    })
  }, [jobAlerts, search, categoryFilter, onlyBestFit])

  const topBestFit = jobAlerts.find((j) => j.fitBadge === 'Best Fit For You') || jobAlerts[0]

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
      notes: `Matched via Hirely: ${alert.fitBadge} (${alert.score}% match) · ${alert.opening.source || 'Direct'}`,
    })
    setAddedAlertId(alert.opening.id)
    setTimeout(() => setAddedAlertId(null), 3000)
  }

  const handleTailorResume = (alert: JobMatchAlert) => {
    if (!activeResume) {
      navigate('/upload')
      return
    }
    navigate(`/optimize/${activeResume.id}`)
  }

  const handleTriggerLinkedInSearch = (keywords: string) => {
    const url = buildLinkedInSearchUrl(keywords)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const linkedInCount = jobAlerts.filter(
    (j) => j.opening.source === 'LinkedIn' || Boolean(j.opening.linkedInUrl),
  ).length

  return (
    <div className="min-h-[85vh] relative pt-20 pb-16">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8">
        
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="lp-page-eyebrow">Smart Job Match</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
                LinkedIn Verified
              </span>
            </div>
            <h1 className="lp-page-title">
              Openings <span className="lp-grad-text">Matched For You</span>
            </h1>
            <p className="text-sm text-fg-muted mt-1.5 max-w-2xl">
              Curated openings scored directly against your resume with live LinkedIn listings, Easy Apply badges,
              and 1-click tailored optimization.
            </p>
          </div>

          {resumes.length > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface border border-line">
              <span className="text-xs text-fg-muted font-medium pl-1">Matching against:</span>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="text-xs bg-surface-subtle border border-line rounded-xl px-3 py-1.5 text-fg-strong focus:outline-none focus:border-brand-500 max-w-[200px] truncate"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fileName} ({r.scores.overall} pts)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Highlight Banner: Best Fit For You */}
        {topBestFit && activeResume && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-brand-950/60 via-surface to-indigo-950/40 border border-brand-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                    ⭐ TOP OPENING RECOMMENDED FOR YOU
                  </span>
                  {topBestFit.opening.source === 'LinkedIn' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0A66C2]/20 text-[#70b5f9] border border-[#0A66C2]/30 flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                      Available on LinkedIn
                    </span>
                  )}
                  {topBestFit.opening.hasEasyApply && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ⚡ Easy Apply
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

                {topBestFit.opening.applicantCount && (
                  <p className="text-xs text-[#70b5f9] font-medium">
                    👥 {topBestFit.opening.applicantCount}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {topBestFit.matchingSkills.slice(0, 5).map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                      ✓ {s}
                    </span>
                  ))}
                  {topBestFit.opening.salaryRange && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-surface text-fg-muted text-xs border border-line">
                      💰 {topBestFit.opening.salaryRange}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface text-fg-muted text-xs border border-line">
                    📍 {topBestFit.opening.location}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center gap-3 shrink-0">
                <ScoreRing value={topBestFit.score} size={88} strokeWidth={6} label="Match Score" />
                <Button size="sm" onClick={() => handleTailorResume(topBestFit)} className="w-full">
                  Tailor My Resume
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
        )}

        {/* Live LinkedIn Job Finder Box */}
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
                  Explore Live LinkedIn Jobs For Your Profile
                </h3>
                <p className="text-xs text-fg-muted">
                  One-click live searches tailored to your experience and skills on LinkedIn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTriggerLinkedInSearch(detectedRole)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-line text-xs font-medium text-fg-strong transition-all hover:border-[#0A66C2]/40"
              >
                🔎 Search "{detectedRole}" on LinkedIn ↗
              </button>
              <button
                type="button"
                onClick={() => handleTriggerLinkedInSearch(`${topSkill} Developer Remote`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-line text-xs font-medium text-fg-strong transition-all hover:border-[#0A66C2]/40"
              >
                ⚡ Remote {topSkill} Jobs ↗
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-line/60">
            <input
              type="text"
              value={customLinkedInSearch}
              onChange={(e) => setCustomLinkedInSearch(e.target.value)}
              placeholder="Or search any custom role on LinkedIn (e.g. Staff Full Stack Engineer, AI Agent Developer)..."
              className="flex-1 px-3.5 py-1.5 text-xs bg-surface-subtle border border-line rounded-xl text-fg-strong focus:outline-none focus:border-[#0A66C2]"
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
              className="px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] disabled:opacity-40 text-white text-xs font-semibold transition-colors"
            >
              Search LinkedIn ↗
            </button>
          </div>
        </div>

        {/* Dedicated Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <div className="relative w-full sm:w-80">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by role, skill, or company..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-surface border border-line rounded-xl text-fg-strong focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setOnlyBestFit(!onlyBestFit)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                onlyBestFit
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-surface text-fg-muted border-line hover:text-fg-strong'
              }`}
            >
              ⭐ Best Fit Only
            </button>

            <div className="flex flex-wrap gap-1 bg-surface border border-line p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                All ({jobAlerts.length})
              </button>

              {/* Dedicated LinkedIn Openings Tab */}
              <button
                type="button"
                onClick={() => setCategoryFilter('linkedin')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                  categoryFilter === 'linkedin'
                    ? 'bg-[#0A66C2] text-white font-semibold shadow-xs'
                    : 'text-[#70b5f9] hover:bg-[#0A66C2]/15'
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
                LinkedIn Openings ({linkedInCount})
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('remote')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  categoryFilter === 'remote'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                Remote
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('engineering')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  categoryFilter === 'engineering'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                Engineering
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('ai')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  categoryFilter === 'ai'
                    ? 'bg-brand-600 text-white font-medium'
                    : 'text-fg-muted hover:text-fg-strong'
                }`}
              >
                AI & ML
              </button>
            </div>
          </div>
        </div>

        {/* LinkedIn Specific Banner if LinkedIn filter is active */}
        {categoryFilter === 'linkedin' && (
          <div className="mb-6 p-4 rounded-2xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-between text-xs text-fg-muted">
            <div className="flex items-center gap-2">
              <span className="text-base">💼</span>
              <span>
                Showing <strong>{filteredAlerts.length} active openings available on LinkedIn</strong>. Each includes
                direct LinkedIn application links, Easy Apply indicators, and applicant insights.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="text-[#70b5f9] hover:underline shrink-0 font-medium ml-4"
            >
              Show all sources
            </button>
          </div>
        )}

        {/* Jobs List */}
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
                  setOnlyBestFit(false)
                }}
                className="mt-3"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const isBest = alert.fitBadge === 'Best Fit For You'
              const isHigh = alert.fitBadge === 'High Match'
              const wasAdded = addedAlertId === alert.opening.id
              const isLinkedIn = alert.opening.source === 'LinkedIn' || Boolean(alert.opening.linkedInUrl)

              return (
                <div
                  key={alert.opening.id}
                  className={`glass-card p-5 sm:p-6 transition-all border ${
                    isBest
                      ? 'border-amber-400/30 bg-amber-950/10 hover:border-amber-400/50'
                      : isLinkedIn
                      ? 'border-[#0A66C2]/20 hover:border-[#0A66C2]/40'
                      : 'hover:border-brand-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    
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
                              : isHigh
                              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                              : 'bg-surface text-fg-muted border border-line'
                          }`}
                        >
                          {alert.fitBadge}
                        </span>

                        {isLinkedIn && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                            <svg className="w-3 h-3 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                            </svg>
                            LinkedIn
                          </span>
                        )}

                        {alert.opening.hasEasyApply && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            ⚡ Easy Apply
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-fg-muted line-clamp-2 leading-relaxed">
                        {alert.opening.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {alert.opening.requiredSkills.map((skill) => {
                          const matched = alert.matchingSkills.includes(skill)
                          return (
                            <span
                              key={skill}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                matched
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-surface text-fg-faint border-line'
                              }`}
                            >
                              {matched ? '✓ ' : ''}{skill}
                            </span>
                          )
                        })}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-fg-muted pt-1 items-center">
                        <span>📍 {alert.opening.location}</span>
                        {alert.opening.salaryRange && <span>💰 {alert.opening.salaryRange}</span>}
                        {alert.opening.applicantCount && (
                          <span className="text-[#70b5f9] font-medium">👥 {alert.opening.applicantCount}</span>
                        )}
                        <span>🕒 {alert.opening.type}</span>
                      </div>
                    </div>

                    {/* Right Match Ring & Actions */}
                    <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-line">
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <p className="text-xs font-semibold text-fg-strong">{alert.fitBadge}</p>
                          <p className="text-[10px] text-fg-muted">Fit Rating</p>
                        </div>
                        <ScoreRing value={alert.score} size={54} strokeWidth={5} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedJobAlert(alert)}
                        >
                          View Fit Analysis
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddToTracker(alert)}
                          className={wasAdded ? 'text-emerald-400 border-emerald-500/40' : ''}
                        >
                          {wasAdded ? '✓ Saved' : '+ Track Job'}
                        </Button>

                        {/* LinkedIn Apply Button */}
                        {isLinkedIn && (
                          <a
                            href={alert.opening.linkedInUrl || buildLinkedInSearchUrl(`${alert.opening.title} ${alert.opening.company}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl bg-[#0A66C2] hover:bg-[#084e96] transition-colors shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                            </svg>
                            Apply on LinkedIn
                          </a>
                        )}

                        {!isLinkedIn && (
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

      </div>

      {/* Match Details Modal */}
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
            <div className="p-4 rounded-2xl bg-surface-subtle border border-line flex items-center justify-between">
              <div>
                <span className="text-xs text-fg-muted uppercase tracking-wider font-semibold">Match Score</span>
                <h3 className="text-xl font-bold text-fg-strong mt-0.5">{selectedJobAlert.score}% Match</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-brand-400 font-semibold">{selectedJobAlert.fitBadge}</p>
                  {selectedJobAlert.opening.source === 'LinkedIn' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A66C2]/15 text-[#70b5f9] border border-[#0A66C2]/30">
                      LinkedIn Listing
                    </span>
                  )}
                  {selectedJobAlert.opening.hasEasyApply && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                      ⚡ Easy Apply Available
                    </span>
                  )}
                </div>
              </div>
              <ScoreRing value={selectedJobAlert.score} size={64} strokeWidth={6} />
            </div>

            {selectedJobAlert.opening.applicantCount && (
              <div className="p-3 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-xs text-[#70b5f9] flex items-center gap-2">
                <span>👥</span>
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
