import { Card } from '../ui/Card'
import type { AnalysisResult } from '../../types'

export function StrengthsTab({ analysis }: { analysis: AnalysisResult }) {
  if (analysis.strengths.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-500">No specific strengths identified.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-neutral-500">
        These are the areas where your resume is already performing well.
      </p>
      {analysis.strengths.map((s, i) => (
        <Card key={i} className="p-5">
          <div className="flex gap-3">
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">{s.title}</h4>
              <p className="text-sm text-neutral-400 leading-relaxed">{s.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
