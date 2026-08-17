import { useEffect, useRef } from 'react'
import { SCORE_THRESHOLDS } from '../../config'

interface Props {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

function getColor(value: number): string {
  if (value >= SCORE_THRESHOLDS.excellent) return '#34d399'
  if (value >= SCORE_THRESHOLDS.good) return '#a78bfa'
  if (value >= SCORE_THRESHOLDS.fair) return '#fbbf24'
  return '#f87171'
}

function getScoreLabel(value: number): string {
  if (value >= SCORE_THRESHOLDS.excellent) return 'Excellent'
  if (value >= SCORE_THRESHOLDS.good) return 'Good'
  if (value >= SCORE_THRESHOLDS.fair) return 'Fair'
  return 'Needs Work'
}

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference
  const color = getColor(value)
  const animated = useRef(false)
  const circleRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!animated.current && circleRef.current) {
      circleRef.current.style.strokeDashoffset = circumference.toString()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (circleRef.current) {
            circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
            circleRef.current.style.strokeDashoffset = offset.toString()
          }
        })
      })
      animated.current = true
    }
  }, [circumference, offset])

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
            {getScoreLabel(value)}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-neutral-300">{label}</span>
      )}
      {sublabel && (
        <span className="text-xs text-neutral-500">{sublabel}</span>
      )}
    </div>
  )
}

interface BarProps {
  label: string
  value: number
  max?: number
}

export function ScoreBar({ label, value, max = 100 }: BarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const color = getColor(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-300">{label}</span>
        <span className="text-sm font-semibold text-white">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  )
}
