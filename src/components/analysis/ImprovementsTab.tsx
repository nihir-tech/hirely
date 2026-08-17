import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { AnalysisResult, Severity } from '../../types'

const severityMap: Record<Severity, { label: string; variant: 'error' | 'warning' | 'info' }> = {
  high: { label: 'High', variant: 'error' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'info' },
}

export function ImprovementsTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {analysis.problems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Problems</h3>
          <div className="space-y-3">
            {analysis.problems.map((p, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-3">
                  <Badge variant={severityMap[p.severity].variant}>
                    {severityMap[p.severity].label}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-1">{p.title}</h4>
                    <p className="text-sm text-neutral-400 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysis.bullets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Bullet Point Improvements</h3>
          <div className="space-y-3">
            {analysis.bullets.map((b, i) => (
              <Card key={i} className="p-5">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs font-medium text-red-400 mb-1">Current</p>
                    <p className="text-sm text-neutral-300 italic">&ldquo;{b.original}&rdquo;</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-xs font-medium text-emerald-400 mb-1">Suggested</p>
                    <p className="text-sm text-neutral-300 italic">&ldquo;{b.suggestion}&rdquo;</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-0.5">Issue</p>
                    <p className="text-sm text-neutral-400">{b.issue}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-0.5">Why</p>
                    <p className="text-sm text-neutral-400">{b.reason}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {analysis.summarySuggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Summary Improvements</h3>
          <div className="space-y-3">
            {analysis.summarySuggestions.map((s, i) => (
              <Card key={i} className="p-5">
                <div className="space-y-3">
                  {s.current && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-xs font-medium text-red-400 mb-1">Current</p>
                      <p className="text-sm text-neutral-300 italic">{s.current}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-xs font-medium text-emerald-400 mb-1">Suggested</p>
                    <p className="text-sm text-neutral-300 italic">{s.suggested}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-0.5">Reason</p>
                    <p className="text-sm text-neutral-400">{s.reason}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
