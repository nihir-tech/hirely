import { push, ref } from 'firebase/database'
import type { User } from 'firebase/auth'
import { db, firebaseConfigured } from './firebase'
import { logVisit } from './visits'
import { sendTelegramText } from './telegram'
import type { AnalysisResult } from '../types'

export interface Submission {
  key: string
  email: string
  displayName: string
  fileName: string
  overallScore: number
  atsScore: number
  jobMatchScore: number | null
  jobCompany: string | null
  jobTitle: string | null
  sections: number
  createdAt: string
}

export function publishSubmission(record: AnalysisResult, user: User): Promise<boolean> {
  if (!db || !firebaseConfigured) return Promise.resolve(false)
  return push(ref(db, 'submissions'), {
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    fileName: record.fileName,
    overallScore: record.scores.overall ?? 0,
    atsScore: record.ats?.score ?? 0,
    jobMatchScore: record.jobMatch?.score ?? null,
    jobCompany: record.jobTarget?.company ?? null,
    jobTitle: record.jobTarget?.title ?? null,
    sections: record.extracted?.detectedSections?.length ?? 0,
    createdAt: new Date().toISOString(),
  })
    .then(() => {
      logVisit('analyze', {
        email: user.email ?? '',
        displayName: user.displayName ?? '',
      })
      const lines = [
        `📊 New analysis`,
        `👤 ${user.displayName || 'Hirely user'}`,
        `📧 ${user.email ?? ''}`,
        `🏆 Score: ${record.scores.overall ?? '—'}`,
      ]
      if (record.jobTarget?.company) {
        lines.push(`🎯 Target: ${record.jobTarget.company}${record.jobTarget.title ? ` — ${record.jobTarget.title}` : ''}`)
      }
      lines.push(`🕒 ${new Date().toLocaleString()}`)
      void sendTelegramText(lines.join('\n'))
      return true
    })
    .catch((err) => {
      console.warn('Failed to publish submission:', err?.message ?? err)
      return false
    })
}