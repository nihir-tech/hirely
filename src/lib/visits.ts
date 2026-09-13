import { push, ref } from 'firebase/database'
import { db, firebaseConfigured } from './firebase'
import { getDeviceId } from './device'

export type VisitKind = 'visit' | 'login' | 'analyze'

export function logVisit(kind: VisitKind, opts: { email?: string; displayName?: string } = {}) {
  if (!db || !firebaseConfigured) return
  push(ref(db, 'visits'), {
    deviceId: getDeviceId() ?? '',
    email: opts.email ?? '',
    displayName: opts.displayName ?? '',
    kind,
    at: Date.now(),
  }).catch(() => {})
}