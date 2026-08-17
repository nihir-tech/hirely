import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ScoreRing } from '../ui/ScoreRing'
import { EmptyState } from '../ui/EmptyState'
import { Alert } from '../ui/Alert'
import type { AnalysisResult, SkillMatch } from '../../types'

function SkillRow({ item }: { item: SkillMatch }) {
  const statusMap = {
    matched: { variant: 'success' as const, icon: '✓', label: 'Matched' },
    missing: { variant: 'error' as const, icon: '✗', label: 'Missing' },
    weak: { variant: 'warning' as const, icon: '~', label: 'Weak evidence' },
  }
  const s = statusMap[item.status]

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-subtle transition-colors">
      <Badge variant={s.variant}>{s.icon} {s.label}</Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{item.skill}</p>
        <p className="text-sm text-neutral-400 mt-0.5">{item.explanation}</p>
        {item.evidence && (
          <p className="text-xs text-neutral-600 mt-1 italic">&ldquo;{item.evidence}&rdquo;</p>
        )}
      </div>
    </div>
  )
}

export function JobMatchTab({ analysis }: { analysis: AnalysisResult }) {
  if (!analysis.jobMatch) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="No job target yet"
          description="Add a job description to see how your resume matches against specific requirements."
          action={{
            label: 'Optimize for a Job',
            onClick: () => window.location.href = `/optimize/${analysis.id}`,
          }}
        />
      </div>
    )
  }

  const { jobMatch } = analysis
  const matched = jobMatch.skills.filter(s => s.status === 'matched')
  const missing = jobMatch.skills.filter(s => s.status === 'missing')
  const weak = jobMatch.skills.filter(s => s.status === 'weak')

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-6">
        <ScoreRing value={jobMatch.score} size={100} strokeWidth={7} label="Job Match" />
        <div className="text-sm max-w-md">
          <p className="font-medium text-white mb-1">
            {analysis.jobTarget?.title || 'Target Role'}
            {analysis.jobTarget?.company && <span className="font-normal text-neutral-500"> at {analysis.jobTarget.company}</span>}
          </p>
          <p className="leading-relaxed text-neutral-400">
            {matched.length} skills matched, {missing.length} missing, {weak.length} with weak evidence.
          </p>
        </div>
      </div>

      {matched.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-emerald-400 mb-3">Matched Skills</h3>
          <div className="space-y-1">
            {matched.map(s => <SkillRow key={s.skill} item={s} />)}
          </div>
        </Card>
      )}

      {missing.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-3">Missing Skills</h3>
          <p className="text-sm text-neutral-500 mb-3">
            These skills appear to be absent from your resume. Consider whether you have experience
            you haven&apos;t represented.
          </p>
          <div className="space-y-1">
            {missing.map(s => <SkillRow key={s.skill} item={s} />)}
          </div>
        </Card>
      )}

      {weak.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-amber-400 mb-3">Weak Evidence</h3>
          <p className="text-sm text-neutral-500 mb-3">
            You may have these skills but haven&apos;t clearly demonstrated them on your resume.
          </p>
          <div className="space-y-1">
            {weak.map(s => <SkillRow key={s.skill} item={s} />)}
          </div>
        </Card>
      )}

      {jobMatch.atsConcerns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Job-Specific ATS Concerns</h3>
          <div className="space-y-3">
            {jobMatch.atsConcerns.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-surface-subtle border border-white/5">
                <p className="text-sm font-medium text-white">{c.issue}</p>
                <p className="text-sm text-neutral-400 mt-1">{c.recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {jobMatch.notes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Additional Notes</h3>
          <ul className="space-y-2">
            {jobMatch.notes.map((n, i) => (
              <li key={i} className="text-sm text-neutral-400 flex gap-2">
                <span className="text-neutral-600">•</span>
                {n}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Alert variant="info">
        Never fabricate skills or experience you don&apos;t have. If a required skill is missing, consider
        whether you can gain it through a project, course, or open-source contribution.
      </Alert>
    </div>
  )
}
