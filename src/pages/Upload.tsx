import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropzone, FileCard } from '../components/upload/Dropzone'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { LoadingOverlay } from '../components/ui/Spinner'
import { extractResumeText } from '../lib/parsers'
import { saveAnalysis } from '../lib/storage'
import { analyzeResume } from '../lib/ai'
import { LOADING_MESSAGES } from '../config'

export function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

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

      setLoadingProgress(100)
      navigate(`/analyze/${record.id}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setLoading(false)
    }
  }, [file, navigate])

  return (
    <div className="min-h-[80vh] relative">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Analyze Your Resume</h1>
          <p className="mt-3 text-lg text-neutral-400">
            Upload your resume and get detailed AI-powered feedback.
          </p>
        </div>

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
              <Dropzone onFile={handleFile} />
            )}

            <div className="text-center">
              <p className="text-xs text-neutral-600 leading-relaxed max-w-md mx-auto">
                Your resume is processed securely. Content is sent to AI for analysis only and is not stored
                permanently unless you choose to save results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
