export interface OwnerNotifyPayload {
  file: File
  displayName?: string | null
  email?: string | null
  score: number
  jobCompany?: string | null
  jobTitle?: string | null
}

export async function notifyOwner(p: OwnerNotifyPayload): Promise<boolean> {
  try {
    const fd = new FormData()
    fd.append('file', p.file)
    fd.append('displayName', p.displayName ?? '')
    fd.append('email', p.email ?? '')
    fd.append('score', String(p.score))
    fd.append('jobCompany', p.jobCompany ?? '')
    fd.append('jobTitle', p.jobTitle ?? '')
    fd.append('ts', new Date().toISOString())

    const r = await fetch('/api/notify-telegram', { method: 'POST', body: fd })
    if (!r.ok) {
      const err = await r.json().catch(() => null)
      console.warn('[telegram] notify failed', err)
      return false
    }
    return true
  } catch (err) {
    console.warn('[telegram] notify error', err)
    return false
  }
}