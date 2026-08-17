import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Alert } from '../ui/Alert'
import type { AnalysisResult, ChangeSuggestion } from '../../types'

interface Props {
  analysis: AnalysisResult
  onUpdate: (id: string, accepted: boolean | null) => void
  onEdit: (id: string, suggested: string) => void
}

export function ChangesTab({ analysis, onUpdate, onEdit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const changes = analysis.jobMatch?.changes ?? []
  const accepted = changes.filter(c => c.accepted === true).length
  const rejected = changes.filter(c => c.accepted === false).length
  const pending = changes.filter(c => c.accepted == null).length

  const startEdit = (change: ChangeSuggestion) => {
    setEditingId(change.id)
    setEditText(change.suggested)
  }

  const saveEdit = () => {
    if (editingId) {
      onEdit(editingId, editText)
      setEditingId(null)
    }
  }

  if (changes.length === 0) {
    return (
      <div className="animate-fade-in">
        <Alert variant="info" title="No suggested changes yet">
          Run a job-match analysis to see suggested changes tailored to a specific role.
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="success">{accepted} accepted</Badge>
        <Badge variant="error">{rejected} rejected</Badge>
        <Badge>{pending} pending</Badge>
        <span className="text-sm text-neutral-500 ml-auto">
          {accepted}/{changes.length} changes accepted
        </span>
      </div>

      <Alert variant="info">
        Review each suggested change. Accept the ones you agree with, reject others, and edit
        any that need adjustment. Your original content is never modified automatically.
      </Alert>

      <div className="space-y-4">
        {changes.map((change) => {
          const borderClass =
            change.accepted === true
              ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
              : change.accepted === false
                ? 'border-red-500/20 bg-red-500/[0.02]'
                : 'border-white/5'

          return (
            <Card key={change.id} className={`p-5 !rounded-2xl ${borderClass}`}>
              <div className="flex items-center justify-between mb-3">
                <Badge>{change.section}</Badge>
                <div className="flex gap-2">
                  {change.accepted == null ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate(change.id, false)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onUpdate(change.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(change)}
                      >
                        Edit
                      </Button>
                    </>
                  ) : change.accepted ? (
                    <Badge variant="success">Accepted</Badge>
                  ) : (
                    <Badge variant="error">Rejected</Badge>
                  )}
                </div>
              </div>

              {change.current && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Current</p>
                  <p className="text-sm text-neutral-400 p-3 rounded-xl bg-surface-subtle border border-white/[0.05] italic">
                    {change.current}
                  </p>
                </div>
              )}

              <div className="mb-2">
                <p className="text-xs font-medium text-neutral-500 mb-1">Suggested</p>
                <p className="text-sm text-neutral-200 p-3 rounded-xl bg-brand-500/5 border border-brand-500/10">
                  {change.suggested}
                </p>
              </div>

              <p className="text-xs text-neutral-500">
                <strong>Reason:</strong> {change.reason}
              </p>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit Suggestion"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Edit</Button>
          </>
        }
      >
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full h-40 p-4 text-sm text-white bg-surface border border-white/[0.08] rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent"
        />
      </Modal>
    </div>
  )
}
