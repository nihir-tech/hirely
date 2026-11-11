import { Fragment, type MouseEvent } from 'react'

export interface TextSegment {
  text: string
  grad?: boolean
}

/**
 * Splits a heading into accessible, React-owned word and character spans
 * so GSAP ScrollTrigger can scrub character illumination without mutating
 * external DOM nodes under React 19.
 */
export function SplitScrollText({
  segments,
  className = '',
}: {
  segments: TextSegment[]
  className?: string
}) {
  const fullText = segments.map((s) => s.text).join('')

  return (
    <span className={`lp-scrub-text ${className}`.trim()} aria-label={fullText}>
      <span aria-hidden="true">
        {segments.map((seg, si) => {
          const tokens = seg.text.split(/(\s+)/)
          return (
            <span key={si} className={seg.grad ? 'lp-grad-text' : undefined}>
              {tokens.map((token, ti) => {
                if (/^\s+$/.test(token)) {
                  return <Fragment key={ti}>{token}</Fragment>
                }
                if (!token) return null
                return (
                  <span key={ti} className="lp-scrub-word">
                    {Array.from(token).map((ch, ci) => (
                      <span key={ci} className="lp-scrub-ch">
                        {ch}
                      </span>
                    ))}
                  </span>
                )
              })}
            </span>
          )
        })}
      </span>
    </span>
  )
}

/**
 * Sets cursor-origin coordinates (--ex-x, --ex-y) for the liquid ink-fill hover effect.
 */
export function handleExplodePointer(e: MouseEvent<HTMLElement>, active: boolean) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  el.style.setProperty('--ex-x', `${x}px`)
  el.style.setProperty('--ex-y', `${y}px`)
  if (active) {
    el.classList.add('is-exploding')
  } else {
    el.classList.remove('is-exploding')
  }
}

/**
 * Single delegated pointer listener driving radial cursor spotlights across landing cards.
 */
export function attachLandingSpotlights(root: HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {}
  if (window.matchMedia('(pointer: coarse)').matches) return () => {}

  let activeCard: HTMLElement | null = null

  const onMove = (e: PointerEvent) => {
    const target = (e.target as HTMLElement | null)?.closest('.lp-spotlight-card') as HTMLElement | null
    if (activeCard && activeCard !== target) {
      activeCard.style.removeProperty('--mx')
      activeCard.style.removeProperty('--my')
    }
    activeCard = target
    if (!target) return
    const rect = target.getBoundingClientRect()
    target.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    target.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  const onLeave = () => {
    if (activeCard) {
      activeCard.style.removeProperty('--mx')
      activeCard.style.removeProperty('--my')
      activeCard = null
    }
  }

  root.addEventListener('pointermove', onMove, { passive: true })
  root.addEventListener('pointerleave', onLeave, { passive: true })
  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerleave', onLeave)
  }
}

