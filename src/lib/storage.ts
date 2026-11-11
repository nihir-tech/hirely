import type { AnalysisResult, ResumeVersion, CompanyJob, JobApplication, CoachMessage } from '../types'
import {
  ANALYSIS_STORAGE_KEY,
  VERSION_STORAGE_KEY,
  COMPANY_STORAGE_KEY,
  APPLICATIONS_STORAGE_KEY,
  COACH_STORAGE_KEY,
} from '../config'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function notifyExtensionBridge() {
  if (typeof window === 'undefined') return
  try {
    window.postMessage(
      {
        source: 'hirely-app',
        type: 'HIRELY_SYNC_STATE',
        payload: {
          analyses: getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY),
          applications: getStore<JobApplication>(APPLICATIONS_STORAGE_KEY),
        },
      },
      '*',
    )
  } catch { /* bridge broadcast is best-effort */ }
}

function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
  if (key === ANALYSIS_STORAGE_KEY || key === APPLICATIONS_STORAGE_KEY) {
    notifyExtensionBridge()
  }
}

// ─── Analyses ──────────────────────────────────────────────
export function listAnalyses(): AnalysisResult[] {
  return getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getAnalysis(id: string): AnalysisResult | null {
  return getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY).find(a => a.id === id) ?? null
}

export function saveAnalysis(data: Omit<AnalysisResult, 'id' | 'createdAt' | 'updatedAt'>): AnalysisResult {
  const now = new Date().toISOString()
  const record: AnalysisResult = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  const list = getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY)
  list.push(record)
  setStore(ANALYSIS_STORAGE_KEY, list)
  return record
}

export function updateAnalysis(id: string, updates: Partial<AnalysisResult>): AnalysisResult | null {
  const list = getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY)
  const idx = list.findIndex(a => a.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }
  setStore(ANALYSIS_STORAGE_KEY, list)
  return list[idx]
}

export function deleteAnalysis(id: string): boolean {
  const list = getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY)
  const filtered = list.filter(a => a.id !== id)
  if (filtered.length === list.length) return false
  setStore(ANALYSIS_STORAGE_KEY, filtered)
  return true
}

export function duplicateAnalysis(id: string): AnalysisResult | null {
  const original = getAnalysis(id)
  if (!original) return null
  const now = new Date().toISOString()
  const dup: AnalysisResult = {
    ...original,
    id: generateId(),
    fileName: `${original.fileName} (copy)`,
    createdAt: now,
    updatedAt: now,
    jobMatch: undefined,
    rewritten: undefined,
    jobTarget: undefined,
  }
  const list = getStore<AnalysisResult>(ANALYSIS_STORAGE_KEY)
  list.push(dup)
  setStore(ANALYSIS_STORAGE_KEY, list)
  return dup
}

