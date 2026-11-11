import { useState, useEffect, useRef, useCallback } from 'react'
import type { CoachMessage, AnalysisResult } from '../../types'
import { listAnalyses, listCoachMessages, saveCoachMessage, clearCoachMessages } from '../../lib/storage'
import { askCoach } from '../../lib/coach'
import { CheckIcon, LightbulbIcon, LogOutIcon, MessageSquareIcon, SparklesIcon } from '../ui/Icons'

interface ResumeCoachDrawerProps {
  activeResume?: AnalysisResult | null
}

const DEFAULT_SUGGESTIONS = [
  'How can I make my bullet points more impactful?',
  'What ATS keywords should I add?',
  'Give me 3 behavioral interview questions',
  'Write a punchy 2-sentence summary for me',
]

export function ResumeCoachDrawer({ activeResume }: ResumeCoachDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [resumes, setResumes] = useState<AnalysisResult[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>(activeResume?.id || '')
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Refresh available resumes whenever opened or prop changes
  useEffect(() => {
    const list = listAnalyses()
    setResumes(list)
    if (activeResume?.id) {
      setSelectedResumeId(activeResume.id)
    } else if (list.length > 0 && !selectedResumeId) {
      setSelectedResumeId(list[0].id)
    }
  }, [activeResume, isOpen, selectedResumeId])

  // Allow sidebar/navbar buttons to open Coach from anywhere
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    window.addEventListener('hirely:open-coach', onOpen)
    return () => window.removeEventListener('hirely:open-coach', onOpen)
  }, [])

  const currentResume = resumes.find((r) => r.id === selectedResumeId) || activeResume || null

  useEffect(() => {
    const saved = listCoachMessages(selectedResumeId)
    if (saved.length > 0) {
      setMessages(saved)
    } else {
      const welcomeMsg: CoachMessage = {
        id: 'welcome',
        sender: 'coach',
        text: `Hi! I'm your **Hirely AI Coach**.\n\nI've reviewed your profile${
          currentResume ? ` for **${currentResume.fileName}** (ATS: ${currentResume.ats.score}/100)` : ''
        }. Ask me anything — bullet rewrites, ATS keywords, coding concepts, system design, salary negotiation, or interview prep.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([welcomeMsg])
    }
  }, [selectedResumeId, currentResume?.fileName, currentResume?.ats.score])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isOpen, loading])

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim()
      if (!query || loading) return

      setInput('')
      const userMsg: CoachMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, userMsg])
      saveCoachMessage(userMsg, selectedResumeId)
      setLoading(true)

      try {
        const response = await askCoach({
          message: query,
          resume: currentResume,
          history: [...messages, userMsg],
        })

        const coachMsg: CoachMessage = {
          id: `coach-${Date.now()}`,
          sender: 'coach',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: response.suggestions,
        }

        setMessages((prev) => [...prev, coachMsg])
        saveCoachMessage(coachMsg, selectedResumeId)
        if (response.suggestions?.length) {
          setSuggestions(response.suggestions)
        }
      } catch {
        const errorMsg: CoachMessage = {
          id: `err-${Date.now()}`,
          sender: 'coach',
          text: 'Sorry, I encountered an issue while generating advice. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, currentResume, messages, selectedResumeId],
  )

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    clearCoachMessages(selectedResumeId)
    const resetMsg: CoachMessage = {
      id: 'welcome-reset',
      sender: 'coach',
      text: 'Chat cleared. What would you like help with next?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([resetMsg])
    setSuggestions(DEFAULT_SUGGESTIONS)
  }

  return (
    <>
      {/* Floating Launcher Button (hidden while open so it never overlaps drawer Send/Exit buttons) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[950] flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 border border-white/20"
          title="Open AI Resume Coach"
        >
          <div className="relative">
            <MessageSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-indigo-700" />
          </div>
          <span className="font-semibold tracking-wide">Resume Coach</span>
        </button>
      )}

      {/* Slide-out Chat Drawer — z-[1200] renders cleanly above global fixed Navbar (z-900) */}
      {isOpen && (
        <div className="fixed inset-0 z-[1200] overflow-hidden" data-lenis-prevent>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Exit Coach Backdrop"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6 pointer-events-none">
            <div className="w-screen max-w-full sm:max-w-md bg-canvas border-l border-line shadow-2xl flex flex-col h-full pointer-events-auto">
              
              {/* Header with explicit Exit Chat button */}
              <div className="p-3.5 sm:p-4 border-b border-line flex items-center justify-between gap-2 bg-surface/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-fg-strong truncate">Hirely Coach</h3>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-muted truncate">
                      Career, Coding &amp; Interview Advisor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear Chat History"
                    className="px-2.5 py-1.5 rounded-xl text-fg-muted hover:text-fg-strong hover:bg-surface-subtle transition-colors text-xs font-medium border border-transparent hover:border-line"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors shadow-xs whitespace-nowrap"
                    title="Exit Chat"
                  >
                    <LogOutIcon className="w-3.5 h-3.5" />
                    <span>Exit Chat</span>
                  </button>
                </div>
              </div>

              {/* Resume Context Bar */}
              {resumes.length > 0 && (
                <div className="px-4 py-2 border-b border-line bg-surface-subtle/70 flex items-center gap-2 text-xs">
                  <span className="text-fg-muted shrink-0 font-medium">Context:</span>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="flex-1 min-w-0 text-xs bg-surface border border-line rounded-lg px-2.5 py-1 text-fg-strong truncate focus:outline-none focus:border-brand-500"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fileName} (Score: {r.scores.overall})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => {
                  const isUser = m.sender === 'user'
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? 'bg-brand-600 text-white rounded-br-xs'
                            : 'bg-surface border border-line text-fg-strong rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {m.text}
                      </div>
                      
                      <div className="flex items-center gap-2 px-1 text-[10px] text-fg-faint">
                        <span>{m.timestamp}</span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopy(m.text, m.id)}
                            className="inline-flex items-center gap-1 hover:text-fg-strong transition-colors"
                          >
                            {copiedId === m.id ? (
                              <>
                                <CheckIcon className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              'Copy'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-fg-muted p-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                    <span>Coach is thinking...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Suggestions */}
              {suggestions.length > 0 && !loading && (
                <div className="px-4 py-2 border-t border-line/60 bg-surface/40">
                  <p className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
                    Suggested prompts
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void handleSend(s)}
                        className="inline-flex items-center gap-1.5 text-left text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-brand-500/50 hover:bg-surface-subtle text-fg-muted hover:text-fg-strong transition-all max-w-full"
                      >
                        <LightbulbIcon className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSend()
                }}
                className="p-3 border-t border-line bg-surface/90 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything (resume, coding, salary, interview)..."
                  className="flex-1 bg-surface border border-line rounded-xl px-3.5 py-2.5 text-xs text-fg-strong focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors shrink-0"
                >
                  Send
                </button>
              </form>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
