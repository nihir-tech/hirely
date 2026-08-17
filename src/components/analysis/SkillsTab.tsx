import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { AnalysisResult } from '../../types'

export function SkillsTab({ analysis }: { analysis: AnalysisResult }) {
  const { skills } = analysis

  return (
    <div className="space-y-6 animate-fade-in">
      {skills.detected.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Detected Skills</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Skills identified from your resume content.
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.detected.map((s) => (
              <Badge key={s} variant="brand">{s}</Badge>
            ))}
          </div>
        </Card>
      )}

      {skills.recommended.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Recommended Keywords</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Keywords that are commonly valued in your industry. Consider whether any of these
            apply to your experience.
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.recommended.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </Card>
      )}

      {skills.detected.length === 0 && skills.recommended.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-500">
            Skills analysis will appear here after AI processes your resume.
          </p>
        </Card>
      )}
    </div>
  )
}
