import type { ReactNode } from 'react'
import type { TabItem } from '../../types'

interface Props {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  badges?: Record<string, ReactNode>
}

export function Tabs({ items, active, onChange, badges }: Props) {
  return (
    <div className="border-b border-white/5">
      <nav className="flex overflow-x-auto -mb-px gap-0.5" aria-label="Tabs">
        {items.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-all duration-200
                ${
                  isActive
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:border-white/10'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
              {badges?.[item.id]}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
