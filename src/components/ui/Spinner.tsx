interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

export function Spinner({ size = 'md', className = '', label }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status">
      <svg
        className={`animate-spin text-brand-500 ${sizes[size]}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && <span className="text-sm text-neutral-400">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingProps {
  messages: string[]
  currentMessage?: string
  progress?: number
}

export function LoadingOverlay({ messages, currentMessage, progress }: LoadingProps) {
  const msg = currentMessage || messages[0]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* AI Orb */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-500/20 animate-pulse-glow" />
        <div className="absolute inset-0 w-20 h-20 rounded-full animate-ring-spin">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        </div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500/10 to-transparent" />
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-white">{msg}</p>
        {typeof progress === 'number' && (
          <div className="mt-4 w-64 mx-auto">
            <div className="h-1.5 rounded-full bg-neutral-800/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  boxShadow: '0 0 12px rgba(139,92,246,0.4)',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">{Math.round(progress)}% complete</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {messages.slice(0, 4).map((m) => (
          <span
            key={m}
            className={`text-xs px-3 py-1 rounded-full transition-all duration-300 ${
              m === msg
                ? 'bg-brand-500/20 text-brand-300 font-medium border border-brand-500/20'
                : messages.indexOf(m) < messages.indexOf(msg)
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-neutral-800/30 text-neutral-500 border border-white/5'
            }`}
          >
            {messages.indexOf(m) < messages.indexOf(msg) ? '✓ ' : ''}
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
