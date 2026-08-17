import type { ReactNode } from 'react'

interface Props {
  content: ReactNode
  children: ReactNode
  className?: string
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, className = '', position = 'top' }: Props) {
  const pos = position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'top-full left-1/2 -translate-x-1/2 mt-2'

  return (
    <div className={`relative inline-flex group/tooltip ${className}`}>
      {children}
      <div
        className={`absolute ${pos} pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50`}
        role="tooltip"
      >
        <div className="glass-strong text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  )
}
