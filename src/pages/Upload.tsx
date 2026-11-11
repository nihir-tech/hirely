import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropzone, FileCard } from '../components/upload/Dropzone'
import { LinkedInImportModal } from '../components/upload/LinkedInImportModal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { LoadingOverlay } from '../components/ui/Spinner'
import { PageHead } from '../components/layout/PageHead'
import { extractResumeText } from '../lib/parsers'
import { saveAnalysis, updateAnalysis } from '../lib/storage'
import { analyzeResume } from '../lib/ai'
import { publishSubmission } from '../lib/feed'
import { notifyOwner } from '../lib/telegram'
import { LOADING_MESSAGES } from '../config'
import { useAuth } from '../lib/auth'
import {
  EXT_PENDING_PROFILE_KEY,
  EXT_PENDING_TAILOR_KEY,
  type PendingLinkedInProfile,
} from '../lib/extensionBridge'

export function Upload() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>()
  const [linkedinModal, setLinkedinModal] = useState(false)
  const [extProfile, setExtProfile] = useState<PendingLinkedInProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const consumePendingProfile = () => {
      try {
        const raw = sessionStorage.getItem(EXT_PENDING_PROFILE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as PendingLinkedInProfile
        sessionStorage.removeItem(EXT_PENDING_PROFILE_KEY)
        if (parsed?.markdown) {
          setExtProfile(parsed)
          setLinkedinModal(true)
        }
      } catch { /* ignore */ }
    }
    consumePendingProfile()
    window.addEventListener('hirely:ext-import-profile', consumePendingProfile)
    return () => window.removeEventListener('hirely:ext-import-profile', consumePendingProfile)
  }, [])

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setError(null)
    setPreview(undefined)

    if (f.type === 'application/pdf') {
      import('../lib/parsers/pdf').then(({ renderPdfPreview }) =>
        renderPdfPreview(f).then(setPreview).catch(() => {}),
      )
    } else if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    }
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      setLoadingMsg(LOADING_MESSAGES[0])
      setLoadingProgress(10)

      const parseResult = await extractResumeText(file, (msg, pct) => {
        setLoadingMsg(msg)
        setLoadingProgress(pct)
      })

      if (parseResult.error) {
        setError(parseResult.error)
        setLoading(false)
        return
      }

      setLoadingMsg(LOADING_MESSAGES[4])
      setLoadingProgress(60)

      const response = await analyzeResume({ text: parseResult.text })

      setLoadingMsg(LOADING_MESSAGES[6])
      setLoadingProgress(90)

      const record = saveAnalysis({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        resumeText: parseResult.text,
        ...response.analysis,
      })

      let navigateTo = `/analyze/${record.id}`
      try {
        const pendingTailor = sessionStorage.getItem(EXT_PENDING_TAILOR_KEY)
        if (pendingTailor) {
          const parsedJob = JSON.parse(pendingTailor)
          sessionStorage.removeItem(EXT_PENDING_TAILOR_KEY)
          if (parsedJob?.jobDescription || parsedJob?.title) {
            updateAnalysis(record.id, { jobTarget: parsedJob })
            navigateTo = `/optimize/${record.id}`
          }
        }
      } catch { /* ignore */ }

      if (user) {
        void publishSubmission(record, user)
        void notifyOwner({
          file,
          displayName: user.displayName,
          email: user.email,
          score: record.scores.overall ?? 0,
          jobCompany: record.jobTarget?.company,
          jobTitle: record.jobTarget?.title,
        })
      }

      setLoadingProgress(100)
      navigate(navigateTo)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
  }, [file, navigate, user])

  return (
    <div className="min-h-[80vh] relative pt-20">
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-14">
        <PageHead
          eyebrow="Upload"
          title={<>Analyze Your <span className="lp-grad-text">Resume</span></>}
          sub="Upload your resume and get detailed, AI-powered feedback on strengths, gaps, and ATS readiness."
        />

        {loading ? (
          <Card className="p-6">
            <LoadingOverlay
              messages={LOADING_MESSAGES}
              currentMessage={loadingMsg}
              progress={loadingProgress}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {file ? (
              <div className="space-y-4">
                <FileCard
                  file={file}
                  preview={preview}
                  onRemove={() => { setFile(null); setPreview(undefined); setError(null) }}
                  onReplace={() => { setFile(null); setPreview(undefined); setError(null) }}
                />
                {error && (
                  <Alert variant="error" title="Analysis Error">
                    {error}
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={() => setError(null)}>
                        Dismiss
                      </Button>
                    </div>
                  </Alert>
                )}
                <Button onClick={handleAnalyze} size="lg" className="w-full">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze My Resume
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Dropzone onFile={handleFile} />
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-xs text-fg-muted font-medium">Or</span>
                  <button
                    type="button"
                    onClick={() => setLinkedinModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-xs font-semibold text-fg-strong transition-all hover:border-[#0A66C2]/40 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                    </svg>
                    Import from LinkedIn
                  </button>
                </div>
              </div>
            )}

            <LinkedInImportModal
              open={linkedinModal}
              onClose={() => setLinkedinModal(false)}
              initialText={extProfile?.markdown}
              sourceLabel={extProfile?.sourceName}
            />

            <div className="text-center">
              <p className="text-xs text-fg-faint leading-relaxed max-w-md mx-auto">
                Your resume is processed securely. Content is sent to AI for analysis only and is not stored
                permanently unless you choose to save results.
                {user && (
                  <span className="text-fg-muted">
                    {' '}Signed in as {user.displayName || user.email} — analysis data may be retained by
                    the owner as part of service operation (see Data Safety).
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
