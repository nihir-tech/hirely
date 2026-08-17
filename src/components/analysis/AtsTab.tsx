import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ScoreRing } from '../ui/ScoreRing'
import type { AnalysisResult, Severity } from '../../types'

const severityMap: Record<Severity, { label: string; variant: 'error' | 'warning' | 'info' }> = {
  high: { label: 'High', variant: 'error' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'info' },
}

export function AtsTab({ analysis }: { analysis: AnalysisResult }) {
  const { ats } = analysis

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-6">
        <ScoreRing value={ats.score} size={100} strokeWidth={7} label="ATS Score" />
        <div className="text-sm max-w-md">
          <p className="font-medium text-white mb-1">What this means</p>
          <p className="leading-relaxed text-neutral-400">
            This score estimates how well your resume may be parsed by Applicant Tracking Systems.
            It is an AI-generated assessment and should be treated as guidance, not a guarantee
            of how any specific ATS will handle your document.
          </p>
        </div>
      </div>

      {ats.positives.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">ATS Positives</h3>
          <ul className="space-y-2">
            {ats.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-neutral-300">{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {ats.concerns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">ATS Concerns</h3>
          <div className="space-y-4">
            {ats.concerns.map((c, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-subtle border border-white/5">
                <div className="flex items-start gap-3">
                  <Badge variant={severityMap[c.severity].variant}>
                    {severityMap[c.severity].label}
                  </Badge>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-white">{c.issue}</p>
                    <p className="text-sm text-neutral-400">
                      <strong className="text-neutral-300">Risk:</strong> {c.risk}
                    </p>
                    <p className="text-sm text-neutral-400">
                      <strong className="text-neutral-300">Recommendation:</strong> {c.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
