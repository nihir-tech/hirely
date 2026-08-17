import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAnalyses, deleteAnalysis } from '../lib/storage'
import type { AnalysisResult } from '../types'
import { ScoreRing } from '../components/ui/ScoreRing'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Tabs } from '../components/ui/Tabs'

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'job-matched', label: 'Job Matched' },
  { id: 'no-job', label: 'No Job Target' },
]

export function Dashboard() {
  const [all, setAll] = useState<AnalysisResult[]>(() => listAnalyses())
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...all]

    if (filter === 'job-matched') {
      list = list.filter((r) => r.jobMatch)
    } else if (filter === 'no-job') {
      list = list.filter((r) => !r.jobMatch)
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.scores.overall ?? 0) - (a.scores.overall ?? 0))
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return list
  }, [all, filter, sortBy])

  const handleDelete = (id: string) => {
    deleteAnalysis(id)
    setAll(listAnalyses())
    setConfirmDelete(null)
  }

  const tabsBadges = useMemo(
    () => ({
      all: all.length || undefined,
      'job-matched': all.filter((r) => r.jobMatch).length || undefined,
      'no-job': all.filter((r) => !r.jobMatch).length || undefined,
    }),
    [all],
  )

  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {all.length} resume analysis{all.length !== 1 && 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              Sort by Date
            </Button>
            <Button
              variant={sortBy === 'score' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSortBy('score')}
            >
              Sort by Score
            </Button>
            <Link
              to="/upload"
              className="glass-button inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </Link>
          </div>
        </div>

        <Tabs items={STATUS_TABS} active={filter} onChange={setFilter} badges={tabsBadges} />

        <div className="mt-6 space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="group">
              <Link
                to={`/analyze/${r.id}`}
                className="block glass-card p-4 sm:p-5 hover:border-brand-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="hidden sm:flex shrink-0">
                      <ScoreRing value={r.scores.overall} size={56} strokeWidth={5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                        {r.fileName}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                        {r.extracted.detectedSections.length} sections
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.extracted.detectedSections.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-neutral-800/30 text-[10px] text-neutral-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:ml-4">
                    <div className="sm:hidden">
                      <ScoreRing value={r.scores.overall} size={48} strokeWidth={4} />
                    </div>
                    {r.jobMatch && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">Job Match</p>
                        <p className="text-lg font-bold text-brand-400">{r.jobMatch.score}%</p>
                      </div>
                    )}
                    {r.jobTarget?.company && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">Target</p>
                        <p className="text-sm font-medium text-neutral-300">{r.jobTarget.company}</p>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setConfirmDelete(r.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {filtered.length === 0 && (
            <EmptyState
              title="No analyses found"
              description="Upload a resume to get started."
              action={{ label: 'Upload Resume', onClick: () => window.location.assign('/upload') }}
            />
          )}
        </div>
      </div>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Analysis"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-400">
          Are you sure you want to delete this analysis? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