// ─── Versions ──────────────────────────────────────────────
export function listVersions(): ResumeVersion[] {
  return getStore<ResumeVersion>(VERSION_STORAGE_KEY)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getVersion(id: string): ResumeVersion | null {
  return getStore<ResumeVersion>(VERSION_STORAGE_KEY).find(v => v.id === id) ?? null
}

export function saveVersion(data: Omit<ResumeVersion, 'id' | 'createdAt' | 'updatedAt'>): ResumeVersion {
  const now = new Date().toISOString()
  const record: ResumeVersion = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  const list = getStore<ResumeVersion>(VERSION_STORAGE_KEY)
  list.push(record)
  setStore(VERSION_STORAGE_KEY, list)
  return record
}

export function updateVersion(id: string, updates: Partial<ResumeVersion>): ResumeVersion | null {
  const list = getStore<ResumeVersion>(VERSION_STORAGE_KEY)
  const idx = list.findIndex(v => v.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }
  setStore(VERSION_STORAGE_KEY, list)
  return list[idx]
}

export function deleteVersion(id: string): boolean {
  const list = getStore<ResumeVersion>(VERSION_STORAGE_KEY)
  const filtered = list.filter(v => v.id !== id)
  if (filtered.length === list.length) return false
  setStore(VERSION_STORAGE_KEY, filtered)
  return true
}

export function duplicateVersion(id: string): ResumeVersion | null {
  const original = getVersion(id)
  if (!original) return null
  const now = new Date().toISOString()
  const dup: ResumeVersion = {
    ...original,
    id: generateId(),
    name: `${original.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  }
  const list = getStore<ResumeVersion>(VERSION_STORAGE_KEY)
  list.push(dup)
  setStore(VERSION_STORAGE_KEY, list)
  return dup
}

// ─── Company jobs (candidate ranking) ──────────────────────
export function listCompanyJobs(): CompanyJob[] {
  return getStore<CompanyJob>(COMPANY_STORAGE_KEY)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getCompanyJob(id: string): CompanyJob | null {
  return getStore<CompanyJob>(COMPANY_STORAGE_KEY).find(j => j.id === id) ?? null
}

export function saveCompanyJob(data: Omit<CompanyJob, 'id' | 'createdAt' | 'updatedAt'>): CompanyJob {
  const now = new Date().toISOString()
  const record: CompanyJob = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  const list = getStore<CompanyJob>(COMPANY_STORAGE_KEY)
  list.push(record)
  setStore(COMPANY_STORAGE_KEY, list)
  return record
}

export function updateCompanyJob(id: string, updates: Partial<CompanyJob>): CompanyJob | null {
  const list = getStore<CompanyJob>(COMPANY_STORAGE_KEY)
  const idx = list.findIndex(j => j.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }
  setStore(COMPANY_STORAGE_KEY, list)
  return list[idx]
}

export function deleteCompanyJob(id: string): boolean {
  const list = getStore<CompanyJob>(COMPANY_STORAGE_KEY)
  const filtered = list.filter(j => j.id !== id)
  if (filtered.length === list.length) return false
  setStore(COMPANY_STORAGE_KEY, filtered)
  return true
}

// ─── Job Applications (Progress Tracking) ──────────────────
export function listApplications(): JobApplication[] {
  return getStore<JobApplication>(APPLICATIONS_STORAGE_KEY)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getApplication(id: string): JobApplication | null {
  return getStore<JobApplication>(APPLICATIONS_STORAGE_KEY).find(a => a.id === id) ?? null
}

export function saveApplication(data: Omit<JobApplication, 'id' | 'updatedAt'>): JobApplication {
  const now = new Date().toISOString()
  const record: JobApplication = {
    ...data,
    id: generateId(),
    updatedAt: now,
  }
  const list = getStore<JobApplication>(APPLICATIONS_STORAGE_KEY)
  list.push(record)
  setStore(APPLICATIONS_STORAGE_KEY, list)
  return record
}

export function updateApplication(id: string, updates: Partial<JobApplication>): JobApplication | null {
  const list = getStore<JobApplication>(APPLICATIONS_STORAGE_KEY)
  const idx = list.findIndex(a => a.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() }
  setStore(APPLICATIONS_STORAGE_KEY, list)
  return list[idx]
}

export function deleteApplication(id: string): boolean {
  const list = getStore<JobApplication>(APPLICATIONS_STORAGE_KEY)
  const filtered = list.filter(a => a.id !== id)
  if (filtered.length === list.length) return false
  setStore(APPLICATIONS_STORAGE_KEY, filtered)
  return true
}

// ─── AI Resume Coach Messages ──────────────────────────────
export function listCoachMessages(resumeId?: string): CoachMessage[] {
  const key = resumeId ? `${COACH_STORAGE_KEY}:${resumeId}` : COACH_STORAGE_KEY
  return getStore<CoachMessage>(key)
}

export function saveCoachMessage(message: CoachMessage, resumeId?: string): void {
  const key = resumeId ? `${COACH_STORAGE_KEY}:${resumeId}` : COACH_STORAGE_KEY
  const list = getStore<CoachMessage>(key)
  list.push(message)
  setStore(key, list)
}

export function clearCoachMessages(resumeId?: string): void {
  const key = resumeId ? `${COACH_STORAGE_KEY}:${resumeId}` : COACH_STORAGE_KEY
  try {
    localStorage.removeItem(key)
  } catch {}
}
