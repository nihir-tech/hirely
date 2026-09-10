import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ref, onValue, set, onDisconnect, type Unsubscribe, type DataSnapshot } from 'firebase/database'
import { db, firebaseConfigured } from '../lib/firebase'

const DEVICE_KEY = 'hirely:device_id'

export interface SiteStats {
  totalUsers: number
  liveUsers: number
}

function childCount(snap: DataSnapshot): number {
  const val = snap.val() as Record<string, unknown> | null
  return val ? Object.keys(val).length : 0
}

function getDeviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

const StatsContext = createContext<SiteStats | null>(null)

export function SiteStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<SiteStats | null>(null)

  useEffect(() => {
    if (!db || !firebaseConfigured) return
    const deviceId = getDeviceId()
    if (!deviceId) return

    const deviceRef = ref(db, `devices/${deviceId}`)
    const presenceRef = ref(db, `presence/${deviceId}`)
    const totalRef = ref(db, 'devices')
    const liveRef = ref(db, 'presence')

    void set(deviceRef, true)
    void set(presenceRef, true).then(() => {
      onDisconnect(presenceRef).remove()
    })

    const totalUnsub: Unsubscribe = onValue(totalRef, (snap) => {
      setStats((s) => ({ totalUsers: childCount(snap), liveUsers: s?.liveUsers ?? 0 }))
    })
    const liveUnsub: Unsubscribe = onValue(liveRef, (snap) => {
      setStats((s) => ({ totalUsers: s?.totalUsers ?? 0, liveUsers: childCount(snap) }))
    })

    const onPageHide = () => {
      onDisconnect(presenceRef).cancel()
      void set(presenceRef, null)
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      totalUnsub()
      liveUnsub()
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

  const value = useMemo(() => stats, [stats])
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export function useSiteStats(): SiteStats | null {
  return useContext(StatsContext)
}