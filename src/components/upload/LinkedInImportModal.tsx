import { useState, useCallback, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { Spinner } from '../ui/Spinner'
import { parseLinkedInText, linkedInToExtractedInfo } from '../../lib/parsers/linkedin'
import { extractResumeText } from '../../lib/parsers'
import { analyzeResume } from '../../lib/ai'
import { saveAnalysis } from '../../lib/storage'
import { useNavigate } from 'react-router-dom'

interface LinkedInImportModalProps {
  open: boolean
  onClose: () => void
  initialText?: string
  sourceLabel?: string
}

export function LinkedInImportModal({ open, onClose, initialText, sourceLabel }: LinkedInImportModalProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>(initialText ? 'text' : 'pdf')
  const [pastedText, setPastedText] = useState(initialText || '')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressMsg, setProgressMsg] = useState('')

  useEffect(() => {
    if (open && initialText) {
      setActiveTab('text')
      setPastedText(initialText)
    }
  }, [open, initialText])

  const handleProcessText = useCallback(async (textToProcess: string, sourceName = 'LinkedIn-Profile') => {
    setLoading(true)
    setError(null)
    setProgressMsg('Parsing LinkedIn profile data...')

    try {
      const parsed = parseLinkedInText(textToProcess)
      const extracted = linkedInToExtractedInfo(parsed)

      setProgressMsg('Running AI resume and ATS analysis...')
      const aiResponse = await analyzeResume({ text: parsed.rawMarkdown })

      const record = saveAnalysis({
        fileName: `${parsed.name || sourceName} (LinkedIn)`,
        fileType: 'application/pdf',
        fileSize: textToProcess.length,
        resumeText: parsed.rawMarkdown,
        ...aiResponse.analysis,
        extracted: {
          ...aiResponse.analysis.extracted,
          ...extracted,
        },
      })

      onClose()
      navigate(`/analyze/${record.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import LinkedIn profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [navigate, onClose])

  const handleFileDrop = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setLoading(true)
    setProgressMsg('Extracting text from LinkedIn PDF...')

    try {
      const result = await extractResumeText(selectedFile, (msg) => setProgressMsg(msg))
      if (result.error) throw new Error(result.error)
      await handleProcessText(result.text, selectedFile.name.replace(/\.[^.]+$/, ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read LinkedIn PDF.')
      setLoading(false)
    }
  }, [handleProcessText])

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Import from LinkedIn"
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex border-b border-line gap-4 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            type="button"
            className={`pb-2.5 transition-colors ${
              activeTab === 'pdf'
                ? 'text-brand-400 border-b-2 border-brand-500 font-semibold'
                : 'text-fg-muted hover:text-fg-strong'
            }`}
            onClick={() => setActiveTab('pdf')}
          >
            LinkedIn PDF Export (Recommended)
          </button>
          <button
            type="button"
            className={`pb-2.5 transition-colors ${
              activeTab === 'text'
                ? 'text-brand-400 border-b-2 border-brand-500 font-semibold'
                : 'text-fg-muted hover:text-fg-strong'
            }`}
            onClick={() => setActiveTab('text')}
          >
            Paste Profile Text
          </button>
        </div>

        {error && (
          <Alert variant="error" title="Import Error">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Spinner size="lg" label={progressMsg} />
            <p className="text-xs text-fg-muted">Building your ATS-optimized resume profile...</p>
          </div>
        ) : activeTab === 'pdf' ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-line text-xs text-fg-muted space-y-1.5">
              <p className="font-semibold text-fg-strong">How to get your LinkedIn PDF in 10 seconds:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Go to your profile on <strong>linkedin.com</strong></li>
                <li>Click the <strong>More</strong> button (next to "Add profile section")</li>
                <li>Click <strong>"Save to PDF"</strong></li>
                <li>Drop the downloaded file right here below!</li>
              </ol>
            </div>

            <label
              className="border-2 border-dashed border-line hover:border-brand-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-subtle/50 hover:bg-surface-subtle"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-fg-strong">
                {file ? file.name : 'Click or drop your LinkedIn PDF here'}
              </p>
              <p className="text-xs text-fg-muted mt-1">Accepts standard LinkedIn .pdf exports</p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFileDrop(f)
                }}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {sourceLabel && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium">
                ✓ Profile text imported via Hirely Extension ({sourceLabel}). Review below and click <strong>Import &amp; Analyze</strong>!
              </div>
            )}
            <p className="text-xs text-fg-muted">
              Select all text on your LinkedIn profile page (Ctrl+A / Cmd+A or copy sections like About, Experience, Education) and paste it below:
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste LinkedIn profile text here (Headline, About, Experience, Skills, Education)..."
              rows={8}
              className="w-full p-3.5 text-xs font-mono text-fg-strong bg-surface border border-line rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={pastedText.trim().length < 50}
                onClick={() => void handleProcessText(pastedText, sourceLabel || 'LinkedIn-Import')}
              >
                Import & Analyze
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
