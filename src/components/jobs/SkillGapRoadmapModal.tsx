import { useState } from 'react'
import type { AnalysisResult, JobMatchAlert } from '../../types'
import { buildSkillGapAnalysis } from '../../lib/skillRoadmaps'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ScoreRing } from '../ui/ScoreRing'
import {
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  TargetIcon,
  TrendingUpIcon,
  WrenchIcon,
  ZapIcon,
} from '../ui/Icons'

interface SkillGapRoadmapModalProps {
  open: boolean
  onClose: () => void
  alert: JobMatchAlert | null
  resume?: AnalysisResult | null
  onTailorResume?: (alert: JobMatchAlert) => void
  onAddToTracker?: (alert: JobMatchAlert) => void
}

export function SkillGapRoadmapModal({
  open,
  onClose,
  alert,
  resume,
  onTailorResume,
  onAddToTracker,
}: SkillGapRoadmapModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeSkillTab, setActiveSkillTab] = useState<number>(0)

  if (!alert) return null

  const gapAnalysis = buildSkillGapAnalysis(alert, resume?.extracted.professionalSummary)
  const { roadmaps, isNearMiss, matchingSkills, missingSkills } = gapAnalysis

  const handleCopyBullet = (bullet: string, idx: number) => {
    navigator.clipboard.writeText(bullet)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  const selectedRoadmap = roadmaps[activeSkillTab] || roadmaps[0]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Skill Gap & Actionable Roadmap · ${alert.opening.title}`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {onAddToTracker && (
              <Button variant="secondary" onClick={() => onAddToTracker(alert)}>
                + Track in Pipeline
              </Button>
            )}
            {onTailorResume && (
              <Button onClick={() => onTailorResume(alert)}>
                Tailor Resume For This
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-fg-muted uppercase tracking-wider font-semibold">
                {alert.opening.company} · {alert.opening.location}
              </span>
              {isNearMiss && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                  <TargetIcon className="w-3.5 h-3.5" />
                  <span>High Potential Near-Miss</span>
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-fg-strong">
              Bridge Your Gap to <span className="text-brand-400">{alert.score}%+ Readiness</span>
            </h3>

            <p className="text-xs text-fg-muted max-w-xl leading-relaxed">
              {gapAnalysis.strategicAdvice}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <div className="text-right">
              <p className="text-xs font-semibold text-fg-strong">{alert.fitBadge}</p>
              <p className="text-[10px] text-fg-muted">{matchingSkills.length} matched / {missingSkills.length} to bridge</p>
            </div>
            <ScoreRing value={alert.score} size={64} strokeWidth={6} />
          </div>
        </div>

        {/* Skill Gap Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Skills You Already Have ({matchingSkills.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              {matchingSkills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ZapIcon className="w-3.5 h-3.5" />
              <span>Missing Skills to Bridge ({missingSkills.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              {missingSkills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Roadmap Breakdown Tabs */}
        {roadmaps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h4 className="text-xs font-bold text-fg-strong uppercase tracking-wider">
                Select Skill to View Learning Plan:
              </h4>
              <span className="text-xs text-fg-muted">
                {activeSkillTab + 1} of {roadmaps.length}
              </span>
            </div>

            {/* Skill Tabs with smooth mobile horizontal scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 whitespace-nowrap scrollbar-none">
              {roadmaps.map((item, idx) => (
                <button
                  key={item.skill}
                  type="button"
                  onClick={() => setActiveSkillTab(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    activeSkillTab === idx
                      ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                      : 'bg-surface text-fg-muted border-line hover:text-fg-strong hover:border-brand-500/40'
                  }`}
                >
                  {item.skill} · <span className="opacity-80">{item.timeToClose}</span>
                </button>
              ))}
            </div>

            {/* Selected Skill Roadmap Content */}
            {selectedRoadmap && (
              <div className="p-5 rounded-2xl bg-surface border border-line space-y-4 animate-fade-in">
                
                {/* Skill Overview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-fg-strong">{selectedRoadmap.skill}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30">
                        {selectedRoadmap.category}
                      </span>
                    </div>
                    <p className="text-xs text-fg-muted mt-0.5">
                      {selectedRoadmap.whyItMatters}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-subtle border border-line text-fg-muted">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>Est. {selectedRoadmap.timeToClose}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-subtle border border-line text-fg-muted">
                      <TrendingUpIcon className="w-3.5 h-3.5" />
                      <span>{selectedRoadmap.difficulty}</span>
                    </span>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-fg-strong uppercase tracking-wider">
                    Step-by-Step Learning Timeline
                  </h5>

                  <div className="space-y-3">
                    {selectedRoadmap.steps.map((st, sIdx) => (
                      <div key={st.step} className="p-3.5 rounded-xl bg-surface-subtle border border-line/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {st.step}
                          </span>
                          <span className="text-xs font-bold text-fg-strong">{st.title}</span>
                        </div>

                        <p className="text-xs text-fg-muted pl-7 leading-relaxed">
                          {st.description}
                        </p>

                        <div className="ml-7 p-2.5 rounded-lg bg-surface border border-line text-xs space-y-1">
                          <p className="text-brand-400 font-semibold text-[11px] inline-flex items-center gap-1.5">
                            <WrenchIcon className="w-3.5 h-3.5" />
                            <span>Action Item &amp; Project:</span>
                          </p>
                          <p className="text-fg-strong font-medium text-xs">
                            {st.actionItem}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copy-Ready ATS Resume Bullet */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/20 to-surface border border-emerald-500/30 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <FileTextIcon className="w-3.5 h-3.5" />
                        <span>Ready-to-Paste Resume Bullet</span>
                      </span>
                      <span className="text-[10px] text-fg-muted">(Add once project is built)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyBullet(selectedRoadmap.resumeBulletExample, activeSkillTab)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
                    >
                      {copiedIndex === activeSkillTab ? '✓ Copied!' : 'Copy Bullet'}
                    </button>
                  </div>

                  <p className="text-xs text-fg-strong font-mono bg-surface-subtle/80 p-2.5 rounded-lg border border-line/60">
                    "{selectedRoadmap.resumeBulletExample}"
                  </p>
                </div>

                {/* Free Curated Resources & Roadmaps */}
                <div className="pt-2">
                  <h5 className="text-xs font-bold text-fg-strong uppercase tracking-wider mb-2">
                    Free Learning Resources & Docs
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoadmap.resources.map((res) => (
                      <a
                        key={res.name}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-line hover:border-brand-500/40 text-xs font-medium text-fg-strong transition-all"
                      >
                        <ExternalLinkIcon className="w-3.5 h-3.5 text-brand-400" />
                        <span>{res.name}</span>
                        {res.free && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            Free
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

