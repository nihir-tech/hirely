import { useState } from 'react'
import type { ReactNode } from 'react'

interface Item {
  id: string
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

interface Props {
  items: Item[]
  className?: string
}

export function Accordion({ items, className = '' }: Props) {
  return (
    <div className={`divide-y divide-white/5 rounded-2xl border border-white/5 overflow-hidden ${className}`}>
      {items.map((item) => (
        <AccordionItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function AccordionItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(item.defaultOpen ?? false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-800/20 transition-colors"
        aria-expanded={open}
      >
        <span className="pr-4">{item.title}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-neutral-400">{item.children}</div>}
    </div>
  )
}

interface SingleProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function SingleAccordion({ title, children, defaultOpen = false }: SingleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-300 hover:bg-neutral-800/20 transition-colors"
        aria-expanded={open}
      >
        <span className="pr-4">{title}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-neutral-400">{children}</div>}
    </div>
  )
}
