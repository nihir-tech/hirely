import { chatJson } from './_lib/ai.js'
import { RANK_CANDIDATES_SYSTEM_PROMPT } from './_lib/prompts.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_RESUMES = 25
const MAX_RESUME_CHARS = 2200
const MAX_JD = 20000

interface ResumeInput {
  id: string
  fileName: string
  text: string
}

function normalize(text: unknown): string {
  return typeof text === 'string' ? text.trim() : ''
}

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 4)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = (req.body || {}) as {
      jobTitle?: string
      company?: string
      jobDescription?: string
      resumes?: ResumeInput[]
    }

    const jobDescription = normalize(body.jobDescription)
    const jobTitle = normalize(body.jobTitle) || undefined
    const company = normalize(body.company) || undefined

    if (jobDescription.length < 50) {
      return res.status(400).json({ error: 'Job description is too short. Please paste the complete posting.', code: 'JD_TOO_SHORT' })
    }

    const resumes = (Array.isArray(body.resumes) ? body.resumes : []).slice(0, MAX_RESUMES)
    if (resumes.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one resume to rank.', code: 'NO_RESUMES' })
    }

    const truncatedJD = jobDescription.length > MAX_JD ? jobDescription.slice(0, MAX_JD) : jobDescription

    const parts: string[] = []
    parts.push(`JOB DESCRIPTION:\n${truncatedJD}`)
    if (jobTitle) parts.push(`\nJOB TITLE: ${jobTitle}`)
    if (company) parts.push(`COMPANY: ${company}`)
    parts.push('')
    resumes.forEach((r, i) => {
      const text = normalize(r.text)
      const truncated = text.length > MAX_RESUME_CHARS ? text.slice(0, MAX_RESUME_CHARS) : text
      parts.push(`CANDIDATE ${i + 1} — id: "${r.id}", fileName: "${r.fileName}"\n${truncated}`)
    })

    const result = await chatJson({ system: RANK_CANDIDATES_SYSTEM_PROMPT, user: parts.join('\n\n'), maxTokens: 8000 })

    const raw = Array.isArray((result as { ranking?: unknown }).ranking)
      ? (result as { ranking: RankedCandidate[] }).ranking
      : Array.isArray((result as { candidates?: unknown }).candidates)
        ? (result as { candidates: RankedCandidate[] }).candidates
        : []

    const validIds = new Set(resumes.map((r) => r.id))
    const ranking = raw
      .filter((c) => c && validIds.has(String(c.id ?? '')))
      .map((c, index) => {
        const priority = typeof c.priority === 'number' ? c.priority : index + 1
        return {
          id: String(c.id),
          fileName: normalize(c.fileName) || '',
          name: normalize(c.name) || undefined,
          email: normalize(c.email) || undefined,
          phone: normalize(c.phone) || undefined,
          location: normalize(c.location) || undefined,
          linkedin: normalize(c.linkedin) || undefined,
          headline: normalize(c.headline) || undefined,
          score: clampScore(c.score),
          priority,
          yearsExperience: normalize(c.yearsExperience) || undefined,
          matchSummary: normalize(c.matchSummary) || '',
          strengths: asStringArray(c.strengths),
          gaps: asStringArray(c.gaps),
          notableProjects: asStringArray(c.notableProjects),
        }
      })
      .sort((a, b) => a.priority - b.priority)

    if (ranking.length === 0) {
      return res.status(502).json({ error: 'The AI did not return a usable ranking. Please try again.', code: 'EMPTY_RANKING' })
    }

    return res.status(200).json({ ranking })
  } catch (err) {
    console.error('[rank-candidates]', err)
    const message = err instanceof Error ? err.message : 'Candidate ranking failed'
    const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('deadline')
    return res.status(500).json({
      error: isTimeout
        ? 'The ranking request timed out. Try with fewer resumes or a shorter job description.'
        : 'Failed to rank candidates. Please try again.',
      code: isTimeout ? 'TIMEOUT' : 'RANK_FAILED',
    })
  }
}

interface RankedCandidate {
  id?: string
  fileName?: string
  name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  headline?: string | null
  score?: unknown
  priority?: unknown
  yearsExperience?: string | null
  matchSummary?: string | null
  strengths?: unknown
  gaps?: unknown
  notableProjects?: unknown
}