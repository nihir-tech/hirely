interface Props {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: string
  label?: string
  className?: string
}

const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

export function Progress({
  value,
  max = 100,
  size = 'md',
  color = '#8b5cf6',
  label,
  className = '',
}: Props) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`${heights[size]} rounded-full bg-neutral-800/30 overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
        />
      </div>
    </div>
  )
}
