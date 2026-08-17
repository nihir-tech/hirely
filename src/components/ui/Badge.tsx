import type { ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'

interface Props {
  variant?: Variant
  children: ReactNode
  className?: string
}

const styles: Record<Variant, string> = {
  default: 'bg-neutral-800/30 text-neutral-300 border border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  brand: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
}

export function Badge({ variant = 'default', children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
