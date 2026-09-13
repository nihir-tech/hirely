import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ref, onValue, set, onDisconnect, type Unsubscribe, type DataSnapshot } from 'firebase/database'
import { db, firebaseConfigured } from '../lib/firebase'
import { useAuth } from '../lib/auth'
import { getDeviceId } from '../lib/device'
import { logVisit } from '../lib/visits'

export interface SiteStats {
  totalUsers: number
  liveUsers: number
}

function childCount(snap: DataSnapshot): number {
  const val = snap.val() as Record<string, unknown> | null
  return val ? Object.keys(val).length : 0
}

const StatsContext = createContext<SiteStats | null>(null)

export function SiteStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [stats, setStats] = useState<SiteStats | null>(null)
  const prevEmail = useRef<string | null>(null)

  useEffect(() => {
    if (!db || !firebaseConfigured) return
    logVisit('visit', {
      email: user?.email ?? undefined,
      displayName: user?.displayName ?? undefined,
    })
  }, [])

  useEffect(() => {
    const prev = prevEmail.current
    prevEmail.current = user?.email ?? null
    if (!db || !firebaseConfigured) return
    if (user?.email && prev !== user.email) {
      logVisit('login', { email: user.email, displayName: user.displayName ?? '' })
    }
  }, [user?.email])

  useEffect(() => {
    if (!db || !firebaseConfigured) return
    const deviceId = getDeviceId()
    if (!deviceId) return

    const sessionRef = ref(db, `sessions/${deviceId}`)
    if (!user?.email) {
      void set(sessionRef, null).catch(() => {})
      return
    }

    void set(sessionRef, {
      email: user.email,
      displayName: user.displayName ?? '',
      at: Date.now(),
    })
      .then(() => {
        onDisconnect(sessionRef).remove()
      })
      .catch(() => {})

    const onPageHide = () => {
      onDisconnect(sessionRef).cancel()
      void set(sessionRef, null)
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.removeEventListener('pagehide', onPageHide)
      onDisconnect(sessionRef).cancel()
      void set(sessionRef, null)
    }
  }, [user?.email, user?.displayName])

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