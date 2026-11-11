import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '../../lib/auth'

interface SidebarContextValue {
  desktopExpanded: boolean
  mobileOpen: boolean
  isLoggedIn: boolean
  toggleSidebar: () => void
  setMobileOpen: (v: boolean) => void
  openCoachAgent: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  desktopExpanded: true,
  mobileOpen: false,
  isLoggedIn: false,
  toggleSidebar: () => {},
  setMobileOpen: () => {},
  openCoachAgent: () => {},
})

const STORAGE_KEY = 'hirely:sidebar_expanded'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const isLoggedIn = Boolean(!loading && user)

  const [desktopExpanded, setDesktopExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(desktopExpanded))
    } catch { /* ignore */ }
  }, [desktopExpanded])

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev)
    } else {
      setDesktopExpanded((prev) => !prev)
    }
  }

  const openCoachAgent = () => {
    setMobileOpen(false)
    window.dispatchEvent(new Event('hirely:open-coach'))
  }

  return (
    <SidebarContext.Provider
      value={{
        desktopExpanded,
        mobileOpen,
        isLoggedIn,
        toggleSidebar,
        setMobileOpen,
        openCoachAgent,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
