import type { ReactNode } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'

interface Props {
  variant?: Variant
  children: ReactNode
  className?: string
}

const styles: Record<Variant, string> = {
  default: 'bg-chip text-fg-strong border border-line',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  error: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20',
  brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20',
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
