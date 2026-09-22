import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ref, onValue, set, remove, onDisconnect, type Unsubscribe, type DataSnapshot } from 'firebase/database'
import { db, firebaseConfigured } from '../lib/firebase'
import { useAuth } from '../lib/auth'
import { getDeviceId } from '../lib/device'
import { logVisit } from '../lib/visits'

export interface SiteStats {
  totalUsers: number
  liveUsers: number
}

export const PRESENCE_STALE_MS = 90_000
export const PRESENCE_HEARTBEAT_MS = 30_000

function childCount(snap: DataSnapshot): number {
  const val = snap.val() as Record<string, unknown> | null
  return val ? Object.keys(val).length : 0
}

function isStalePresence(value: unknown, now: number): boolean {
  const at = typeof value === 'object' && value !== null ? (value as { at?: unknown }).at : undefined
  return typeof at !== 'number' || now - at > PRESENCE_STALE_MS
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

    const beatSession = () => {
      void set(sessionRef, {
        email: user.email,
        displayName: user.displayName ?? '',
        at: Date.now(),
      })
        .then(() => {
          onDisconnect(sessionRef).remove()
        })
        .catch(() => {})
    }
    beatSession()

    const sessionHeartbeat = window.setInterval(beatSession, PRESENCE_HEARTBEAT_MS)

    const onPageHide = () => {
      onDisconnect(sessionRef).cancel()
      void set(sessionRef, null)
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(sessionHeartbeat)
      window.removeEventListener('pagehide', onPageHide)
      onDisconnect(sessionRef).cancel()
      void set(sessionRef, null)
    }
  }, [user?.email, user?.displayName])

  useEffect(() => {
    if (!db || !firebaseConfigured) return
    const database = db
    const deviceId = getDeviceId()
    if (!deviceId) return

    const deviceRef = ref(database, `devices/${deviceId}`)
    const presenceRef = ref(database, `presence/${deviceId}`)
    const totalRef = ref(database, 'devices')
    const liveRef = ref(database, 'presence')

    let liveData: Record<string, unknown> | null = null

    const applyLiveCount = () => {
      if (!liveData) return
      const now = Date.now()
      let count = 0
      for (const key of Object.keys(liveData)) {
        if (isStalePresence(liveData[key], now)) {
          void remove(ref(database, `presence/${key}`)).catch(() => {})
        } else {
          count++
        }
      }
      setStats((s) => ({ totalUsers: s?.totalUsers ?? 0, liveUsers: count }))
    }

    void set(deviceRef, true)

    const beatPresence = () => {
      void set(presenceRef, { at: Date.now() })
        .then(() => {
          onDisconnect(presenceRef).remove()
        })
        .catch(() => {})
    }
    beatPresence()

    const totalUnsub: Unsubscribe = onValue(totalRef, (snap) => {
      setStats((s) => ({ totalUsers: childCount(snap), liveUsers: s?.liveUsers ?? 0 }))
    })
    const liveUnsub: Unsubscribe = onValue(liveRef, (snap) => {
      liveData = (snap.val() as Record<string, unknown> | null) ?? {}
      applyLiveCount()
    })

    const presenceHeartbeat = window.setInterval(() => {
      beatPresence()
      applyLiveCount()
    }, PRESENCE_HEARTBEAT_MS)

    const onPageHide = () => {
      onDisconnect(presenceRef).cancel()
      void set(presenceRef, null)
    }
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(presenceHeartbeat)
      totalUnsub()
      liveUnsub()
      window.removeEventListener('pagehide', onPageHide)
      onDisconnect(presenceRef).cancel()
      void set(presenceRef, null)
    }
  }, [])

  const value = useMemo(() => stats, [stats])
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export function useSiteStats(): SiteStats | null {
  return useContext(StatsContext)
}