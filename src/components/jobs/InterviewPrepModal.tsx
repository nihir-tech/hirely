import { useState, useMemo } from 'react'
import type { AnalysisResult, InterviewQuestion, JobMatchAlert } from '../../types'
import { generateInterviewQuestions, fetchAiInterviewQuestions } from '../../lib/interviewGenerator'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CheckIcon, ClipboardIcon, LightbulbIcon, ZapIcon } from '../ui/Icons'

interface InterviewPrepModalProps {
  open: boolean
  onClose: () => void
  alert: JobMatchAlert | null
  resume?: AnalysisResult | null
}

export function InterviewPrepModal({
  open,
  onClose,
  alert,
  resume,
}: InterviewPrepModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({})
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [customQuestions, setCustomQuestions] = useState<InterviewQuestion[] | null>(null)

  const defaultKit = useMemo(() => {
    if (!alert) return null
    return generateInterviewQuestions(alert, resume)
  }, [alert, resume])

  if (!alert) return null

  const questions = customQuestions || defaultKit?.questions || []

  const categories = useMemo(() => {
    const list = Array.from(new Set(questions.map((q) => q.category)))
    return ['all', ...list]
  }, [questions])

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return questions
    return questions.filter((q) => q.category === selectedCategory)
  }, [questions, selectedCategory])

  const toggleAnswer = (id: string) => {
    setExpandedAnswers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopySingle = (q: InterviewQuestion) => {
    const text = `QUESTION:\n${q.question}\n\nWHY THEY ASK:\n${q.whyTheyAsk}\n\nKEY POINTS TO HIT:\n${q.keyPointsToHit.map((k) => `- ${k}`).join('\n')}\n\nMODEL ANSWER:\n${q.modelAnswer}`
    navigator.clipboard.writeText(text)
    setCopiedQuestionId(q.id)
    setTimeout(() => setCopiedQuestionId(null), 2500)
  }

  const handleCopyAllCheatSheet = () => {
    const header = `# Interview Cheat Sheet: ${alert.opening.title} @ ${alert.opening.company}\nCandidate: ${resume?.extracted.name || 'Candidate'}\nGenerated via Hirely AI\n\n`
    const body = questions
      .map(
        (q, idx) =>
          `### ${idx + 1}. [${q.category}] ${q.question}\n\n**Why They Ask:** ${q.whyTheyAsk}\n\n**Key Points:**\n${q.keyPointsToHit.map((k) => `- ${k}`).join('\n')}\n\n**Model Answer:**\n${q.modelAnswer}\n\n---`,
      )
      .join('\n\n')

    navigator.clipboard.writeText(header + body)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 3000)
  }

  const handleRegenerateWithAi = async () => {
    setIsGeneratingAi(true)
    try {
      const kit = await fetchAiInterviewQuestions(alert, resume)
      setCustomQuestions(kit.questions)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Interview Readiness Kit · ${alert.opening.title}`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleCopyAllCheatSheet}
              className={`inline-flex items-center gap-1.5 ${copiedAll ? 'text-emerald-400 border-emerald-500/40' : ''}`}
            >
              {copiedAll ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cheat Sheet Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="w-3.5 h-3.5" />
                  <span>Copy All as Cheat Sheet</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleRegenerateWithAi}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5"
            >
              {isGeneratingAi ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Fresh Questions...
                </>
              ) : (
                <>
                  <ZapIcon className="w-3.5 h-3.5" />
                  <span>Regenerate with AI</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Hero Header */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-fg-muted uppercase tracking-wider font-semibold">
                {alert.opening.company} · {alert.opening.type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30">
                {questions.length} Targeted Questions
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-fg-strong">
              Tailored Mock Interview & Answer Rubric
            </h3>

            <p className="text-xs text-fg-muted max-w-xl leading-relaxed">
              Questions calibrated to this exact job description, company scale, and your detected resume background.
              Includes high-scoring STAR framework model answers.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs font-semibold text-fg-strong">{alert.fitBadge}</span>
            <span className="text-[11px] text-brand-400 font-medium">{alert.score}% Profile Alignment</span>
          </div>
        </div>

        {/* Category Filter Tabs with smooth mobile horizontal scroll */}
        <div className="flex gap-1.5 border-b border-line pb-3 overflow-x-auto whitespace-nowrap scrollbar-none">
          {categories.map((cat) => {
            const count = cat === 'all' ? questions.length : questions.filter((q) => q.category === cat).length
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                    : 'bg-surface text-fg-muted border-line hover:text-fg-strong hover:border-brand-500/40'
                }`}
              >
                {cat === 'all' ? 'All Questions' : cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const isExpanded = Boolean(expandedAnswers[q.id])
            const wasCopied = copiedQuestionId === q.id

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-surface border border-line space-y-3.5 transition-all hover:border-brand-500/30"
              >
                {/* Question Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-subtle text-fg-muted border border-line">
                        {q.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          q.difficulty === 'Senior'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : q.difficulty === 'Challenging'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-fg-strong leading-snug">
                      "{q.question}"
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySingle(q)}
                    className="self-start px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-subtle hover:bg-surface border border-line text-fg-muted hover:text-fg-strong transition-colors shrink-0"
                  >
                    {wasCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* Recruiter Insight Box */}
                <div className="p-3 rounded-xl bg-surface-subtle border border-line/60 text-xs text-fg-muted space-y-1">
                  <span className="font-semibold text-fg-strong text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <LightbulbIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Why They Ask This:</span>
                  </span>
                  <p className="leading-relaxed pl-1">{q.whyTheyAsk}</p>
                </div>

                {/* Key Points Checklist */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-fg-strong uppercase tracking-wider">
                    Key Points You Must Hit:
                  </span>
                  <ul className="space-y-1 text-xs text-fg-muted pl-1">
                    {q.keyPointsToHit.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckIcon className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Model Answer Toggle & Content */}
                <div className="pt-2 border-t border-line/60">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(q.id)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>{isExpanded ? '▼ Hide Model Answer' : '▶ Reveal High-Scoring Model Answer (STAR Format)'}</span>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-brand-950/20 via-surface-subtle to-surface border border-brand-500/30 text-xs text-fg-strong leading-relaxed whitespace-pre-wrap animate-fade-in font-sans">
                      {q.modelAnswer}
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </Modal>
  )
}

