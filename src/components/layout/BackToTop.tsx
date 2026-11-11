import { useEffect, useState } from 'react'
import { useSidebar } from './SidebarContext'
import { smoothScrollTo } from '../../lib/smoothScroll'

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const { isLoggedIn, desktopExpanded } = useSidebar()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const sidebarOffsetClass = isLoggedIn
    ? desktopExpanded
      ? 'lg:!left-[262px]'
      : 'lg:!left-[88px]'
    : ''

  return (
    <button
      type="button"
      className={`lp-to-top ${sidebarOffsetClass}${visible ? ' lp-to-top-visible' : ''}`}
      aria-label="Back to top"
      title="Back to top"
      onClick={() => smoothScrollTo(0, { offset: 0 })}
    >
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
