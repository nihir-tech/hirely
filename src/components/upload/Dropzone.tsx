import { useState, useCallback, useRef } from 'react'
import { validateFile, formatFileSize } from '../../lib/validation'
import { ALLOWED_EXTENSIONS } from '../../config'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

export function Dropzone({ onFile, disabled = false }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const file = files[0]
      const validation = validateFile(file)
      if (validation) {
        setError(validation.message)
        return
      }
      setError(null)
      onFile(file)
    },
    [onFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (disabled) return
      handleFiles(e.dataTransfer.files)
    },
    [disabled, handleFiles],
  )

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setDragOver(true)
    },
    [disabled],
  )

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
          p-8 sm:p-12 text-center cursor-pointer transition-all duration-300
          ${
            disabled
              ? 'opacity-40 cursor-not-allowed border-white/5 bg-surface-subtle'
              : dragOver
                ? 'border-brand-500/50 bg-brand-500/5 shadow-[0_0_40px_rgba(139,92,246,0.1)]'
                : error
                  ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/40'
                  : 'border-white/[0.08] bg-surface hover:border-brand-500/30 hover:bg-brand-500/[0.02]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
          disabled={disabled}
          aria-label="Upload resume file"
        />

        <div className={`mb-4 p-4 rounded-2xl transition-all duration-300 ${dragOver ? 'bg-brand-500/10 text-brand-400' : 'bg-neutral-800/30 text-neutral-500'}`}>
          <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>

        <p className="text-base font-medium text-white mb-1">
          {dragOver ? 'Drop your resume here' : 'Drag & drop your resume'}
        </p>
        <p className="text-sm text-neutral-400 mb-4">
          or <span className="text-brand-400 font-medium">browse files</span> from your computer
        </p>
        <p className="text-xs text-neutral-600">
          PDF, PNG, JPG, or WebP — up to 10 MB
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20" role="alert">
          <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}

interface FileCardProps {
  file: File
  preview?: string
  onRemove: () => void
  onReplace: () => void
}

export function FileCard({ file, preview, onRemove, onReplace }: FileCardProps) {
  const typeLabel =
    file.type === 'application/pdf'
      ? 'PDF'
      : file.type.replace('image/', '').toUpperCase()

  return (
    <div className="flex items-center gap-4 p-4 glass-card">
      {preview ? (
        <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-800/30 border border-white/5 shrink-0">
          <img src={preview} alt="Resume preview" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-16 h-20 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-400">{typeLabel}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {typeLabel} · {formatFileSize(file.size)}
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onReplace() }}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            Replace
          </button>
          <span className="text-neutral-600">·</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
