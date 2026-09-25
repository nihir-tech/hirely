import { ScoreBar } from '../ui/ScoreRing'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Accordion } from '../ui/Accordion'
import type { AnalysisResult, SectionReviewItem } from '../../types'

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-fg-strong font-medium truncate ml-4">{value}</dd>
    </div>
  )
}

export function OverviewTab({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-fg-strong mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {analysis.scores.categories.map((cat) => (
              <ScoreBar key={cat.key} label={cat.label} value={cat.score} />
            ))}
          </div>
          <p className="mt-4 text-xs text-fg-faint">
            Scores are AI-generated estimates for guidance only, not objective hiring metrics.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-fg-strong mb-4">Detected Information</h3>
          <dl className="space-y-2 text-sm">
            {analysis.extracted.name && <Info label="Name" value={analysis.extracted.name} />}
            {analysis.extracted.email && <Info label="Email" value={analysis.extracted.email} />}
            {analysis.extracted.phone && <Info label="Phone" value={analysis.extracted.phone} />}
            {analysis.extracted.location && <Info label="Location" value={analysis.extracted.location} />}
            {analysis.extracted.linkedin && <Info label="LinkedIn" value={analysis.extracted.linkedin} />}
            {analysis.extracted.github && <Info label="GitHub" value={analysis.extracted.github} />}
          </dl>
          <div className="mt-4">
            <p className="text-xs font-medium text-fg-muted mb-2">Detected Sections:</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.extracted.detectedSections.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {analysis.quickWins.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-fg-strong mb-4">Quick Wins</h3>
          <ul className="space-y-3">
            {analysis.quickWins.map((w, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
                <div>
                  <p className="text-sm font-medium text-fg-strong">{w.title}</p>
                  <p className="text-sm text-fg-muted">{w.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {analysis.missingInfo.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-fg-strong mb-4">Missing Information</h3>
          <ul className="space-y-3">
            {analysis.missingInfo.map((m, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                <div>
                  <p className="text-sm font-medium text-fg-strong">{m.field}</p>
                  <p className="text-sm text-fg-muted">{m.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-fg-strong mb-4">Section-by-Section Review</h3>
        <Accordion
          items={(Object.entries(analysis.sections) as [string, SectionReviewItem[]][])
            .filter(([, items]) => items.length > 0)
            .map(([section, items]) => ({
              id: section,
              title: `${section.charAt(0).toUpperCase() + section.slice(1)} (${items.length} items)`,
              children: (
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i} className="p-3 rounded-xl bg-surface-subtle border border-line">
                      <p className="text-sm font-medium text-red-400 mb-1">{item.what}</p>
                      <p className="text-sm text-fg-muted mb-1"><strong className="text-fg-strong">Why:</strong> {item.why}</p>
                      <p className="text-sm text-fg-muted mb-1"><strong className="text-fg-strong">Change:</strong> {item.change}</p>
                      {item.example && (
                        <p className="text-sm text-emerald-400 mt-2 italic">Example: &ldquo;{item.example}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ul>
              ),
            }))}
        />
      </Card>
    </div>
  )
}
