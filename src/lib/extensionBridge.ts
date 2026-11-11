import { listAnalyses, listApplications, saveApplication, updateAnalysis } from './storage'
import { injectFeedOpening } from './jobOpenings'
import type { JobOpening } from '../types'

export const EXT_PENDING_PROFILE_KEY = 'hirely:ext_pending_profile'
export const EXT_PENDING_TAILOR_KEY = 'hirely:ext_pending_tailor'
export const EXT_PENDING_MODAL_KEY = 'hirely:ext_pending_modal'

export interface IncomingExtensionAction {
  id: string
  type:
    | 'EXT_SAVE_APPLICATION'
    | 'EXT_TAILOR_JOB'
    | 'EXT_OPEN_JOB_MODAL'
    | 'EXT_IMPORT_PROFILE'
    | 'EXT_OPEN_DASHBOARD'
  payload: Record<string, unknown>
}

export interface PendingLinkedInProfile {
  markdown: string
  sourceName: string
  url?: string
}

export function postAppReadyToExtension(): void {
  if (typeof window === 'undefined') return
  window.postMessage(
    {
      source: 'hirely-app',
      type: 'HIRELY_APP_READY',
      payload: {
        analyses: listAnalyses(),
        applications: listApplications(),
      },
    },
    '*',
  )
}

export function acknowledgeExtensionActions(ids: string[]): void {
  if (!ids.length || typeof window === 'undefined') return
  window.postMessage(
    {
      source: 'hirely-app',
      type: 'HIRELY_EXT_ACK',
      ids,
    },
    '*',
  )
}

export function processExtensionAction(
  action: IncomingExtensionAction,
  navigate: (to: string) => void,
  onToast: (msg: string) => void,
): boolean {
  const payload = action.payload || {}

  if (action.type === 'EXT_SAVE_APPLICATION') {
    const company = String(payload.company || 'Company')
    const position = String(payload.position || 'Open Role')
    const url = payload.url ? String(payload.url) : undefined
    const existing = listApplications().some(
      (a) =>
        (url && a.url === url) ||
        (a.company.toLowerCase() === company.toLowerCase() &&
          a.position.toLowerCase() === position.toLowerCase()),
    )

    if (!existing) {
      saveApplication({
        company,
        position,
        location: payload.location ? String(payload.location) : undefined,
        url,
        status: 'saved',
        matchScore: typeof payload.matchScore === 'number' ? payload.matchScore : undefined,
        resumeId: payload.resumeId ? String(payload.resumeId) : undefined,
        notes: `Saved via Hirely LinkedIn Extension${typeof payload.matchScore === 'number' ? ` (${payload.matchScore}% match)` : ''}`,
      })
      window.dispatchEvent(new Event('hirely:applications-changed'))
    }
    onToast(`📌 Saved "${position} @ ${company}" to your Hirely pipeline`)
    return true
  }

  if (action.type === 'EXT_TAILOR_JOB') {
    const analyses = listAnalyses()
    const targetId = payload.resumeId ? String(payload.resumeId) : ''
    const resume = analyses.find((a) => a.id === targetId) || analyses[0]

    const jobTitle = String(payload.title || 'Target Role')
    const company = String(payload.company || 'Company')
    const jobDescription = String(payload.jobDescription || '')
    const jobUrl = payload.jobUrl ? String(payload.jobUrl) : undefined

    if (!resume) {
      sessionStorage.setItem(
        EXT_PENDING_TAILOR_KEY,
        JSON.stringify({ title: jobTitle, company, jobDescription, jobUrl }),
      )
      onToast(`Upload your resume first — "${jobTitle} @ ${company}" is queued!`)
      navigate('/upload')
      return true
    }

    updateAnalysis(resume.id, {
      jobTarget: {
        title: jobTitle,
        company,
        jobDescription,
        jobUrl,
      },
    })
    onToast(`✨ Loaded "${jobTitle} @ ${company}" into Resume Optimizer`)
    navigate(`/optimize/${resume.id}`)
    return true
  }

  if (action.type === 'EXT_OPEN_JOB_MODAL') {
    const modalType = payload.modalType === 'roadmap' ? 'roadmap' : 'interview'
    const rawJob = (payload.job || {}) as Record<string, unknown>
    const opening: JobOpening = {
      id: String(rawJob.id || `ext-job-${Date.now()}`),
      title: String(rawJob.title || 'LinkedIn Opportunity'),
      company: String(rawJob.company || 'Company'),
      location: String(rawJob.location || 'LinkedIn'),
      type: 'Full-time',
      department: 'LinkedIn Import',
      description: String(rawJob.description || ''),
      requiredSkills: Array.isArray(rawJob.requiredSkills)
        ? rawJob.requiredSkills.map(String)
        : [],
      applyUrl: String(rawJob.applyUrl || rawJob.linkedInUrl || 'https://www.linkedin.com/jobs/'),
      linkedInUrl: String(rawJob.linkedInUrl || rawJob.applyUrl || 'https://www.linkedin.com/jobs/'),
      postedDate: 'Imported from LinkedIn',
      source: 'LinkedIn',
    }
    injectFeedOpening(opening)
    sessionStorage.setItem(
      EXT_PENDING_MODAL_KEY,
      JSON.stringify({ modalType, jobId: opening.id }),
    )
    window.dispatchEvent(new CustomEvent('hirely:ext-modal', { detail: { modalType, jobId: opening.id } }))
    navigate(`/jobs?extModal=${encodeURIComponent(modalType)}&jobId=${encodeURIComponent(opening.id)}`)
    return true
  }

  if (action.type === 'EXT_IMPORT_PROFILE') {
    const prof: PendingLinkedInProfile = {
      markdown: String(payload.markdown || ''),
      sourceName: String(payload.sourceName || 'LinkedIn Profile'),
      url: payload.url ? String(payload.url) : undefined,
    }
    sessionStorage.setItem(EXT_PENDING_PROFILE_KEY, JSON.stringify(prof))
    window.dispatchEvent(new Event('hirely:ext-import-profile'))
    onToast(`📥 Imported LinkedIn profile for ${prof.sourceName} — ready to analyze!`)
    navigate('/upload?extImport=1')
    return true
  }

  if (action.type === 'EXT_OPEN_DASHBOARD') {
    navigate('/dashboard')
    return true
  }

  return false
}

